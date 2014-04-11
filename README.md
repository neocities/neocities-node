# NeoCities Node.js Client Library
A node.js library for interacting with the [NeoCities](https://neocities.org/api) api.

## Installation

```
  $ npm install neocities --global
```

## Usage

``` javascript
var NeoCities = require('neocities')

var api = new NeoCities('YOURUSERNAME', 'YOURPASSWORD')

// Upload a file called local.html from your computer, which will be named newfile.html on the site.

api.uploadFile('newfile.html', './local.html', function(resp) {
  if(resp.result == 'error')
    throw new Error(resp.error_type+' - '+resp.message)

  console.log(resp)
})
```