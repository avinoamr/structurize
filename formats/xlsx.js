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

    // We will need to split the cell names to columns and rows based on
    // regexp that will fit data like "A1", "C9"
    var CellRegexp = /([A-Z]+)([0-9]+)/i
    workbook.SheetNames.forEach(function (name) {
        var sheet = workbook.Sheets[name]
        var data = []
        // Find the first row of the table
        try {
            var sortedSheet = Object.keys(sheet).sort(function(a,b) {
                // Push metadata to the end of the array
                if (a[0] === '!') {return 1}
                else if (b[0] === '!') {return -1}
                return a.match(CellRegexp)[2] - b.match(CellRegexp)[2]
            })
            var CellinFirstRow = sortedSheet[0]
            var headerRow = CellinFirstRow.match(CellRegexp)[2]
        } catch (err) {
            console.warn('No data found in sheet')
        }

        for (var k in sheet) {
            if (k[0] == '!') {
                continue // Only keep normal cells, not metadata.
            }

            // k is a cell name, i.e. "A1", "C9". Split it into the row and col
            var comps = k.match(CellRegexp)
            var col = comps[1]
            var row = comps[2]
            if (row == headerRow) {
                continue // first row is reserved as the header line
            }

            if (!data[row]) {
                data[row] = { __sheet: name }
            }

            var header = sheet[col + headerRow]
            if (header) {
                // extract the header name value from the first row for this col
                var h =  header.v
                // extract the formatted value (if applicable)
                // https://www.npmjs.com/package/xlsx#cell-object
                data[row][h] = sheet[k].w || sheet[k].v
            } else {
                let err = new Error('Unable to parse xlsx file')
                done(err)
                return
            }
        }

        // the data list may contain some empty undefined cells (at rows 0 and
        // 1). Filter these out.
        data.filter(Boolean).forEach(function (d) {
            this.push(d)
        }, this)
    }, this)

    done(null)
}
