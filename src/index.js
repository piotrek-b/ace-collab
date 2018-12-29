import '@babel/polyfill'
// Map paths etc.
import 'ace-builds/webpack-resolver'

import CollabEditor from './collab-editor/collab-editor'

/**
* Config provided to setup collaborative Ace Editor.
*
* @typedef AceCollabConfigSchema
* @type {object}
* @property {HTMLElement} anchorDOM - a DOM element to display the editor on.
* @property {docId} name - shareDB doc id to connect with.
* @property {mode} age - ace editor's mode.
* @property {theme} theme - ace editor's theme.
*/
const aceCollabConfigSchema = {
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
 * @param {AceCollabConfigSchema} config - config to be provided for the CollabEditor.
 * @return {Promise<CollabEditor>} Collaborative Ace Editor instance.
 */
const aceCollab = (config = aceCollabConfigSchema) => (
  new Promise(async (res) => {
    const {
      docId,
      ...configRest
    } = config

    const editor = new CollabEditor(configRest)
    await editor.setShareDBDoc(docId)

    res(editor)
  })
)

aceCollab({
  anchorDOM: document.querySelector('#editor'),
  mode: 'ace/mode/csharp',
  theme: 'ace/theme/monokai',
})
