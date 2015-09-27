var assert = require( "assert" );
var s = require( "./index" );
var type;

it( "guesses json", function () {

    type = s.guess( JSON.stringify({ "hello": "world" }) )
    assert.equal( type, "json" );

    type = s.guess( "   " + JSON.stringify({ "hello": "world" }) + "  " )
    assert.equal( type, "json" );

    type = s.guess( JSON.stringify([ 1, 2, 3 ]) )
    assert.equal( type, "json" );

    type = s.guess( "     " + JSON.stringify([ 1, 2, 3 ]) + "   " );
    assert.equal( type, "json" );

})

it( "guesses csv", function () {
    type = s.guess( "hello,world,foo,bar" );
    assert.equal( type, "csv" );
})

it( "guesses tsv", function () {
    type = s.guess( "hello\tworld\tfoo\tbar" );
    assert.equal( type, "tsv" );
})

it( "guesses query strings", function () {
    type = s.guess( "?hello=world&foo=bar" );
    assert.equal( type, "querystring" );

    type = s.guess( "hello=world&foo=bar" );
    assert.equal( type, "querystring" );
})

it( "no type for empty sample", function () {
    type = s.guess( "" );
    assert.equal( typeof type, "undefined" );
})
