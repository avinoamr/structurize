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
    var xlsx = require( "xlsx" )
    var buff = new Buffer([])
    var t = new stream.Transform({ readableObjectMode: true })
    t._transform = function (data, enc, done) {
        buff = Buffer.concat([buff, data])
        done()
    }

    t._flush = function (done) {
        try {
            var workbook = xlsx.read(buff)
        } catch (err) {
            done(err)
            return
        }

        var regexp = /([A-Z]+)([0-9]+)/i

        var all = []
        workbook.SheetNames.forEach(function (name) {
            var sheet = workbook.Sheets[name]
            var data = []
            for (var k in sheet) {
                if (k[0] == '!') {
                    continue
                }

                var comps = k.match(regexp)
                var col = comps[1]
                var row = comps[2]

                if (row == '1') {
                    continue
                }

                if (!data[row]) {
                    data[row] = { __sheet: name }
                }

                var h = sheet[col + '1'].v
                data[row][h] = sheet[k].v
            }

            data.filter(Boolean).forEach(function (d) {
                this.push(d)
            }, this)
        }, this)
        done(null)
    }

    return t
}

module.exports.requires = [ "xlsx" ]
