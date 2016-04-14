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
    return require( "tar" ).Parse();
}

module.exports.requires = [ "tar" ]
