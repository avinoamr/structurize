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
]


structurize.guess = function ( sample ) {
    for ( var i = 0 ; i < this.formats.length ; i += 1 ) {
        if ( this.formats[ i ].is( sample ) ) {
            return this.formats[ i ].type;
        }
    }
}

structurize.parser = function ( type ) {
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

    return format.parser()
}

structurize.Stream = Stream;

util.inherits( Stream, stream.Transform );
function Stream ( options ) {
    stream.Transform.call( this, { readableObjectMode: true } );

    this.options = options || {};
    this._sampleSize = this.options.sampleSize || SAMPLE_SIZE;
    this._sample = new Buffer( "" );
    this._totalWritten = 0;
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
        parser.end( function () {
            done();
        })
    }
}

Stream.prototype.start = function ( done ) {
    var type = this.guess( this._sample );
    var that = this;

    try {
        var parser = this.parser( type )
    } catch ( err ) {
        return done( err );
    }

    this._parser = parser
        .on( "data", function ( data ) {
            that.push( data );
        })
        .on( "error", function ( err ) {
            that.emit( "error", err );
        });

    // start by writing the sampled data that has been collected until now
    this._parser.write( this._sample, function () {
        done();
    });
}

// generic functions are wrapped here as methods for extensibility
Stream.prototype.guess = function ( sample ) {
    return structurize.guess( sample )
}

Stream.prototype.parser = function ( type ) {
    return structurize.parser( type )
}

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





