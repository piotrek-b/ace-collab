const uuid = require('uuid')
const http = require('http')
const express = require('express')
const ShareDB = require('sharedb')
const WebSocket = require('ws')
const WebSocketJSONStream = require('websocket-json-stream')
const url = require('url')
const cors = require('cors')

const MessageTypes = {
  HISTORY: 'HISTORY',
  MESSAGE: 'MESSAGE',
  USER_JOINED: 'USER_JOINED',
  USER_LEFT: 'USER_LEFT',
  GRANTED: 'GRANTED',
  DENIED: 'DENIED',
  ACCESS: 'ACCESS',
  SESSION_NOT_AVAILABLE: 'SESSION_NOT_AVAILABLE',
}

const clients = []
const histories = {}
const broadcast = (targetDocId, messageToSend) => clients.forEach(({ chatWSClient, docId }) => {
  if (!!chatWSClient && chatWSClient.readyState === 1) {
    if (targetDocId === docId) {
      chatWSClient.send(JSON.stringify(messageToSend))
    }
  }
})

const getToken = (req) => {
  const { query } = url.parse(req.url, true)
  const { username: name, token } = query

  return [name, token]
}

const getDocId = (request) => {
  const { pathname } = url.parse(request.url, true)

  return pathname.split('/')[2]
}

const allowConnection = (ws, reqToken) => {
  ws.send(JSON.stringify({
    type: MessageTypes.GRANTED,
    payload: reqToken,
  }))
}

const denyConnection = (ws) => {
  ws.send(JSON.stringify({ type: MessageTypes.DENIED }))
  ws.terminate()
}

const sendNoSessionInfo = (ws) => {
  ws.send(JSON.stringify({ type: MessageTypes.SESSION_NOT_AVAILABLE }))
  ws.terminate()
}

const askForAccess = (adminClient, username) => {
  if (adminClient.readyState === 1) {
    adminClient.send(JSON.stringify({
      type: MessageTypes.ACCESS,
      payload: username,
    }))

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => resolve(false), 30000)

      adminClient.on('message', (message) => {
        clearTimeout(timeoutId)
        const messageData = JSON.parse(message)

        if (messageData.type === MessageTypes.GRANTED) {
          resolve(true)
        } else if (messageData.type === MessageTypes.DENIED) {
          resolve(false)
        }
      })
    })
  }

  return Promise.resolve(false)
}

const onAccessGranted = (ws, docId, username, isClientThere, reqToken) => {
  const token = reqToken || uuid.v4()

  if (!isClientThere) {
    clients.push({
      docId,
      authWSClient: ws,
      token,
    })
  }

  allowConnection(ws, token)

  return {
    docId,
    username,
  }
}

const onTokenProvided = (ws, docId, username, reqToken) => new Promise((resolve, reject) => {
  const client = clients.find((c) => c.token === reqToken)
  const isClientThere = !!client

  if (!isClientThere) {
    denyConnection(ws)
    reject(new Error('There is no client with such token'))
  } else {
    client.authWSClient = ws
    resolve(onAccessGranted(ws, docId, username, true, reqToken))
  }
})

const onTokenNotProvided = (ws, docId, username) => new Promise(async (resolve, reject) => {
  const isThereDocId = !!clients.find((client) => client.docId === docId)

  if (!isThereDocId) {
    sendNoSessionInfo(ws)
    reject(new Error('Session not available'))
  } else {
    const admin = clients.find((client) => client.isAdmin && client.docId === docId)
    const isThereAdmin = !!admin

    if (!isThereAdmin) {
      denyConnection(ws)
      reject(new Error('Admin not logged in'))
    } else {
      const adminClient = admin.authWSClient

      const accessGranted = await askForAccess(adminClient, username)
      if (accessGranted) {
        resolve(onAccessGranted(ws, docId, username))
      } else {
        denyConnection(ws)
        reject(new Error('Access not provided'))
      }
    }
  }
})

const shareDB = new ShareDB({
  disableDocAction: true,
  disableSpaceDelimitedActions: true,
})

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

