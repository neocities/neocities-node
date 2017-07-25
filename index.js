var fs       = require('fs')
var http     = require('http')
var https    = require('https')
var path     = require('path')
var url      = require('url')
var qs       = require('querystring')
var FormData = require('form-data')

function NeoCities(user, pass, opts) {
  this.user = user
  this.pass = pass
  this.opts = opts || {}
  this.url = url.parse(this.opts.url || 'https://neocities.org')
  this.client = this.url.protocol == 'https:' ? https : http
}

NeoCities.prototype.get = function(method, args, callback) {
  var path = '/api/'+method

  if(args)
    path += '?'+qs.stringify(args)

  var request = this._make_request({path: path}, callback)
  request.end()
}

NeoCities.prototype.info = function(sitename, callback) {
  var args = null

  if(typeof sitename == 'function')
    callback = sitename
  else if(typeof sitename == 'string')
    args = {sitename: sitename}

  this.get('info', args, callback)
}

NeoCities.prototype.post = function(method, args, callback) {
  var form = new FormData()
  var i

  for(i=0;i<args.length;i++)
    form.append(args[i].name, args[i].value)

  var request = this._make_request({
    method: 'post',
    path: '/api/'+method,
    headers: form.getHeaders(),
  })

  form.pipe(request)
}

NeoCities.prototype.delete = function(filenames, callback) {
  var args = []
  var i

  for(i=0;i<filenames.length;i++)
    args.push({name: 'filenames[]', value: filenames[i]})

  this.post('delete', args, callback)
}

NeoCities.prototype.upload = function(files, callback) {
  var args = []
  var i

  for(i=0;i<files.length;i++)
    args.push({name: files[i].name, value: fs.createReadStream(files[i].path)})

  this.post('upload', args, callback)
}

NeoCities.prototype._make_request = function(opts, callback) {
  return this.client.request({
    method: opts.method || 'get',
    host: this.url.hostname,
    port: this.url.port,
    path: opts.path,
    headers: opts.headers,
    auth: this.user+':'+this.pass
  }, function(res) {
    var body = ''

    res.on('error', function(error) {
      callback(error)
    })

    res.on('data', function (chunk) {
      body += chunk
    })

    res.on('end', function() {
      try {
        var resObj = JSON.parse(body)
      } catch(err) {
        return callback(err)
      }
      callback(null, resObj)
    })
  }).on("error", function(error) {
    callback(error)
  })
}

module.exports = NeoCities
