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
  docId: '9203be00-de72-40f6-94fb-d799a8ba0d6d',
  mode: 'ace/mode/csharp',
  theme: 'ace/theme/monokai',
})
