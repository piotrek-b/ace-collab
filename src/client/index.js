import sharedb from 'sharedb/lib/client'
import WebSocket from 'reconnecting-websocket'

// Open WebSocket connection to ShareDB server
const socket = new WebSocket('ws://localhost:3000');
const connection = new sharedb.Connection(socket);

const configSchema = {
  subscribe: () => {},
  on: {
    op: () => {},
  }
}

const loadShareDBDoc = (config = configSchema) => {
  return new Promise((res, rej) => {
    const doc = connection.get('examples', 'counter')
    
    const {
      subscribe,
      on,
    } = config

    doc.subscribe(subscribe(doc))

    for (event in on) {
      if (on.hasOwnProperty(event)) {
        doc.on(event, on[event](doc))
      }
    }

    doc.on('load', () => res(doc))
  })
}

export default loadShareDBDoc
