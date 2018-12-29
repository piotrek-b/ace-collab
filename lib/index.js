"use strict";

require("@babel/polyfill");

var _collabEditor = _interopRequireDefault(require("./collab-editor/collab-editor"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

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
var aceCollabConfigSchema = {
  anchorDOM: null,
  docId: '',
  mode: '',
  theme: ''
  /**
   * Setup collaborative Ace Editor instance.
   *
   * @async
   * @function aceCollab
   * @param {AceCollabConfigSchema} config - config to be provided for the CollabEditor.
   * @return {Promise<CollabEditor>} Collaborative Ace Editor instance.
   */

};

var aceCollab = function aceCollab() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : aceCollabConfigSchema;
  return new Promise(
  /*#__PURE__*/
  function () {
    var _ref = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee(res) {
      var docId, configRest, editor;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              docId = config.docId, configRest = _objectWithoutProperties(config, ["docId"]);
              editor = new _collabEditor.default(configRest);
              _context.next = 4;
              return editor.setShareDBDoc(docId);

            case 4:
              res(editor);

            case 5:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }());
};

aceCollab({
  anchorDOM: document.querySelector('#editor'),
  mode: 'ace/mode/csharp',
  theme: 'ace/theme/monokai'
});