import '@babel/polyfill'
import CollabEditor from './collab-editor/collab-editor'

/**
* Config provided to setup collaborative Ace Editor.
*
* @typedef ConfigSchema
* @type {object}
* @property {string} anchorDOM - a DOM element to display the editor on.
* @property {docId} name - shareDB doc id to connect with.
* @property {mode} age - ace editor's mode.
* @property {theme} theme - ace editor's theme.
*/
const configSchema = {
  anchorDOM: null,
  docId: '',
  mode: '',
  theme: '',
}

/**
 * Setup collaborative Ace Editor instance.
 *
 * @async
 * @function aceCollab
 * @param {ConfigSchema} configSchema - config to be provided for the CollabEditor.
 * @return {Promise<CollabEditor>} Collaborative Ace Editor instance.
 */
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
  docId: '31116ba6-33fe-46d2-888a-aaf7eba97e17',
  mode: 'ace/mode/csharp',
  theme: 'ace/theme/monokai',
})
