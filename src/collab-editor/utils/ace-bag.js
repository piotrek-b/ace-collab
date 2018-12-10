import {
    Editor,
    EditSession,
    VirtualRenderer,
    require,
} from 'ace-builds/src-min-noconflict/ace'
// Map paths etc.
import 'ace-builds/webpack-resolver'

// These are workarounds to get necessary
// imports work.
const { Document } = require('ace/document')

export default {
    Document,
    Editor,
    EditSession,
    VirtualRenderer,
}

