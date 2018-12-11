import {
  Editor,
  EditSession,
  VirtualRenderer,
  require as aceRequire,
} from 'ace-builds/src-min-noconflict/ace'
// Map paths etc.
import 'ace-builds/webpack-resolver'

// These are workarounds to get necessary
// imports work.
const { Document } = aceRequire('ace/document')

export default {
  Document,
  Editor,
  EditSession,
  VirtualRenderer,
}
