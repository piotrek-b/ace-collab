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
  })

  expressInstance.post('/code', async (req, res) => {
    const id = await createDoc()

    res.send(JSON.stringify({ id }))
  })

  const wss1 = new WebSocket.Server({ noServer: true })
  const wss2 = new WebSocket.Server({ noServer: true })

  wss1.on('connection', (ws) => {
    const webSocketJSONStream = new WebSocketJSONStream(ws)
    shareDB.listen(webSocketJSONStream)
  })

  let clients = []
  const histories = {}
  const MessageTypes = {
    HISTORY: 'HISTORY',
    MESSAGE: 'MESSAGE',
    USER_JOINED: 'USER_JOINED',
    USER_LEFT: 'USER_LEFT',
  }
  const broadcast = (targetDocId, messageToSend) => clients.forEach(({ client, docId }) => {
    if (client.readyState === 1) {
      if (targetDocId === docId) {
        client.send(JSON.stringify(messageToSend))
      }
    }
  })

  wss2.on('connection', (ws, request) => {
    let userName = null
    const docId = request.url.split('/')[2]
    if (!histories[docId]) {
      histories[docId] = []
    }
    const history = histories[docId]
    const index = clients.push({ client: ws, docId }) - 1

    ws.send(JSON.stringify({ type: MessageTypes.HISTORY, payload: history }))

    ws.on('message', (message) => {
      const messageData = JSON.parse(message)

      if (messageData.type === MessageTypes.USER_JOINED) {
        userName = messageData.payload
      }

      const messageToSend = {
        ...messageData,
        metadata: { author: userName, time: new Date().toJSON() },
      }
      history.push(messageToSend)

      broadcast(docId, messageToSend)
    })

    ws.on('close', () => {
      const messageToSend = {
        type: MessageTypes.USER_LEFT,
        payload: userName,
        metadata: { author: userName, time: new Date().toJSON() },
      }
      history.push(messageToSend)
      broadcast(docId, messageToSend)
      clients = clients.filter((client, clientIndex) => clientIndex !== index)
    })
  })

  httpServer.on('upgrade', (request, socket, head) => {
    if (request.url === '/sharedb') {
      wss1.handleUpgrade(request, socket, head, (ws) => {
        wss1.emit('connection', ws, request)
      })
    } else if (request.url.startsWith('/ui')) {
      wss2.handleUpgrade(request, socket, head, (ws) => {
        wss2.emit('connection', ws, request)
      })
    } else {
      socket.destroy()
    }
  })

  httpServer.listen(3000)
}

module.exports = startServer
