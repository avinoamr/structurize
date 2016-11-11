module.exports.type = "wdl";
var INDEX0_SIG = "#Version:";
var INDEX1_SIG = "#Fields:"

module.exports.is = function isWDL( sample ) {
    var result = sample.toString().split( "\n" );
    return (result[0].indexOf(INDEX0_SIG) > -1 && 
            result[1].indexOf(INDEX1_SIG) > -1);
}

module.exports.parser = function () {
    return require( "wdl-stream" )();
}

module.exports.requires = [ "wdl-stream" ]
