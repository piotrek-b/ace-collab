import AceBag from './utils/ace-bag'
// Map paths etc.
import 'ace-builds/webpack-resolver'
import '@babel/polyfill'
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

const reduceLines = (total, line) => `${total}\n${line}`


const mapAceOpToShareDBOp = (aceDoc, path) => ({
  action,
  start: {
    column,
    row,
  },
  lines,
}) => {
  const opType = mapAceActionToShareDBOpType[action]
  const startIndex = aceDoc.positionToIndex({ row, column })

  const text = lines.length === 0 ? lines[0] : lines.reduce(reduceLines)

  return {
    p: [...path, startIndex],
    [opType]: text,
  }
}

/**
 * Config provided to collaborative Ace Editor constructor.
 *
 * @typedef CollabEditorConfigSchema
 * @type {object}
 * @property {HTMLElement} anchorDOM - a DOM element to display the editor on.
 * @property {string} mode - ace editor's mode.
 * @property {string} theme - ace editor's theme.
 * @property {string} userName
 */
const collabEditorConfigSchema = {
  anchorDOM: null,
  mode: '',
  theme: '',
}

/**
* Class, which connects Ace functionality with shareDB functionality
*
* @typedef CollabEditor
* @type {object}
* @property {Document} aceDoc
* @property {VirtualRenderer} virtualRenderer
* @property {EditSession} editSession
* @property {Editor} editor
*/
class CollabEditor {
  constructor(config = collabEditorConfigSchema) {
    const {
      anchorDOM,
      mode,
      theme,
    } = config

    // Ace editor setup
    this.aceDoc = new Document('')
    this.virtualRenderer = new VirtualRenderer(anchorDOM)
    this.editSession = new EditSession(this.aceDoc)
    this.editor = new Editor(this.virtualRenderer, this.editSession)

    // Apply theme and mode
    this.editor.setTheme(theme)
    this.editSession.setMode(mode)

    // Setup flag indicating programative editSession value change
    this.suspenseChangeHandler = false

    // ShareDB
    this.shareDBDoc = null

    // Method bindings
    this.onEditorValueChange = this.onEditorValueChange.bind(this)
    this.setEditorValueChangeHandler = this.setEditorValueChangeHandler.bind(this)
    this.setEditorValue = this.setEditorValue.bind(this)
    this.init = this.init.bind(this)
  }

  onEditorValueChange(aceOp) {
    if (!this.suspenseChangeHandler) {
      const shareDBOp = mapAceOpToShareDBOp(this.aceDoc, ['code'])(aceOp)
      this.shareDBDoc.submitOp(shareDBOp)
    }
  }

  setEditorValueChangeHandler() {
    this.editSession.on('change', this.onEditorValueChange)
  }

  setEditorValue(shareDBDoc) {
    return (op, fromLocal) => {
      if (!fromLocal) {
        const {
          data: {
            code,
          },
        } = shareDBDoc
        this.suspenseChangeHandler = true
        this.editSession.setValue(code)
        this.suspenseChangeHandler = false
      }
    }
  }

  init(server, askForAccess) {
    return new Promise(async (res) => {
      const shareDBDoc = await loadShareDBDoc({
        on: {
          op: this.setEditorValue,
        },
        server,
        subscribe: () => {},
      }, askForAccess)

      this.shareDBDoc = shareDBDoc
      this.setEditorValue(shareDBDoc)()
      this.setEditorValueChangeHandler()


      res(shareDBDoc)
    })
  }
}

export default CollabEditor
