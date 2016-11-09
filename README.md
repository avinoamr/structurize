# structurize
Text format hinting library for estimating the format of a given input string and generic parsing API. The use case is that you receive some input file from a user and need to estimate what format it's in and how to parse it.

Currently supports the following:

* **tar**, parsing with [tar](https://www.npmjs.com/package/tar)
* **gzip**, parsing with [zlib](https://nodejs.org/api/zlib.html)
* **json**, parsing with [jsonstream2](https://www.npmjs.com/package/jsonstream2)
* **csv**, parsing with [csv-parse](https://www.npmjs.com/package/csv-parse)
* **tsv**, parsing with [csv-parse](https://www.npmjs.com/package/csv-parse)
* **querystring**, parsing with [qs-stream](npmjs.com/package/qs-stream)
* **WebDistributionLog**, parsing with [wdl-stream](https://www.npmjs.com/package/wdl-stream)

> **NOTE**: it's generally a bad idea to "guess" the format of an input semi-structured text file, because there are endless edge cases. It's always advised to use an explicit format type from the user, using the file extension or otherwise. The library attempts to cover most obvious situations.

#### Usage

```
$ npm install structurize
```

```javascript
var structurize = require( "structurize" );

var type = structurize.guess( '{"hello":"world"}' ); // returns "json"
```

Then you can use parser library to parse your data, or you can use the internal generic parser [Transform stream](https://nodejs.org/api/stream.html#stream_class_stream_transform) for each format type:

```javascript
var stream = structurize.parser( type ); // any of the supported text formats, like "json" or "csv"
fs.createReadStream( "somefile.unknown" )
  .pipe( stream )
  .on( "data", function ( obj ) {
    // do something awesome with it
  })
```

> The `.parser()` function returns a parser stream from external libraries for each supported format type (listed above). However, these libraries are not a direct dependency of `structurize`. You'll have to npm install them separately.

Wrapping it all together: for the use-case of type-guessing and parsing, this library includes a convenience Transform stream that does both:

```javascript
fs.createReadStream( "somefile.unknown" )
  .pipe( structurize() ) // guess the type based on the first N-bytes, and parse it.
  .on( "data", function ( obj ) {
    // ...
  })
```

This `structurize()` stream supports a helper function for modifying/filtering the parsed output before pushing it out by defining a mapper function:

```javascript
structurize()
  .map(function (d) {
    d.name = "cookie"; 
    return d; // or return nothing (undefined) to filter it out.
  })
```

#### Multi

It's common to have multiple inputs with different formats, and wanting to parse all of them via a single stream, for example when reading a list of unidentified files.  `structurize.multi` is a helper stream supporting this use case:

```javascript
m = structurize.multi()
m.write({ hello: "world" }) // already an object, left as is.
m.write('{"foo":"bar"}') // identified and parsed as a json

m.on( "data", console.log ) // => { "hello": "world" }\n{ "foo": "bar" }
```

Of course, structurize needs to be able to differentiate between the different files in the stream in order to direct them to different sub-parsers. You can tag your input buffers/strings with their names, like a filename, to avoid having all of the inputs stream though to a single parser:

```javascript
var buf = new String('{"hello":"world"}')
buf.name = "filename1"
m.write(buf)
```

Finally, you may want to configure the individual sub-parsers with different options or mapper. The `multi` stream fires a `subparser` event whenever a new parser is created, along with its name and the parser object. You can configure this nested `structurize` stream individually:

```javascript
m.on("subparser", function( name, s ) {
  s.map( ... )
})
```



