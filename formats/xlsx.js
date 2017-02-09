module.exports.type = "xlsx";

var XLSX_MAGIC = new Buffer([0x50, 0x4b, 0x03, 0x04])
var XLS_MAGIC = new Buffer([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])

module.exports.is = function isCSV( sample, options ) {
    if (!(sample instanceof Buffer)) {
        return false
    }

    return sample.slice(0, XLSX_MAGIC.length).equals(XLSX_MAGIC)
        || sample.slice(0, XLS_MAGIC.length).equals(XLS_MAGIC)
}

module.exports.parser = function ( options ) {
    var xlsx = require( "xlsx" );
    console.log('p', xlsx)
}

module.exports.requires = [ "xlsx" ]
