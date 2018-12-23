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
  docId: '31116ba6-33fe-46d2-888a-aaf7eba97e17',
  mode: 'ace/mode/csharp',
  theme: 'ace/theme/monokai',
})
