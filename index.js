var stream = require( "stream" );
var util = require( "util" );

var SAMPLE_SIZE = 16 * 1024; // 16kb

module.exports = structurize;


function structurize ( options ) {
    return new Stream( options );
}

structurize.formats = [
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
        throw new Error( "Parser unrecognized format" );
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
}

Stream.prototype._transform = function ( data, enc, done ) {
    if ( !( data instanceof Buffer ) ) {

        // already structured
        return done( null, data );
    }

    if ( this.parser ) {
        // parser found, delegate to it
        return this.parser.write( data, enc, done );
    }

    this._sample = Buffer.concat( [ this._sample, data ] );
    if ( this._sample.length < this._sampleSize ) {
        // need more data to determine the format
        return done();
    }

    this.start( done );
}

Stream.prototype._flush = function ( done ) {
    if ( !this.parser ) {
        this.start( done );
    }

    this._flushcb = done;
}

Stream.prototype.start = function ( done ) {
    var type = this.guess( this._sample );
    var that = this;

    try {
        var parser = structurize.parser( type )
    } catch ( err ) {
        return done( err );
    }

    this.parser = parser
        .on( "data", function ( data ) {
            that.push( data );
        })
        .on( "error", function ( err ) {
            if ( that._flushcb ) {
                that._flushcb( err );
            } else {
                that.emit( "error", err );
            }
        })
        .on( "end", function () {
            that._flushcb();
        });

    // start by writing the sampled data that has been collected until now
    this.parser.write( this._sample );

    done();
}


Stream.prototype.guess = function ( sample ) {
    return structurize.guess( sample )
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




