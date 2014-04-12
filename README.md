# NeoCities Node.js Client Library
A node.js library for interacting with the [NeoCities](https://neocities.org/api) api.

## Installation

```
  $ npm install neocities --global
```

## Usage

### Uploading files

``` javascript
var NeoCities = require('neocities')
var api = new NeoCities('YOURUSERNAME', 'YOURPASSWORD')

// local file is index.js, saved on site as derp.js

api.upload([
  {name: 'derp.js', path: './index.js'}
], function(resp) {
  console.log(resp)
})
```

### Deleting files

``` javascript
var NeoCities = require('neocities')
var api = new NeoCities('YOURUSERNAME', 'YOURPASSWORD')

api.delete(['derp.js'], function(resp) {
  console.log(resp)
})
```

### Get site info (hits, et cetera)

``` javascript
api.info(function(resp) {
  console.log(resp)
})
```

``` javascript
api.info('youpi', function(resp) {
  console.log(resp)
})
```