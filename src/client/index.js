import axios from 'axios'
import sharedb from 'sharedb/lib/client'
import isEmpty from 'lodash/isEmpty'

import { ErrorTypes, MessageTypes } from '../../consts'


const configSchema = {
  on: {
    op: () => () => {},
  },
  subscribe: () => () => {},
  server: {
    docId: '',
    host: '',
    port: '',
    ssl: false,
  },
}

const getToken = (docId, username) => {
  const tokensStringified = localStorage.getItem('ace_collab_tokens')

  if (tokensStringified) {
    const tokens = JSON.parse(tokensStringified)

    if (typeof tokens[docId] !== 'object') {
      return ''
    }
    return tokens[docId][username] || ''
  }

  return ''
}

const saveToken = (token, docId, username) => {
  const tokensStringified = localStorage.getItem('ace_collab_tokens')

  if (tokensStringified) {
    const tokens = JSON.parse(tokensStringified)

    if (typeof tokens[docId] !== 'object') {
      tokens[docId] = {}
    }

    tokens[docId][username] = token

    localStorage.setItem('ace_collab_tokens', JSON.stringify(tokens))
  } else {
    localStorage.setItem('ace_collab_tokens', JSON.stringify({
      [docId]: {
        username: token,
      },
    }))
  }
}

const defaultAskForAccess = (message) => {
  const accessGranted = window.confirm(message.payload)
  return accessGranted
}

const onReady = (config, docId, socket, askForAccess) => (
  new Promise((res, rej) => {
    const {
      on,
      subscribe,
      server,
    } = config
    const {
      host,
      port,
      username,
      ssl,
    } = server
    const protocolEnd = ssl ? 's' : ''

    socket.addEventListener('message', async (msg) => {
      const message = JSON.parse(msg.data)

      if (message.type === MessageTypes.ACCESS) {
        const accessGranted = await askForAccess(message)

        if (accessGranted) {
          socket.send(JSON.stringify({ type: MessageTypes.GRANTED }))
        } else {
          socket.send(JSON.stringify({ type: MessageTypes.DENIED }))
        }
      }

      if (message.type === MessageTypes.GRANTED) {
        const shareDBSocket = new WebSocket(`ws${protocolEnd}://${host}:${port}/sharedb/${docId}?username=${username}&token=${message.payload}`)
        saveToken(message.payload, docId, username)
        const connection = new sharedb.Connection(shareDBSocket)

        const doc = connection.get('codes', docId)

        doc.subscribe(subscribe(doc))

        Object.keys(on).forEach((event) => {
          doc.on(event, on[event](doc))
        })

        doc.on('load', () => res({
          doc,
          username,
          token: message.payload,
          readOnly: message.readOnly,
        }))
      } else if (message.type === MessageTypes.DENIED) {
        rej(new Error(ErrorTypes.ACCESS_DENIED))
      } else if (message.type === MessageTypes.SESSION_NOT_AVAILABLE) {
        rej(new Error(ErrorTypes.SESSION_NOT_AVAILABLE))
      }
    })
  })
)

const loadShareDBDoc = async (config = configSchema, askForAccess = defaultAskForAccess) => {
  const {
    server,
  } = config
  const {
    host,
    port,
    ssl,
    username,
  } = server
  let {
    docId,
  } = server
  const protocolEnd = ssl ? 's' : ''

  let token

  if (isEmpty(docId)) {
    let response
    try {
      response = await axios.post(`http${protocolEnd}://${host}:${port}/code`)
    } catch (error) {
      throw new Error(ErrorTypes.CONNECTION_ERROR)
    }
    docId = response.data.id
    // eslint-disable-next-line prefer-destructuring
    token = response.data.token
  } else {
    token = getToken(docId, username)
  }

  // Open WebSocket connection to ShareDB server
  let socket

  try {
    if (token) {
      socket = new WebSocket(`ws${protocolEnd}://${host}:${port}/auth/${docId}?username=${username}&token=${token}`)
    } else {
      socket = new WebSocket(`ws${protocolEnd}://${host}:${port}/auth/${docId}?username=${username}`)
    }
  } catch (error) {
    throw new Error(ErrorTypes.CONNECTION_ERROR)
  }

  return onReady(config, docId, socket, askForAccess)
}

export default loadShareDBDoc
