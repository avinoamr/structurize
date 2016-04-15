var stream = require( "stream" );
var overflow = require( "overflow" )
var structurize = require( "../index" );

module.exports.type = "tar";

module.exports.is = function isTar( sample ) {
    if ( !( sample instanceof Buffer ) ) {
        return false; // only buffers can represent tarballs
    }

    // POSIX IEEE P1003.1
    // https://en.wikipedia.org/wiki/Tar_(computing)
    // var fname = sample.slice( 0, 100 );
    var mode = sample.slice( 100, 107 ).toString();
    var owner = sample.slice( 108, 115 ).toString();
    var group = sample.slice( 116, 123 ).toString();
    var size = sample.slice( 124, 135 ).toString();

    return mode && +mode > 111 && +mode < 777
        && owner && !isNaN( owner )
        && group && !isNaN( group )
        && size && !isNaN( size );
}

module.exports.parser = function () {
    var untar = require( "tar" ).Parse();

    // tar uses fstream which isn't a standard node stream doens't implement
    // the unpipe method required by overflow.
    var Readable = stream.Readable;
    var ReadableState = Readable.ReadableState;
    untar._readableState = new ReadableState( undefined, untar );
    untar.pipe = Readable.prototype.pipe;
    untar.unpipe = Readable.prototype.unpipe;

    // start a new structurize substream for every file in the tarball
    var out = new stream.PassThrough({ objectMode: true })
    untar.on( "entry", function ( entry ) {

        // pipe the file entry to a new structurize stream in order to support
        // multiple files with different formats
        entry.pipe( structurize() )
            .on( "error", untar.emit.bind( untar, "error" ) )
            .pipe( out ); // actual parser output
    })

    return overflow()
        .substream( untar )

        // disregard the untar output because it generates several structurize
        // substreams per file which are piped to the output pass-through stream
        // in order to support different files formats within the same tarball
        .substream( function () {} )
        .substream( out ); 
}

module.exports.requires = [ "tar" ]
