var assert = require( "assert" );
var zlib = require( "zlib" );
var s = require( "./index" );
var type;

it( "guesses xlsx", function () {
    var spreadsheet = require( "fs" ).readFileSync( "./test.xlsx" );
    type = s.guess(spreadsheet)
    assert.equal( type, "xlsx" )
})

it( "guesses json", function () {

    type = s.guess( new Buffer( JSON.stringify({ "hello": "world" }) ) )
    assert.equal( type, "json" );

    type = s.guess( "   " + JSON.stringify({ "hello": "world" }) + "  " )
    assert.equal( type, "json" );

    type = s.guess( JSON.stringify([ 1, 2, 3 ]) )
    assert.equal( type, "json" );

    type = s.guess( "     " + JSON.stringify([ 1, 2, 3 ]) + "   " );
    assert.equal( type, "json" );

})

it( "guesses csv", function () {
    type = s.guess( new Buffer( "hello,world,foo,bar" ) );
    assert.equal( type, "csv" );
})

it( "guesses csv with 1 column", function () {
    type = s.guess( new Buffer( "hello\nworld\nfoo\nbar" ) );
    assert.equal( type, "csv" );
})

it( "guesses tsv", function () {
    type = s.guess( new Buffer( "hello\tworld\tfoo\tbar" ) );
    assert.equal( type, "tsv" );
})

it( "guesses query strings", function () {
    type = s.guess( new Buffer( "?hello=world&foo=bar" ) );
    assert.equal( type, "querystring" );

    type = s.guess( "hello=world&foo=bar" );
    assert.equal( type, "querystring" );
})

it( "guesses tar", function () {
    var tarball = require( "fs" ).readFileSync( "./test.tar" );
    type = s.guess( tarball );
    assert.equal( type, "tar" );
})

it( "parses xlsx", function ( done ) {
    var spreadsheet = require( "fs" ).readFileSync( "./test.xlsx" );
    var data = [];
    s.parser( "xlsx" )
        .on( "data", function (d) {
            data.push(d)
        })
        .once("end", function () {
            assert.deepEqual( data, [
                { __sheet: "2017",
                    Movie: "La La Land",
                    Nominations: 5,
                    Date: "2017-01-01"
                },
                { __sheet: "2017",
                    Movie: "Moonlight",
                    Nominations: 5,
                    Date: "2017-01-02"
                },
                { __sheet: "2017",
                    Movie: "Fences",
                    Nominations: 4,
                    Date: "2017-01-03"
                },
                { __sheet: "2017",
                    Movie: "Lion",
                    Nominations: 4,
                    Date: "2017-01-04"
                },
                { __sheet: "2016",
                    Movie: "Spotlight",
                    Nominations: 5,
                    Date: "2016-01-01"
                },
                { __sheet: "2016",
                    Movie: "Room",
                    Nominations: 4,
                    Date: "2016-01-02"
                },
                { __sheet: "2016",
                    Movie: "The Big Short",
                    Nominations: 4,
                    Date: "2016-01-03"
                },
                { __sheet: "2016",
                    Movie: "The Revenant",
                    Nominations: 4,
                    Date: "2016-01-04"
                }
            ])
            done();
        })
        .once( "error", done )
        .end(spreadsheet)
})

it( "parses tar", function ( done ) {
    var tarball = require( "fs" ).readFileSync( "./test.tar" );
    var data = [];
    s.parser( "tar" )
        .on( "data", function ( d ) {
            data.push( d )
        })
        .once( "end", function () {
            assert.deepEqual( data, [
                { ok: 1 },
                { hello: 1, world: 2 }
            ])
            done();
        })
        .once( "error", done )
        .end( tarball )
})

it( "parses csv with a configured delimiter", function ( done ) {
    var csv = require( "fs" ).readFileSync( "./test.csv" );
    var data = [];
    s.parser( "csv", { delimiter: "$" } )
        .on( "data", function ( d ) {
            data.push( d )
        })
        .once( "end", function () {
            assert.deepEqual( data, [
                { hello: '1', world: '2' }
            ])
            done();
        })
        .once( "error", done )
        .end( csv )
})

