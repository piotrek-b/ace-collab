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

const ShareDBOPTypes = {
  SI: 'si',
  SD: 'sd',
  LI: 'li',
  LD: 'ld',
}

const AceActions = {
  INSERT: 'insert',
  REMOVE: 'remove',
}

const mapAceActionToShareDBOpType = {
  [AceActions.INSERT]: ShareDBOPTypes.SI,
  [AceActions.REMOVE]: ShareDBOPTypes.SD,
}

const mapAceOpToShareDBOp = (doc, path) => ({
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
    if (opType === ShareDBOPTypes.SI && doc.data.text[curr] === undefined) {
      insertOps.push({
        p: [...path, curr],
        [ShareDBOPTypes.LI]: lines[curr - start.row],
      })
    } else if (opType === ShareDBOPTypes.SD && lines[curr - start.row] === doc.data.text[curr]) {
      deleteOps.unshift({
        p: [...path, curr],
        [ShareDBOPTypes.LD]: doc.data.text[curr],
      })
    } else {
      ops.push({
        p: [...path, curr, start.column],
        [opType]: lines[curr - start.row],
      })
    }
    curr += 1
  }

  return [...insertOps, ...ops, ...deleteOps]
}

const configSchema = {
  anchorDOM: null,
  mode: '',
  theme: '',
}

class CollabEditor {
  constructor(config = configSchema) {
    const {
      anchorDOM,
      mode,
      theme,
    } = config

    this.document = new Document('')
    this.virtualRenderer = new VirtualRenderer(anchorDOM)
    this.editSession = new EditSession(this.document)
    this.editor = new Editor(this.virtualRenderer, this.editSession)

    this.editor.setTheme(theme)
    this.editSession.setMode(mode)

    // Flag indicating programative editSession value change
    this.shouldHandleChange = true
  }

  setEditorValueChangeHandler(doc) {
    const {
      editSession,
    } = this
    editSession.on('change', (aceOp) => {
      if (this.shouldHandleChange) {
        const shareDBOps = mapAceOpToShareDBOp(doc, ['lines'])(aceOp)
        console.log('aceOp', aceOp)
        console.log('shareDBOps', shareDBOps)
        doc.submitOp(shareDBOps)
      }
    })
  }

  setEditorValue(doc) {
    return (op, fromLocal) => {
      const {
        editSession,
      } = this

      if (!fromLocal) {
        const {
          data: {
            text,
          },
        } = doc
        this.shouldHandleChange = false
        editSession.setValue(text.join('\n'))
        this.shouldHandleChange = true
      }
    }
  }

  loadShareDBDoc(docPath) {
    return new Promise(async (res) => {
      const shareDBDoc = await loadShareDBDoc({
        docPath,
        on: {
          op: this.setEditorValue,
        },
        subscribe: () => {},
      })

      this.setEditorValue(shareDBDoc)()
      this.setEditorValueChangeHandler(shareDBDoc)

      res(shareDBDoc)
    })
  }
}

export default CollabEditor
