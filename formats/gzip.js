var overflow = require( "overflow" )
var structurize = require( "../index" );

module.exports.type = "gzip";

module.exports.is = function isGzip( sample ) {
    if ( !( sample instanceof Buffer ) ) {
        return false; // only buffers can represent compressed data
    }

    // http://www.zlib.org/rfc-gzip.html
    var id1 = sample[ 0 ];
    var id2 = sample[ 1 ];
    var cm = sample[ 2 ];
    return id1 === 0x1f
        && id2 === 0x8b
        && cm >= 0 && cm <= 8;
}

module.exports.parser = function () {
    return overflow()
        .substream( require( "zlib" ).createGunzip() )
        .substream( structurize() ); // parse nested formats
}

module.exports.requires = []