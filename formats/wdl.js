module.exports.type = "WDL";

module.exports.is = function isWDL( sample, options ) {
    options = options || {};
    var result = sample.toString().split( "\n" );
    console.log('^^^^^^^^^^^^LOOK:', result);
    return false;
}