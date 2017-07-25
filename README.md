# NeoCities Node.js Client Library
A node.js library for interacting with the [NeoCities](https://neocities.org/api) api.

## Installation

```
$ npm install neocities
```

## Usage

First, require the library and initialize:

``` javascript
var NeoCities = require('neocities')
var api = new NeoCities('YOURUSERNAME', 'YOURPASSWORD')
```

### Uploading files to your site

``` javascript
// local file path is ./index.js, saved on site as derp.js

api.upload([
  {name: 'derp.js', path: './index.js'}
], function(error, resp) {
  console.error(error)
  console.log(resp)
})
```

### Deleting files from your site

``` javascript
api.delete(['derp.js'], function(error, resp) {
  console.error(error)
  console.log(resp)
})
```

### Get site info (hits, et cetera)

``` javascript
api.info(function(error, resp) {
  console.error(error)
  console.log(resp)
})
```

``` javascript
api.info('youpi', function(error, resp) {
  console.error(error)
  console.log(resp)
})
```
