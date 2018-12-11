const http = require('http')
const express = require('express')
const ShareDB = require('sharedb')
const WebSocket = require('ws')
const WebSocketJSONStream = require('websocket-json-stream')

const backend = new ShareDB()

// Create initial document then fire callback
const createDoc = () => (
  new Promise((res) => {
    const connection = backend.connect()
    const doc = connection.get('codes', 'counter')

    doc.fetch((err) => {
      if (err) throw err
      if (doc.type === null) {
        doc.create({ lines: [''] }, res)
        return
      }
      res()
    })
  })
)

const startServer = () => {
  // Create a web server to serve files and listen to WebSocket connections
  const app = express()
  app.use(express.static('static'))
  const server = http.createServer(app)

  // Connect any incoming WebSocket connection to ShareDB
  const wss = new WebSocket.Server({ server })
  wss.on('connection', (ws) => {
    const stream = new WebSocketJSONStream(ws)
    backend.listen(stream)
  })

  server.listen(3000)
  console.log('Listening on http://localhost:3000')
}

createDoc().then(startServer)
