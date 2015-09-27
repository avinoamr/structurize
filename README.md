# structurize
Text format hinting library for estimating the format of a given input string and generic parsing API. The use case is that you receive some input file from a user and need to estimate what format it's in and how to parse it.

Currently supports the following:

* **json** (including [json5](http://json5.org/)), parsing with [json5stream](npmjs.com/package/json5stream)
* **csv**, parsing with [csv-parse](https://www.npmjs.com/package/csv-parse)
* **tsv**, parsing with [csv-parse](https://www.npmjs.com/package/csv-parse)
* **querystring**, parsing with [qs-stream](npmjs.com/package/qs-stream)

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



