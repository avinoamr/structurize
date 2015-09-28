module.exports.type = "json";

module.exports.is = function isJson( sample ) {
    sample = sample.toString().trim()
    return sample[ 0 ] == "{" || sample[ 0 ] == "[";
}

module.exports.parser = function () {
    return require( "jsonstream2" ).parse();
}

module.exports.requires = [ "jsonstream2" ]
