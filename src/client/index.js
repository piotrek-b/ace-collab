import axios from 'axios'
import sharedb from 'sharedb/lib/client'
import isEmpty from 'lodash/isEmpty'

import { MessageTypes } from '../../consts'


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

const loadShareDBDoc = (config = configSchema) => (
  new Promise(async (res, rej) => {
    const {
      on,
      subscribe,
    } = config
    const {
      server,
    } = config
    const {
      host,
      port,
      ssl,
    } = server
    let {
      username,
      docId,
    } = server
    const protocolEnd = ssl ? 's' : ''
    let token
    username = window.prompt('username')
    docId = window.prompt('getDocId')

    if (isEmpty(docId)) {
      const response = await axios.post(`http${protocolEnd}://${host}:${port}/code`)
      docId = response.data.id
      token = response.data.token
    } else {
      token = getToken(docId, username)
    }

    // Open WebSocket connection to ShareDB server
    let socket

    if (token) {
      socket = new WebSocket(`ws${protocolEnd}://${host}:${port}/auth?username=${username}&token=${token}`)
    } else {
      socket = new WebSocket(`ws${protocolEnd}://${host}:${port}/auth?username=${username}`)
    }

    socket.addEventListener('message', (msg) => {
      const message = JSON.parse(msg.data)

      if (message.type === MessageTypes.ACCESS) {
        const result = window.confirm(message.payload)

        if (result) {
          socket.send(JSON.stringify({ type: MessageTypes.GRANTED }))
        } else {
          socket.send(JSON.stringify({ type: MessageTypes.DENIED }))
        }
      }

      if (message.type === MessageTypes.GRANTED) {
        const shareDBSocket = new WebSocket(`ws${protocolEnd}://${host}:${port}/sharedb?username=${username}&token=${message.payload}`)
        saveToken(message.payload, docId, username)
        const connection = new sharedb.Connection(shareDBSocket)

        const doc = connection.get('codes', docId)

        doc.subscribe(subscribe(doc))

        Object.keys(on).forEach((event) => {
          doc.on(event, on[event](doc))
        })

        doc.on('load', () => res(doc))
      } else if (message.type === MessageTypes.DENIED) {
        rej()
      }
    })
  })
)

export default loadShareDBDoc
