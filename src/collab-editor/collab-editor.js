import AceBag from './utils/ace-bag'
// Map paths etc.
import 'ace-builds/webpack-resolver'
import loadShareDBDoc from '../client'

const {
    Document,
    Editor,
    EditSession,
    VirtualRenderer,
} = AceBag

const configSchema = {
    anchorDOM: null,
    documentSrc: null,
    mode: '',
    theme: '',
}

const mapAceActionToShareDBOpType = {
    insert: 'si',
    remove: 'sd',
}

const mapAceOpToShareDBOp = (doc) => ({
    action,
    start,
    end,
    lines,
}) => {
    const opType = mapAceActionToShareDBOpType[action]
    const ops = []
    const insertOps = []
    const deleteOps = []
    let curr = start.row

    while (curr <= end.row) {
        if (opType === 'si' && doc.data.text[curr] === undefined) {
            insertOps.push({
                p: ['text', curr],
                li: lines[curr - start.row],
            })
        } else if (opType === 'sd' && lines[curr - start.row] === doc.data.text[curr]) {
            deleteOps.unshift({
                p: ['text', curr],
                ld: doc.data.text[curr],
            })
        } else {
            ops.push({
                p: ['text', curr, start.column],
                [opType]: lines[curr - start.row],
            })
        }
        curr++
    }

    return [...insertOps, ...ops, ...deleteOps]
}

class CollabEditor {
    constructor(config = configSchema) {
        const {
            anchorDOM,
            documentSrc,
            mode,
            theme,
        } = config

        this.document = new Document(documentSrc)
        this.virtualRenderer = new VirtualRenderer(anchorDOM)
        this.editSession = new EditSession(this.document)
        this.editor = new Editor(this.virtualRenderer, this.editSession)

        this.editor.setTheme(theme)
        this.editSession.setMode(mode)
    }

    setEditorValueChangeHandler = (doc) => {
        const {
            editor,
            editSession,
        } = this
        editSession.on('change', (aceOp) => {
            if (editor.curOp && editor.curOp.command.name) {
                console.log('aceOp', aceOp)
                console.log(doc.data.text)
                const shareDBOps = mapAceOpToShareDBOp(doc)(aceOp)
                console.log('shareDBOps', shareDBOps)
                doc.submitOp(shareDBOps)
            }
        })
    }

    setEditorValue = (doc) => (op, fromLocal) => {
        const {
            editSession,
        } = this

        console.log(fromLocal)
        
        if (!fromLocal) {
            const {
                data: {
                    text,
                },
            } = doc

            console.log(text)
            editSession.setValue(text.join('\n'))
        }
    }

    async loadShareDBDoc() {
        const shareDBDoc = await loadShareDBDoc({
            subscribe: () => {},
            on: {
                op: this.setEditorValue,
            },
        })

        this.setEditorValue(shareDBDoc)()
        this.setEditorValueChangeHandler(shareDBDoc)
    }
}

export default CollabEditor
