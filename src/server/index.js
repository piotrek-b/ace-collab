const uuid = require('uuid')
const http = require('http')
const express = require('express')
const ShareDB = require('sharedb')
const WebSocket = require('ws')
const WebSocketJSONStream = require('websocket-json-stream')

const backend = new ShareDB()

// Create initial document then fire callback
const createDoc = () => (
  new Promise((res) => {
    const id = uuid()
    const connection = backend.connect()
    const doc = connection.get('codes', id)

    doc.fetch((err) => {
      if (err) throw err
      if (doc.type === null) {
        console.log('null')
        doc.create({ lines: [''] }, () => res(id))
        return
      }
      res(id)
    })
  })
)

const startServer = () => {
  // Create a web server to serve files and listen to WebSocket connections
  const app = express()
  const server = http.createServer(app)

  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
  

  app.post('/code', async (req, res) => {
    const id = await createDoc()

    res.send(JSON.stringify({ id }))
  })

  // Connect any incoming WebSocket connection to ShareDB
  const wss = new WebSocket.Server({ server })
  wss.on('connection', (ws) => {
    const stream = new WebSocketJSONStream(ws)
    backend.listen(stream)
  })

  server.listen(3000)
  console.log('Listening on http://localhost:3000')
}

startServer()
