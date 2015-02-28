var parseUrl = require('parseurl')
  , inherits = require('util').inherits
  , WS = require('ws').Server
  , EventEmitter = require('events').EventEmitter
  , prefix = '/__lightserver__'
  , clientJsPath = prefix + '/reload-client.js'
  , triggerPath = prefix + '/trigger'

var clientJsContent = [
'var ws',
'function socket() {',
'  ws = new WebSocket("ws://" + window.location.host)',
'  ws.onmessage = function (e) {',
'    var data = JSON.parse(e.data)',
'    if (data.r) {',
'      location.reload()',
'    }',
'  }',
'}',
'socket()',
'setInterval(function () {',
'  if (ws) {',
'    if (ws.readyState !== 1) {',
'      socket()',
'    }',
'  } else {',
'    socket()',
'  }',
'}, 3000)'
].join('\n')

var emitter = new EventEmitter
  , wss

function lrmiddle() {}

lrmiddle.prototype.middleFunc = function lrmiddle(req, res, next) {
  var pathname = parseUrl(req).pathname
  if (parseUrl(req).pathname.indexOf(prefix) == -1) {
    next()
    return
  }

  if (req.method == 'GET' && pathname == clientJsPath) {
    res.writeHead(200)
    res.end(clientJsContent)
    return
  }

  if (pathname == triggerPath) {
    res.writeHead(200)
    res.end('ok')
    emitter.emit('reload')
    return
  }

  next()
}

lrmiddle.prototype.startWS = function(server) {
  wss = new WS({server: server})

  wss.on('connection', function (ws) {
    emitter.once('reload', function () {
      ws.send(JSON.stringify({r: Date.now().toString()}), function (e) {
        if (e) { console.log(e) }
      })
    })
  })
}

lrmiddle.prototype.triggerReload = function() {
  emitter.emit('reload')
}

module.exports = lrmiddle