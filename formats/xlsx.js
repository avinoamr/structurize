var util = require("util")
var stream = require("stream")
module.exports.type = "xlsx"

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
    return new Stream()
}

module.exports.requires = [ "xlsx" ]

util.inherits(Stream, stream.Transform)
function Stream() {
    stream.Transform.call(this, { readableObjectMode: true })
    this._buff = new Buffer([])
}

Stream.prototype._transform = function (data, enc, done) {
    this._buff = Buffer.concat([this._buff, data])
    done()
}

Stream.prototype._flush = function (done) {
    var xlsx = require( "xlsx" )
    try {
        var workbook = xlsx.read(this._buff)
    } catch (err) {
        done(err)
        return
    }

    var regexp = /([A-Z]+)([0-9]+)/i
    workbook.SheetNames.forEach(function (name) {
        var sheet = workbook.Sheets[name]
        var data = []
        for (var k in sheet) {
            if (k[0] == '!') {
                continue // Only keep normal cells, not metadata.
            }

            // k is a cell name, i.e. "A1", "C9". Split it into the row and col
            var comps = k.match(regexp)
            var col = comps[1]
            var row = comps[2]
            if (row == '1') {
                continue // first row is reserved as the header line
            }

            if (!data[row]) {
                data[row] = { __sheet: name }
            }

            // extract the header name value from the first row for this col
            var h = sheet[col + '1'].v
            data[row][h] = sheet[k].v
        }

        // the data list may contain some empty undefined cells (at rows 0 and
        // 1). Filter these out.
        data.filter(Boolean).forEach(function (d) {
            this.push(d)
        }, this)
    }, this)

    done(null)
}
