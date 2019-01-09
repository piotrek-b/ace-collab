import axios from 'axios'
import sharedb from 'sharedb/lib/client'
import WebSocket from 'reconnecting-websocket'
import isEmpty from 'lodash/isEmpty'


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

const loadShareDBDoc = (config = configSchema) => (
  new Promise(async (res) => {
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
      docId,
    } = server
    const protocolEnd = ssl ? 's' : ''

    if (isEmpty(docId)) {
      const response = await axios.post(`http${protocolEnd}://${host}:${port}/code`)
      docId = response.data.id
    }
    // Open WebSocket connection to ShareDB server
    const socket = new WebSocket(`ws${protocolEnd}://${host}:${port}/sharedb`)
    const connection = new sharedb.Connection(socket)

    const doc = connection.get('codes', docId)

    doc.subscribe(subscribe(doc))

    Object.keys(on).forEach((event) => {
      doc.on(event, on[event](doc))
    })

    doc.on('load', () => res(doc))
  })
)

export default loadShareDBDoc
