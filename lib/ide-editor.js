import { createVNode, createComponentVNode, normalizeProps } from "../web_modules/inferno.js";function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {var symbols = Object.getOwnPropertySymbols(object);if (enumerableOnly) symbols = symbols.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});keys.push.apply(keys, symbols);}return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i] != null ? arguments[i] : {};if (i % 2) {ownKeys(Object(source), true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));} else {ownKeys(Object(source)).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;} /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           * Brumba
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           * Copyright (c) 2012-2020 Dan Parnete
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           * This source code is licensed under the MIT license.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          */

import { render, Component } from "../web_modules/inferno.js";
import { objLess } from "./common.js";
import { $, br, modified, createElement, createStyle } from "./util.js";
import { Dialog, posDialog } from "./components.js";
import 'https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.10.3/beautify-html.min.js';
import CodeMirror from "../node_modules/codemirror/src/codemirror.js";
import '/lib/codemirror/javascript.js';
import '/lib/codemirror/css.js';
import '/lib/codemirror/xml.js';
import '/lib/codemirror/htmlmixed.js';
import '/lib/codemirror/foldcode.js';
import '/lib/codemirror/foldgutter.js';
import '/lib/codemirror/xml-fold.js';
//import 'node/codemirror/addon/fold/indent-fold.js'
/*require('/node_modules/codemirror/addon/fold/brace-fold')
require('/node_modules/codemirror/addon/dialog/dialog')
require('/node_modules/codemirror/addon/search/searchcursor')
require('/node_modules/codemirror/addon/search/search')
require('/node_modules/codemirror/addon/edit/closebrackets')
require('/node_modules/codemirror/mode/xml/xml')
require('/node_modules/codemirror/mode/javascript/javascript')
require('/node_modules/codemirror/mode/css/css')
require('/node_modules/codemirror/mode/htmlmixed/htmlmixed')
*/




/* 
    *  Editor
    */
export var Editor = props => {
  return createVNode(128, "textarea", null, null, 1, { "value": props.code, "mode": props.mode });
};

Editor.defaultHooks = {
  onComponentDidMount(domNode) {
    CodeMirror.fromTextArea(domNode, {
      mode: domNode.getAttribute('mode') || 'javascript',
      theme: 'darcula',
      lineNumbers: true,
      extraKeys: { "Ctrl-Q": function CtrlQ(cm) {cm.foldCode(cm.getCursor());} },
      foldGutter: true,
      gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
      autoCloseTags: true }).

    on('change', instance => modified(true));
  } };



/* 
        *  DialogEditor
        */
class DialogEditor extends Component {
  constructor(props) {
    super(props);
    this.cls = props.class;
    this.code = props.code;
    this.mode = props.mode;
    this.attr = objLess(props, 'class,code,mode');
  }

  render() {
    return normalizeProps(createComponentVNode(2, Dialog, _objectSpread(_objectSpread({ "class":
      "br-dialog-editor ".concat(this.cls || '').trim() }, this.attr), {}, { children: normalizeProps(createComponentVNode(2, Editor, _objectSpread({ "code":
        this.code, "mode": this.mode }, this.attr))) })));


  }}






/* 
      *  Open editor
      */
export var dialogEditor = type => {
  var code = '';
  var stl = null;
  var mode = type;
  if (type === 'css') {
    var css = $('.br-page') ?
    $('style.br-page-css') :
    $('style.br-css');
    if (css) code = css.innerHTML;
    stl = 'width: 400px;';
  } else if (type === 'events') {
    mode = 'javascript';
    var events = $('script.br-events');
    if (events) {
      code = events.innerHTML;
    }
    /*render(
      	<Editor code={code} mode={mode} style="overflow: scroll" />,
      	br.ws
      )
      return*/
  } else {
    mode = 'htmlmixed';
    code = html_beautify(br.ws.innerHTML, { indent_size: 2, space_in_empty_paren: true });
  }
  posDialog(type);
  render(createComponentVNode(2, DialogEditor, { "class":
    "br-" + type, "code": code, "mode": mode, "title": type.toUpperCase() + ' editor', "style":
    stl, "onApplay": onApplay }),
  br.dlg);

};

export var onApplay = e => {
  var cme = $('.CodeMirror');
  var cm = cme ? cme.CodeMirror : null;
  var code = cm.getValue();
  var isPage = $('.br-page') ? true : false;
  var ed = $('.br-dialog-editor');

  // css
  if (ed.classList.contains('br-css')) {
    var css = isPage ? $('style.br-page-css') : $('style.br-css');
    if (css) {
      if (code === '') {
        css.remove();
      } else {
        css.innerHTML = code;
      }
    } else {
      createStyle(code, isPage);
    }

    // events
  } else if (ed.classList.contains('br-events')) {
    var events = $('script.br-events');
    if (events) {
      if (code === '') {
        events.remove();
      } else {
        events.innerHTML = code;
      }
    } else {
      events = createElement("<script class=\"br-events\">".concat(code, "</script>"));
      br.ws.append(events);
    }

    // html
  } else {
    render(null, br.ws);
    br.ws.innerHTML = code;
  }

  modified(true);
};




/* 
    *  Open dialog editor
    */
export var openDialogEditor = () => {
  var ed = $('.br-dialog-editor');
  if (ed) {
    dialogEditor(
    ed.className.includes('br-css') ?
    'css' :

    ed.className.includes('br-events') ?
    'events' :
    'html');


  }
};