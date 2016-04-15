var assert = require( "assert" );
var zlib = require( "zlib" );
var s = require( "./index" );
var type;

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

it( "parses tar.gz", function ( done ) {
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


