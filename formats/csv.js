module.exports.type = "csv";
var DEFAULT_DELIMITER = ','

module.exports.is = function isCSV( sample, delimiter ) {
    var useDelimiter = delimiter || DEFAULT_DELIMITER;
    return sample.toString().split( "\n" )[ 0 ].indexOf( useDelimiter ) != -1;
}

module.exports.parser = function ( delimiter ) {
    var useDelimiter = delimiter || DEFAULT_DELIMITER;
    var csvparse = require( "csv-parse" );
    return csvparse({ 
        skip_empty_lines: true, 
        escape: "\\", 
        columns: true,
        relax: true, 
        delimiter: useDelimiter
    })
}

module.exports.requires = [ "csv-parse" ]
