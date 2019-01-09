import '@babel/polyfill'

import CollabEditor from './collab-editor/collab-editor'
/**
 * Server info.
 *
 * @typedef ServerInfo
 * @type {object}
 * @property {string} docId - id of the document.
 * @property {string} host - server host.
 * @property {number} port - server port.
 * @property {boolean} ssl - indicates if server uses ssl.
 */

/**
* Config provided to setup collaborative Ace Editor.
*
* @typedef AceCollabConfigSchema
* @type {object}
* @property {HTMLElement} anchorDOM - a DOM element to display the editor on.
* @property {string} age - ace editor's mode.
* @property {string} theme - ace editor's theme.
* @property {string} userName
* @property {ServerInfo} server
*/
const aceCollabConfigSchema = {
  anchorDOM: null,
  mode: '',
  theme: '',
  userName: '',
  server: {
    docId: '',
    host: '',
    port: '',
    ssl: false,
  },
}

/**
 * Setup collaborative Ace Editor instance.
 *
 * @async
 * @function AceCollab
 * @param {AceCollabConfigSchema} config - config to be provided for the CollabEditor.
 * @return {Promise<CollabEditor>} Collaborative Ace Editor instance.
 */
const AceCollab = (config = aceCollabConfigSchema) => (
  new Promise(async (res) => {
    const {
      server,
      ...configRest
    } = config

    const editor = new CollabEditor(configRest)
    const doc = await editor.setShareDBDoc(server)
    editor.initWSChatConnection(doc.id)

    res(editor)
  })
)

export default AceCollab
