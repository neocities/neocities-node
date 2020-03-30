var fs       = require('fs')
var http     = require('http')
var https    = require('https')
var path     = require('path')
var url      = require('url')
var qs       = require('querystring')
var FormData = require('form-data')

function NeoCities(user, pass, opts) {
  if (typeof pass == 'object' || pass == undefined) {
    this.key = user
  }
  this.opts = opts || (typeof pass == 'object' ? pass : {})
  if (!this.opts.key && !this.key) {
    this.user = user
    this.pass = pass
  }
  else {
    this.opts.key = this.opts.key || true
  }
  this.url = url.parse(this.opts.url || 'https://neocities.org')
  this.siteurl = this.opts.siteurl ? url.parse(this.ops.siteurl) : null
  this.client = this.url.protocol == 'https:' ? https : http
  if (this.opts.key && !this.key) {
    this.get('key', null, function (res) {
        this.key = res.api_key
        if (typeof this.opts.key == 'function') this.opts.key(this)
    }, user, pass)
  }
}

NeoCities.prototype.download = function(files, callback) {
  console.log(files)
  var i = 0
  var that = this
  var returning = false
  
  if (!this.siteurl) {
    this.info(function (resp) {
      that.siteurl = url.parse(that.url.protocol + '//' + (resp.info.domain || resp.info.sitename + '.' + that.url.hostname))
      dwnldFile()
    })
  }
  else dwnldFile()
  
  function dwnldFile() {
    if (i < files.length) {
      if (files[i].path) {
        var file = fs.createWriteStream(files[i].path)
        file.on('finish', function() {file.close((dwnldFile))})
        that.client.get(that.siteurl.href + files[i].name.replace(/^\/?/, '/'),
                        function(data) {return data.pipe(file)})
      }
//            else {
//                returning = true
//                that.client.request(that.siteurl.href + files[i].name.replace(/^\/?/, '/'),
// .                                  function (data) {returnData[files[i].name] = data})
//            }
      i ++
    }
    else if (typeof callback == 'function' && !returning)
      callback({status:'success'})
  }
}

NeoCities.prototype.get = function(method, args, callback, user, pass) {
  var opts = {
    method: 'get',
    host: this.url.hostname,
    port: this.url.port,
    path: '/api/' + method + (args ? '?' + qs.stringify(args) : '')
  }
  
  if (!this.key) {
    opts.auth = (user || this.user) + ':' + (pass || this.pass)
  }
  else {
    opts.headers = {Authorization: 'Bearer ' + this.key}
  }

  var request = this.client.request(opts, function(res) {
    var body = ''

    res.on('data', function (chunk) {
      body += chunk
    })

    res.on('end', function() {
      var resObj = JSON.parse(body)
      callback(resObj)
    })
  })
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

NeoCities.prototype.list = function(path, callback) {
  var args = null
  
  if (typeof path == 'function')
    callback = path
  else if (typeof path == 'string')
    args = {path: path}
  
  this.get('list', args, callback)
}

NeoCities.prototype.post = function(method, args, callback) {
  var form = new FormData()
  
  for(var i = 0; i < args.length; i ++)
    form.append(args[i].name, args[i].value)
  
  var opts = {
    method: 'post',
    host: this.url.hostname,
    port: this.url.port,
    path: '/api/' + method,
    headers: form.getHeaders()
  }
  
  if (!this.key) {
    opts.auth = this.user + ':' + this.pass
  }
  else {
    opts.headers.Authorization = 'Bearer ' + this.key
  }
  
  var request = this.client.request(opts, function(res) {
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

NeoCities.prototype.delete = function(filenames, callback) {
  var args = []
  
  for(var i = 0; i < filenames.length; i ++)
    args.push({name: 'filenames[]', value: filenames[i]})
  
  this.post('delete', args, callback)
}

NeoCities.prototype.upload = function(files, callback) {
  var args = []
  
  for(var i = 0; i < files.length; i ++)
    args.push({name: files[i].name, value: fs.createReadStream(files[i].path)})
  
  this.post('upload', args, callback)
}

NeoCities.prototype.push = function(localPath, webPath, excludes, callback) {
  if (typeof webPath == 'function' || typeof webPath == 'object') {
    callback = excludes
    excludes = webPath
    webPath = '/'
  }
  if (typeof excludes == 'function') {
    callback = excludes
    excludes = []
  }
  var activePaths = []
  var that = this
  excludes = excludes.map(function(dir) {return path.resolve(localPath, dir)})
  
  list(localPath)
  
  function list(dir) {
    activePaths.push(dir)
    fs.readdir(dir, parseFiles)
    
    function parseFiles(err, dirContents) {
      dirContents = dirContents.map(function(file) {return path.resolve(dir, file)})
      var uploadArgs = dirContents.filter(function(file) {
        if (excludes.includes(path.relative(localPath, file)) ||
            excludes.some(function(exclude) {
              return (exclude.constructor == RegExp && file.match(exclude)) ||
                     (typeof exclude == 'function' && exclude(file))
            })) {
          return false
        }
        
        var fileData = fs.statSync(file)
        
        if (fileData.isDirectory()) {
          list(file)
        }
        else {
          return true
        }
      }).map(function(file) {
        return {
          path: file, name: webPath.replace(/[/\\]?$/, '/') +
                path.relative(path.resolve(localPath), file)
        }
      })
      activePaths.splice(activePaths.indexOf(dir), 1)
      that.upload(uploadArgs, activePaths.length ? function() {} : callback)
    }
  }
}

NeoCities.prototype.pull = function(localPath, webPath, excludes, callback) {
  if (typeof webPath == 'function' || typeof webPath == 'object') {
    callback = excludes
    excludes = webPath
    webPath = '/'
  }
  if (typeof excludes == 'function') {
    callback = excludes
    excludes = []
  }
  
  var that = this
  
  fs.exists(localPath, createIfFailed)
  
  function createIfFailed(pathExists) {
    if (!pathExists) {
      fs.mkdir(localPath, {}, startDownload)
    }
    else {
      startDownload()
    }
  }
  
  function startDownload() {
    that.list(filterDirs)

    function filterDirs(files) {
      if (files.result == 'success') {
        that.download(files.files.filter(function(file)  {
          return !file.is_directory &&
                 (!path.relative(webPath, file.path).match(/^\.\.[/\\]/) || webPath == '/') &&
                 !excludes.includes(path.relative(webPath, file.path)) &&
                 !excludes.some(function(exclude) {
                   return (exclude.prototype == RegExp && file.path.match(exclude)) ||
                          (typeof exclude == 'function' && exclude(file.path)) ||
                          (typeof exclude == 'string' && path.relative(exclude, path.relative(webPath, file.path)).match(/^\.\.[/\\]/))
                 })
        }).map(function(file) {
          return {
            path: localPath.replace(/[/\\]?$/, '/') + path.relative(webPath, file.path),
            name: file.path
          }
        }), callback)
      }
    }
  }
}

module.exports = NeoCities
