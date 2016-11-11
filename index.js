var stream = require( "stream" );
var util = require( "util" );

var SAMPLE_SIZE = 16 * 1024; // 16kb

module.exports = structurize;

function structurize ( options ) {
    return new Stream( options );
}

structurize.formats = [
    require( "./formats/tar" ),
    require( "./formats/gzip" ),
    require( "./formats/json" ),
    require( "./formats/csv" ),
    require( "./formats/tsv" ),
    require( "./formats/querystring" ),
    require( "./formats/wdl" ),
]


structurize.guess = function ( sample, options ) {
    for ( var i = 0 ; i < this.formats.length ; i += 1 ) {
        if ( this.formats[ i ].is( sample, options ) ) {
            return this.formats[ i ].type;
        }
    }
}

structurize.parser = function ( type, options ) {
    var format = structurize.formats.filter( function ( format ) {
        return format.type == type;
    })[ 0 ];

    if ( !format ) {
        throw new UnrecognizedFormatError();
    }

    if ( format.requires ) {
        format.requires.forEach( function ( path ) {
            try {
                require( path );
            } catch ( err ) {
                if ( err.code == "MODULE_NOT_FOUND" ) {
                    err = new MissingDependencyError( format.type, path );
                }
                throw err;
            }
        })
    }

    return format.parser( options )
}

structurize.multi = function ( options ) {
    return new Multi( options )
}

structurize.Stream = Stream;

util.inherits( Stream, stream.Transform );
function Stream ( options ) {
    stream.Transform.call( this, { readableObjectMode: true } );

    this.options = options || {};
    this._sampleSize = this.options.sampleSize || SAMPLE_SIZE;
    this._sample = new Buffer( "" );
    this._totalWritten = 0;
    this._mapfn = function( d ) { return d } // see Stream.prototype.map
    this.type = null; // type unidentified
}

Stream.prototype._transform = function ( data, enc, done ) {
    this._totalWritten += data.toString().trim().length;

    if ( this._parser ) {
        // parser found, delegate to it
        return this._parser.write( data, enc, function () {
            // note: we disregard the callback error because we're already
            // forwarding all error events.
            done();
        });
    }

    this._sample = Buffer.concat( [ this._sample, data ] );
    if ( this._sample.length < this._sampleSize ) {
        // need more data to determine the format
        return done();
    }

    this.start( done );
}

Stream.prototype._flush = function ( done ) {
    var that = this;
    if ( this._totalWritten == 0 ) {
        return done();
    }

    if ( this._parser ) {
        // parser already started, just end it
        return end( this._parser );
    }
    
    // parser didn't start yet because the sample size is too small,
    // start it now...
    this.start( function ( err ) {
        if ( err ) {
            return done( err );
        }

        end( this._parser ); // ...and then immediately end it.
    }.bind( this ) )

    function end( parser ) {

        // if successful, wait for the data to be consumed and then 
        // end it.
        parser.on( "end", done );

        // handle the case of error where there's no 'end' event
        parser.end( function ( err ) {
            if ( err ) {
                done( err );
            }
        })
    }
}

Stream.prototype.start = function ( done ) {
    this.type = this.guess( this._sample );
    var that = this;

    try {
        var parser = this.parser( this.type, this.options )
    } catch ( err ) {
        return done( err );
    }

    this._parser = parser
        .on( "data", function ( data ) {
            data = that._mapfn( data )
            if ( data !== undefined ) {
                that.push( data );
            }
        })
        .on( "error", function ( err ) {
            that.emit( "error", err );
        });

    // start by writing the sampled data that has been collected until now
    this._parser.write( this._sample, function () {
        done();
    });
}

// map allows defining a mapper function to be invoked for every parsed output
// from the stream, useful for decorating data objects before returning them, or
// filtering them out altogether by returning undefined.
Stream.prototype.map = function ( mapfn ) {
    this._mapfn = mapfn;
    return this;
}

// generic functions are wrapped here as methods for extensibility
Stream.prototype.guess = function ( sample ) {
    return structurize.guess( sample, this.options )
}

Stream.prototype.parser = function ( type, options ) {
    return structurize.parser( type, options )
}


// multi stream is a wrapper around the structurize stream that supports input
// from several different inputs with possibly different formats. It's useful
// for cases where you need all of the input to be parsed uniformly and returned
// a single stream of data.
//
// In order to differentiate between the different files, pass a `name`
// attribute in the input Buffer or String. Otherwise, all input will be parsed
// with the same format (the first encountered).
//
// For example:
//      var json = new String("{}")
//      json.name = "file1.json"
//      multi.write( json )
//      
//      var csv = new String("hello, world")
//      csv.name = "file2.csv"
//      multi.write( csv )
//
// This multi stream will fire the `subparser` event, with the name and nested
// parser stream whenever a new parser is created. This can be used to further
// configure the nested structure as needed.
structurize.MultiStream = Multi;

util.inherits( Multi, stream.Transform )
function Multi( options ) {
    options = options || {};
    options.objectMode = true;

    stream.Transform.call( this, options )

    this._parsers = {};
    this._flushcb = null;
}

Multi.prototype._transform = function ( data, enc, done ) {
    var isString = data instanceof String ||
        data instanceof Buffer ||
        typeof data === "string";

    // only strings & buffers can be structurized. otherwise, pass as-is and
    // leave early
    if ( !isString ) {
        done( null, data )
        return
    }

    // create the structurize stream for this input name
    // allows multiple structurize parsers for different files/inputs
    var name = data.name || "";
    if ( !this._parsers[ name ] ) {
        this._parsers[ name ] = structurize()
            .on( "data", this.push.bind( this ) )
            .on( "error", this.emit.bind( this, "error" ) )
            .on( "end", function () {

                // we're done with this parser, remove it from the list
                delete this._parsers[ name ];

                // are we done? only when there are no parsers left and we're
                // waiting for a flush (flush callback exists)
                var plen = Object.keys( this._parsers ).length
                if ( this._flushcb && plen == 0 ) {
                    this._flushcb()
                }
            }.bind( this ) )

        // notify listeners on the new parser
        this.emit( "subparser", name, this._parsers[ name ] )
    }

    // write to that parser
    this._parsers[ name ].write( data, enc, done )
}

Multi.prototype._flush = function ( cb ) {
    this._flushcb = cb;

    // end all parsers.
    var empty = true
    Object.keys( this._parsers ).forEach( function ( p ) {
        empty = false;
        this._parsers[ p ].end()
    }, this )

    // if no parsers exist, just finish now.
    if ( empty ) {
        this._flushcb()
    }
}



// errors
util.inherits( MissingDependencyError, Error )
function MissingDependencyError( type, path ) {
    this.name = "MissingDependencyError";
    this.code = "MODULE_NOT_FOUND";
    this.message = [
        "Missing parser dependency for", 
        type + ":", '"' + path + '".',
        "The", '"' + path + '"', "module is not a dependency",
        "of structurize."
    ].join( " " )
}

util.inherits( UnrecognizedFormatError, Error )
function UnrecognizedFormatError( buffer ) {
    this.name = "UnrecognizedFormatError";
    this.code = "UNRECOGNIZED_FORMAT";
    this.buffer = buffer;
    this.message = "Unable to determine the format";
}
