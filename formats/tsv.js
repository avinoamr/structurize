module.exports.type = "tsv";

module.exports.is = function isTSV( sample ) {
    return sample.toString().split( "\n" )[ 0 ].indexOf( "\t" ) != -1;
}

module.exports.parser = function () {
    var csvparse = require( "csv-parse" );
    return csvparse({ 
        skip_empty_lines: true, 
        escape: "\\", 
        columns: true, 
        delimiter: "\t",
        relax: true, 
    })
}

module.exports.requires = [ "csv-parse" ]
