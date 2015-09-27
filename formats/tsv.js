module.exports.type = "tsv";

module.exports.is = function isTSV( sample ) {
    return sample.split( "\n" )[ 0 ].indexOf( "\t" ) != -1;
}

module.exports.parser = function () {
    var csvparse = require( "csv-parse" );
    return csvparse({ 
        skip_empty_lines: true, 
        escape: "\\", 
        columns: true, 
        delimiter: "\t" 
    })
}

module.exports.requires = [ "csv-parse" ]
