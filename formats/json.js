module.exports.type = "json";

module.exports.is = function isJson( sample ) {
    sample = sample.toString().trim()
    return sample[ 0 ] == "{" || sample[ 0 ] == "[";
}

module.exports.parser = function () {
    return require( "json5stream" )();
}

module.exports.requires = [ "json5stream" ]
