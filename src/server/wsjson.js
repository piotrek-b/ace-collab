const util = require('util')
const { Duplex } = require('stream')

function WebSocketJSONStream(ws) {
  // Make work with or without 'new'
  if (!(this instanceof WebSocketJSONStream)) return new WebSocketJSONStream(ws)
  Duplex.call(this, { objectMode: true })
  this.ws = ws

  ws.on('message', (msg) => {
    const parsedMsg = JSON.parse(msg)
    if (parsedMsg.a !== 'op' || !this.ws.readOnly) {
      this.push(parsedMsg)
    }
  })
  ws.on('close', () => {
    this.push(null) // end readable stream
    this.end() // end writable stream

    this.emit('close')
    this.emit('end')
  })

  this.on('error', () => {
    ws.close()
  })
  this.on('end', () => {
    ws.close()
  })
}

util.inherits(WebSocketJSONStream, Duplex)

// eslint-disable-next-line no-underscore-dangle
WebSocketJSONStream.prototype._read = function () {
}

// eslint-disable-next-line no-underscore-dangle
WebSocketJSONStream.prototype._write = function (msg, encoding, next) {
  this.ws.send(JSON.stringify(msg))
  next()
}

module.exports = WebSocketJSONStream
