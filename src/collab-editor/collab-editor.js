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
  const rowCount = end.row - start.row

  switch (rowCount) {
    case 0:
      ops.push({
        p: [...path, start.row, start.column],
        [opType]: lines[0],
      })
      break;
    case 1:
      ops.push({
        p: [...path, start.row, start.column],
        [opType]: lines[0],
      })
      if (opType === ShareDBOPTypes.SI && doc.data.lines[end.row] === undefined) {
        insertOps.push({
          p: [...path, end.row],
          [ShareDBOPTypes.LI]: lines[1],
        })
      } else if (opType === ShareDBOPTypes.SD && doc.data.lines[end.row] === lines[1]) {
        deleteOps.unshift({
          p: [...path, end.row],
          [ShareDBOPTypes.LD]: lines[1],
        })
      } else {
        ops.push({
          p: [...path, end.row, 0],
          [opType]: lines[1],
        })
      }
      break;
    default:
      let current = start.row + 1
      ops.push({
        p: [...path, start.row, start.column],
        [opType]: lines[0],
      })
      while (current < end.row) {
        if (opType === ShareDBOPTypes.SI && doc.data.lines[current] === undefined) {
          insertOps.push({
            p: [...path, end.row],
            [ShareDBOPTypes.LI]: lines[current - start.row],
          })
        } else if (opType === ShareDBOPTypes.SD && doc.data.lines[current] === lines[current - start.row]) {
          deleteOps.unshift({
            p: [...path, end.row],
            [ShareDBOPTypes.LD]: lines[current - start.row],
          })
        }
        current += 1
      }
      if (opType === ShareDBOPTypes.SI && doc.data.lines[end.row] === undefined) {
        insertOps.push({
          p: [...path, end.row],
          [ShareDBOPTypes.LI]: lines[end.row - start.row],
        })
      } else if (opType === ShareDBOPTypes.SD && doc.data.lines[end.row] === lines[end.row - start.row]) {
        deleteOps.unshift({
          p: [...path, end.row],
          [ShareDBOPTypes.LD]: lines[end.row - start.row],
        })
      } else {
        ops.push({
          p: [...path, end.row, 0],
          [opType]: lines[end.row - start.row],
        })
      }
      break;
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

  setEditorValueChangeHandler = (doc) => {
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

  setEditorValue = (doc) => {
    return (op, fromLocal) => {
      const {
        editSession,
      } = this

      console.log(this)

      if (!fromLocal) {
        const {
          data: {
            lines,
          },
        } = doc
        this.shouldHandleChange = false
        editSession.setValue(lines.join('\n'))
        this.shouldHandleChange = true
      }
    }
  }

  loadShareDBDoc = (docId) => {
    return new Promise(async (res) => {
      const shareDBDoc = await loadShareDBDoc({
        docId,
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