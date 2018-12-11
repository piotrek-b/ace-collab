import '@babel/polyfill'
import CollabEditor from './collab-editor/collab-editor'

const configSchema = {
  anchorDOM: null,
  documentSrc: [],
  mode: '',
  theme: '',
}

const aceCollab = (config = configSchema) => (
  new Promise(async (res) => {
    const {
      documentSrc,
      ...configRest
    } = config

    const editor = new CollabEditor(configRest)
    await editor.loadShareDBDoc(documentSrc)

    res(editor)
  })
)

aceCollab({
  anchorDOM: document.querySelector('#editor'),
  documentSrc: ['codes', '5'],
  mode: 'ace/mode/csharp',
  theme: 'ace/theme/monokai',
})
