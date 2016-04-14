var assert = require( "assert" );
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
    type = s.guess( "one000644 000765 000024 00000000024 12703723146 012542" );
    assert.equal( type, "tar" );
})

it( "no type for empty sample", function () {
    type = s.guess( "" );
    assert.equal( typeof type, "undefined" );
})