it( "parse csv with a configured escape", function ( done ) {
    var csv = require( "fs" ).readFileSync( "./test-quote-escape.csv" );
    var data = [];
    s.parser( "csv", { escape: '"' } )
        .on( "data", function ( d ) {
            data.push( d )
        })
        .once( "end", function () {
            assert.deepEqual( data, [
                {
                    Year: '1997',
                    Make: 'Ford',
                    Model: 'E350',
                    Description: 'ac, abs, moon',
                    Price: '3000.00'
                }, {
                    Year : '1999',
                    Make : 'Chevy',
                    Model : 'Venture "Extended Edition"',
                    Description : '',
                    Price : '4900.00'
                }, {
                    Year: '1999',
                    Make: 'Chevy',
                    Model: 'Venture "Extended Edition, Very Large"',
                    Description: '',
                    Price: '5000.00'
                }, {
                    Year: '1996',
                    Make: 'Jeep',
                    Model: 'Grand Cherokee',
                    Description: 'MUST SELL!\nair, moon roof, loaded',
                    Price: '4799.00'
                },
            ])
            done();
        })
        .once( "error", done )
        .end( csv )
})

it('parse csv with a configured column', function(done) {
    var csv = require('fs').readFileSync('./test.csv');
    var columns = ['a', 'b']
    var data = [];
    s.parser('csv', {columns: columns, delimiter: "$"})
        .on('data', function(d){
            data.push(d)
        })
        .once('end', function () {
            assert.deepEqual(Object.keys(data[0]), columns)
            done()
        })
        .once('error', done)
        .end(csv)
})

it( "guesses gzip", function () {
    type = s.guess( zlib.gzipSync( "hello world" ) );
    assert.equal( type, "gzip" );
})

it( "parses gzip", function ( done ) {
    var data = [];
    s()
        .on( "data", function ( d ) {
            data.push( d );
        })
        .once( "end", function () {
            assert.deepEqual( data, [ { ok: 1 } ] );
            done();
        })
        .once( "error", done )
        .end( zlib.gzipSync( JSON.stringify( { ok: 1 } ) ) )
})

it( "parse fails on invalid gzipped format", function ( done ) {
    s.parser( "gzip" )
        .on( "data", function () {})
        .once( "end", function () {
            done( new Error( "Expecting error" ) );
        })
        .once( "error", function ( err ) {
            assert( /Unable to determine the format/gi.test( err.toString() ) );
            done();
        })
        .end( zlib.gzipSync( "hello world" ) );
})

it( "no type for empty sample", function () {
    type = s.guess( "" );
    assert.equal( typeof type, "undefined" );
})

it( "structurize guess and parse", function ( done ) {
    var data = [];
    s().on( "data", function ( d ) {
        data.push( d );
    })
    .once( "end", function () {
        assert.deepEqual( data, [ { ok: 1 } ] )
        done();
    })
    .once( "error", done )
    .end( JSON.stringify( { ok: 1 } ) )
})

it( "structurizes tar.gz", function ( done ) {
    var tarball = require( "fs" ).readFileSync( "./test.tar" );
    var data = [];
    s().on( "data", function ( d ) {
        data.push( d )
    })
    .once( "end", function () {
        assert.deepEqual( data, [
            { ok: 1 },
            { hello: 1, world: 2 }
        ])
        done();
    })
    .once( "error", done )
    .end( zlib.gzipSync( tarball ) )
})


it( "supports map and filter", function ( done ) {
    var data = [];

    var stream = s()
        .on( "data", function ( d ) {
            data.push(d)
        })
        .map(function ( d ) {
            if ( d.skip ) {
                return
            }

            d.foo = "bar"
            return d
        })
        .once( "end", function () {
            assert.deepEqual( data, [
                { hello: "world", foo: "bar" }
            ])
            done()
        })
        .once( "error", done );

    stream.write( JSON.stringify({ skip: true }) )
    stream.end( JSON.stringify({ hello: "world" }) )
})


it( "supports multiple files stream", function ( done ) {
    var tarball = require( "fs" ).readFileSync( "./test.tar" );
    var gzipped = zlib.gzipSync( tarball )
    gzipped.name = "test.tgz"

    var json = new Buffer( JSON.stringify({ "hello": "world" }) )
    json.name = "something.json"

    var data = []
    var m = s.multi()
        .on( "error", done )
        .on( "data", function ( d ) {
            data.push( d )
        })
        .on("end", function () {
            assert.deepEqual( data, [
                { foo: "bar" },
                { hello: "world", filename: "something.json" },
                { ok: 1, filename: "test.tgz" },
                { hello: 1, world: 2, filename: "test.tgz" }
            ])
            done()
        })
        .on( "subparser", function ( name, parser ) {
            parser.map(function ( d ) {
                d.filename = name
                return d
            })
        })

    m.write({ foo: "bar" })
    m.write( json )
    m.write( gzipped )
    m.end()
})
