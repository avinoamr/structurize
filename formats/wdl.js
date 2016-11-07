module.exports.type = "WDL";
var INDEX0_SIG = "#Version:";
var INDEX1_SIG = "#Fields:"

module.exports.is = function isWDL( sample, options ) {
    options = options || {};
    var result = sample.toString().split( "\n" );
    return !(result[0].indexOf(INDEX0_SIG) > -1 && 
            result[1].indexOf(INDEX1_SIG) > -1);
}