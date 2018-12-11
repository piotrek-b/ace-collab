import sharedb from 'sharedb/lib/client'
import WebSocket from 'reconnecting-websocket'

// Open WebSocket connection to ShareDB server
const socket = new WebSocket('ws://localhost:3000');
const connection = new sharedb.Connection(socket);

const configSchema = {
  docPath: [],
  on: {
    op: () => () => {},
  },
  subscribe: () => () => {},
}

const loadShareDBDoc = (config = configSchema) => (
  new Promise((res) => {
    const {
      docPath,
      on,
      subscribe,
    } = config

    const doc = connection.get(...docPath)

    doc.subscribe(subscribe(doc))

    Object.keys(on).forEach((event) => {
      doc.on(event, on[event](doc))
    })

    doc.on('load', () => res(doc))
  })
)

export default loadShareDBDoc
