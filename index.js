var fs       = require('fs')
var http     = require('http')
var https    = require('https')
var path     = require('path')
var url      = require('url')
var FormData = require('form-data')

function NeoCities(user, pass, opts) {
  this.user = user
  this.pass = pass
  this.opts = opts || {}
  this.url = url.parse(this.opts.url || 'https://neocities.org')
}

NeoCities.prototype.uploadFiles = function(files, callback) {
  var form = new FormData()

  for(i=0;i<files.length;i++)
    form.append(files[i].name, fs.createReadStream(files[i].path))

  var client = this.url.protocol == 'https:' ? https : http

  var request = client.request({
    method: 'post',
    host: this.url.hostname,
    port: this.url.port,
    path: '/api/upload',
    headers: form.getHeaders(),
    auth: this.user+':'+this.pass
  }, function(res) {
    var body = ''

    res.on('data', function (chunk) {
      body += chunk
    })

    res.on('end', function() {
      var resObj = JSON.parse(body)
      callback(resObj)
    })
  })

  form.pipe(request)
}

NeoCities.prototype.uploadFile = function(name, path, callback) {
  this.uploadFiles([{name: name, path: path}], callback)
}

module.exports = NeoCities
