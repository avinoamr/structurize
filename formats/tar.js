
// POSIX IEEE P1003.1
// https://en.wikipedia.org/wiki/Tar_(computing)
// We want to relax the byte-range format in order to support plain
// strings that are read from a tarball, instead of requiring the 
// actual bytes array for parsing. 
const REGEXP = /^[^\s]+\d{6}\ \d{6}\ \d{6}\ \d{11}\ \d{11}/;

module.exports.type = "tar";

module.exports.is = function isTar( sample ) {
    var line = sample.toString().split( "\n" )[ 0 ];
    return REGEXP.test( line );
}

module.exports.parser = function () {
    var parser = require( "tar" ).Parser();
    parser.on( "entry", function () {

    })
}

module.exports.requires = [ "tar" ]