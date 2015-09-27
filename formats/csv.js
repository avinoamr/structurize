module.exports.type = "csv";

module.exports.is = function isCSV( sample ) {
    return sample.split( "\n" )[ 0 ].indexOf( "," ) != -1;
}

module.exports.parser = function () {
    var csvparse = require( "csv-parse" );
    return csvparse({ 
        skip_empty_lines: true, 
        escape: "\\", 
        columns: true 
    })
}

module.exports.requires = [ "csv-parse" ]
