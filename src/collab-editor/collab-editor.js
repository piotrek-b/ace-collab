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
}

const AceActions = {
  INSERT: 'insert',
  REMOVE: 'remove',
}

const mapAceActionToShareDBOpType = {
  [AceActions.INSERT]: ShareDBOPTypes.SI,
  [AceActions.REMOVE]: ShareDBOPTypes.SD,
}

const reduceLines = (total, line) => {
  return `${total}\n${line}`
}


const mapAceOpToShareDBOp = (aceDoc, path) => ({
  action,
  start: {
    column,
    row,
  },
  lines,
}) => {
  const opType = mapAceActionToShareDBOpType[action]
  let startIndex = aceDoc.positionToIndex({ row, column })

  const text = lines.length === 0 ? lines[0] : lines.reduce(reduceLines)
  
  return {
    p: [...path, startIndex],
    [opType]: text,
  }
}

const configSchema = {
  anchorDOM: null,
  mode: '',
  theme: '',
}

/** 
* Class, which connects Ace functionality with shareDB functinality
*
* @typedef CollabEditor
* @type {object}
* @property {Document} aceDoc
* @property {VirtualRenderer} virtualRenderer
* @property {EditSession} editSession
* @property {Editor} editor
*/
class CollabEditor {
  constructor(config = configSchema) {
    const {
      anchorDOM,
      mode,
      theme,
    } = config

    // Ace

    this.aceDoc = new Document('')
    this.virtualRenderer = new VirtualRenderer(anchorDOM)
    this.editSession = new EditSession(this.aceDoc)
    this.editor = new Editor(this.virtualRenderer, this.editSession)

    this.editor.setTheme(theme)
    this.editSession.setMode(mode)

    // Flag indicating programative editSession value change
    this.suspenseChangeHandler = false


    // ShareDB

    this.shareDBDoc = null
  }

  getAceDoc = () => this.aceDoc
  getVirtualRenderer = () => this.virtualRenderer
  getEditSession = () => this.editSession
  getEditor = () => this.editor

  onEditorValueChange = (aceOp) => {
    const {
      aceDoc,
      suspenseChangeHandler,
      shareDBDoc,
    } = this
    if (!suspenseChangeHandler) {
      const shareDBOp = mapAceOpToShareDBOp(aceDoc, ['code'])(aceOp)
      shareDBDoc.submitOp(shareDBOp)
    }
  }

  setEditorValueChangeHandler = () => {
    const {
      editSession,
      onEditorValueChange,
    } = this
    editSession.on('change', onEditorValueChange)
  }

  setEditorValue = (shareDBDoc) => {
    return (op, fromLocal) => {
      const {
        editSession,
      } = this

      if (!fromLocal) {
        const {
          data: {
            code,
          },
        } = shareDBDoc
        this.suspenseChangeHandler = true
        editSession.setValue(code)
        this.suspenseChangeHandler = false
      }
    }
  }

  loadShareDBDoc = (shareDBDocId) => {
    return new Promise(async (res) => {
      const shareDBDoc = await loadShareDBDoc({
        docId: shareDBDocId,
        on: {
          op: this.setEditorValue,
        },
        subscribe: () => {},
      })

      this.shareDBDoc = shareDBDoc
      this.setEditorValue(shareDBDoc)()
      this.setEditorValueChangeHandler()


      res(shareDBDoc)
    })
  }
}

export default CollabEditor