const postCode = async (req, res) => {
  const id = await createDoc()
  const token = uuid.v4()

  clients.push({
    docId: id,
    authWSClient: null,
    chatWSClient: null,
    shareDBWSClient: null,
    token,
    isAdmin: true,
  })

  res.send(JSON.stringify({
    id,
    token,
  }))
}

const authenticate = (ws, request) => {
  const docId = getDocId(request)
  const [username, reqToken] = getToken(request)

  if (reqToken) {
    return onTokenProvided(ws, docId, username, reqToken)
  }

  return onTokenNotProvided(ws, docId, username)
}

const authWSConnection = async (ws, request) => {
  try {
    await authenticate(ws, request)
  } catch (error) {
    console.error(error.message)
    ws.terminate()
  }
}

const chatWSConnection = async (ws, request) => {
  try {
    const docId = getDocId(request)

    const [username, reqToken] = getToken(request)
    const client = clients
      .find((c) => c.token === reqToken)

    if (!client) {
      throw new Error('Chat - Client not found')
    }

    client.chatWSClient = ws
    client.docId = docId

    if (!histories[docId]) {
      histories[docId] = []
    }
    const history = histories[docId]

    ws.send(JSON.stringify({
      type: MessageTypes.HISTORY,
      payload: history,
    }))

    ws.on('message', (message) => {
      const messageData = JSON.parse(message)

      const messageToSend = {
        ...messageData,
        metadata: {
          author: username,
          time: new Date().toJSON(),
        },
      }
      history.push(messageToSend)

      broadcast(docId, messageToSend)
    })

    ws.on('close', () => {
      const messageToSend = {
        type: MessageTypes.USER_LEFT,
        payload: username,
        metadata: {
          author: username,
          time: new Date().toJSON(),
        },
      }
      history.push(messageToSend)
      broadcast(docId, messageToSend)
    })
  } catch (error) {
    console.error(error.message)
    ws.terminate()
  }
}

const shareDBWsConnection = async (ws, request) => {
  try {
    const [, reqToken] = getToken(request)
    const client = clients
      .find((c) => c.token === reqToken)

    if (!client) {
      throw new Error('ShareDB - Client not found')
    }

    client.shareDBWSClient = ws

    const webSocketJSONStream = new WebSocketJSONStream(ws)
    shareDB.listen(webSocketJSONStream)
  } catch (error) {
    console.error(error.message)
    ws.terminate()
  }
}

const onUpgrade = (wss1, wss2, wss3) => (request, socket, head) => {
  if (request.url.includes('/sharedb')) {
    wss1.handleUpgrade(request, socket, head, (ws) => {
      wss1.emit('connection', ws, request)
    })
  } else if (request.url.startsWith('/ui')) {
    wss2.handleUpgrade(request, socket, head, (ws) => {
      wss2.emit('connection', ws, request)
    })
  } else if (request.url.startsWith('/auth')) {
    wss3.handleUpgrade(request, socket, head, (ws) => {
      wss3.emit('connection', ws, request)
    })
  } else {
    socket.destroy()
  }
}

const startServer = (options = {}) => {
  const expressInstance = express()
  const httpServer = http.createServer(expressInstance)

  let allowedOrigins = []

  try {
    allowedOrigins = options.allowedOrigins ? JSON.parse(options.allowedOrigins) : []
  } catch (error) {
    allowedOrigins = []
  }

  const port = options.port || 3333
  const host = options.host || '0.0.0.0'

  const corsOptions = {
    origin: (origin, callback) => {
      if (allowedOrigins.length === 0) {
        callback(null, true)
      } else if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback('Not allowed by CORS')
      }
    },
  }

  expressInstance.use(cors(corsOptions))

  expressInstance.post('/code', postCode)

  const wss1 = new WebSocket.Server({ noServer: true })
  const wss2 = new WebSocket.Server({ noServer: true })
  const wss3 = new WebSocket.Server({ noServer: true })

  wss1.on('connection', shareDBWsConnection)
  wss2.on('connection', chatWSConnection)
  wss3.on('connection', authWSConnection)

  httpServer.on('upgrade', onUpgrade(wss1, wss2, wss3))

  httpServer.listen(port, host)
  console.log(`Listening - host ${host}, port ${port}.`)
}

module.exports = startServer
