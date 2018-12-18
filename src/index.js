import '@babel/polyfill'
import CollabEditor from './collab-editor/collab-editor'

const configSchema = {
  anchorDOM: null,
  docId: '',
  mode: '',
  theme: '',
}

const aceCollab = (config = configSchema) => (
  new Promise(async (res) => {
    const {
      docId,
      ...configRest
    } = config

    const editor = new CollabEditor(configRest)
    await editor.loadShareDBDoc(docId)

    res(editor)
  })
)

aceCollab({
  anchorDOM: document.querySelector('#editor'),
  docId: '8d939b92-1729-4e51-a9b8-e37bc4ce8887',
  mode: 'ace/mode/csharp',
  theme: 'ace/theme/monokai',
})
