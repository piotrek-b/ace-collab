import AceBag from './ace-bag'
// Map paths etc.
import 'ace-builds/webpack-resolver'

const {
    Document,
    Editor,
    EditSession,
    VirtualRenderer,
} = AceBag

let x = 'let x = 5;'
const doc = new Document(x)
const virtualRenderer = new VirtualRenderer(document.querySelector('#editor'))
const editSession = new EditSession(doc)
const editor = new Editor(virtualRenderer, editSession)
editor.setTheme('ace/theme/monokai');
editSession.setMode('ace/mode/javascript');
