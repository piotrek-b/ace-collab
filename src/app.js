import '@babel/polyfill';
import CollabEditor from './collab-editor/collab-editor'

const editor = new CollabEditor({
    anchorDOM: document.querySelector('#editor'),
    documentSrc: 'x',
    mode: 'ace/mode/javascript',
    theme: 'ace/theme/monokai',
})

editor.loadShareDBDoc()
