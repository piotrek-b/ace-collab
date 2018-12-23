const uuid = require('uuid')
const http = require('http')
const express = require('express')
const ShareDB = require('sharedb')
const WebSocket = require('ws')
const WebSocketJSONStream = require('websocket-json-stream')

const shareDB = new ShareDB()

const createDoc = () => (
  new Promise((res) => {
    const id = uuid()
    const connection = shareDB.connect()
    const doc = connection.get('codes', id)

    doc.fetch((err) => {
      if (err) throw err
      if (doc.type === null) {
        doc.create({ code: '' }, () => res(id))
        return
      }
      res(id)
    })
  })
)

const startServer = () => {
  const expressInstance = express()
  const httpServer = http.createServer(expressInstance)

  expressInstance.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
  });

  expressInstance.post('/code', async (req, res) => {
    const id = await createDoc()

    res.send(JSON.stringify({ id }))
  })

  const webSocketServer = new WebSocket.Server({ server:httpServer })

  webSocketServer.on('connection', (ws) => {
    const webSocketJSONStream = new WebSocketJSONStream(ws)
    shareDB.listen(webSocketJSONStream)
  })

  httpServer.listen(3000)
  console.log('Listening on http://localhost:3000')
}

startServer()
