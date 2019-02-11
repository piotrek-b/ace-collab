import Editor from './collab-editor/collab-editor'

export default Editor

const editor = new Editor({
  anchorDOM: document.querySelector('#editor'),
  mode: 'ace/mode/javascript',
  theme: 'ace/theme/monokai',
})

editor.init({
  docId: '',
  host: 'localhost',
  port: '3000',
  username: 'Piotr',
  ssl: false,
})
