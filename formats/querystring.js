module.exports.type = "querystring";

var REGEX = /^\??([\w-]+(=[\w-]*)(&[\w-]+(=[\w-]*)?)*)?$/

module.exports.is = function isQueryString( sample ) {
    var firstLine = sample.split( "\n" )
        .filter( function ( line ) {
            return !!line.trim()
        })[ 0 ];


    return firstLine && firstLine.match( REGEX );
}

module.exports.parser = function () {
    return require( "qs-stream" )();
}

module.exports.requires = [ "qs-stream" ]
