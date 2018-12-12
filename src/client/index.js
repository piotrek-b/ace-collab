import axios from 'axios'
import sharedb from 'sharedb/lib/client'
import WebSocket from 'reconnecting-websocket'
import isEmpty from 'lodash/isEmpty'

// Open WebSocket connection to ShareDB server
const socket = new WebSocket('ws://localhost:3000');
const connection = new sharedb.Connection(socket);

const configSchema = {
  docId: '',
  on: {
    op: () => () => {},
  },
  subscribe: () => () => {},
}

const loadShareDBDoc = (config = configSchema) => (
  new Promise(async (res) => {
    const {
      on,
      subscribe,
    } = config
    let {
      docId,
    } = config
    if (isEmpty(docId)) {
      const response = await axios.post('http://localhost:3000/code')
      docId = response.data.id
    }
    console.log(docId)
    const doc = connection.get('codes', docId)

    doc.subscribe(subscribe(doc))

    Object.keys(on).forEach((event) => {
      doc.on(event, on[event](doc))
    })

    doc.on('load', () => res(doc))
  })
)

export default loadShareDBDoc
