module.exports.type = "csv";
var DEFAULT_DELIMITER = ','

module.exports.is = function isCSV( sample, options ) {
    options = options || {}
    return Boolean( options.delimiter ) ||
        sample.toString().split( "\n" )[ 0 ].indexOf( DEFAULT_DELIMITER ) != -1;
}

module.exports.parser = function ( options ) {
    var useDelimiter = options.delimiter || DEFAULT_DELIMITER;
    var csvparse = require( "csv-parse" );
    return csvparse({
        skip_empty_lines: true,
        escape: "\\",
        columns: options.columns || true,
        relax: true,
        delimiter: useDelimiter
    })
}

module.exports.requires = [ "csv-parse" ]
