/*
 * Brumba
 * Copyright (c) 2012-2020 Dan Parnete
 *
 * This source code is licensed under the MIT license.
*/

import { render, Component } from 'web/inferno'
import { objLess } from './common'
import { $, br, modified, createElement, createStyle, loadCSS } from './util'
import { Dialog, posDialog } from './components'
import 'https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.10.3/beautify-html.min.js'
import CodeMirror from 'node/codemirror/src/codemirror'

window.CodeMirror = CodeMirror

import('/node_modules/codemirror/addon/fold/foldcode.js')
import('/node_modules/codemirror/addon/fold/foldgutter.js')
import('/node_modules/codemirror/addon/fold/xml-fold.js')
import('/node_modules/codemirror/addon/fold/brace-fold.js')

import('/node_modules/codemirror/addon/dialog/dialog.js')
import('/node_modules/codemirror/addon/search/searchcursor.js')
import('/node_modules/codemirror/addon/search/search.js')
import('/node_modules/codemirror/addon/edit/closebrackets.js')

import('/node_modules/codemirror/mode/xml/xml.js')
import('/node_modules/codemirror/mode/javascript/javascript.js')
import('/node_modules/codemirror/mode/css/css.js')
import('/node_modules/codemirror/mode/htmlmixed/htmlmixed.js')

loadCSS('/node_modules/codemirror/lib/codemirror.css')
loadCSS('/node_modules/codemirror/theme/darcula.css')
loadCSS('/node_modules/codemirror/addon/fold/foldgutter.css')
loadCSS('/node_modules/codemirror/addon/dialog/dialog.css')



/* 
 *  Editor
 */
export const Editor = (props) => {
  return <textarea value={props.code} mode={props.mode} />
}

Editor.defaultHooks = {
  onComponentDidMount(domNode) {
    CodeMirror.fromTextArea(domNode, {
      mode: domNode.getAttribute('mode') || 'javascript',
      theme: 'darcula',
      lineNumbers: true,
      extraKeys: {"Ctrl-Q": function(cm){ cm.foldCode(cm.getCursor()); }},
      foldGutter: true,
      gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
      autoCloseTags: true,
      autoCloseBrackets: true,
      smartIndent: false
    })
    .on('change', instance => modified(true))
  }
}


/* 
 *  DialogEditor
 */
class DialogEditor extends Component {
	constructor(props) {
		super(props)
		this.cls = props.class
		this.code = props.code
		this.mode = props.mode
		this.attr = objLess(props, 'class,code,mode')
	}
	
	render() {
		return (
			<Dialog class={`br-dialog-editor ${this.cls || ''}`.trim()} {...this.attr}>
				<Editor code={this.code} mode={this.mode} {...this.attr} />
			</Dialog>
		)
	}
  
}




/* 
 *  Open editor
 */
export const dialogEditor = (type) => {
  let code = ''
  let stl = null
  let mode = type
  if (type === 'css') {
    const css = $('.br-page')
              ? $('style.br-page-css')
              : $('style.br-css')
    if (css) code = css.innerHTML
    stl = 'width: 400px;'
  } else if (type === 'events') {
		mode = 'javascript'
		const events = $('script.br-events')
		if (events) {
			code = events.innerHTML
		}
		/*render(
			<Editor code={code} mode={mode} style="overflow: scroll" />,
			br.ws
		)
		return*/
  } else {
		mode = 'htmlmixed'
		code = html_beautify(br.ws.innerHTML, {indent_size: 2, space_in_empty_paren: true})
  }
  posDialog(type)
  render(
    <DialogEditor class={"br-"+type} code={code} mode={mode} title={type.toUpperCase()+' editor'} 
                  style={stl} onApplay={onApplay}/>,
    br.dlg
  )
}

export const onApplay = (e) => {
  const cme = $('.CodeMirror')
  const cm = (cme) ? cme.CodeMirror : null
  const code = cm.getValue()
  const isPage = $('.br-page') ? true : false
  const ed = $('.br-dialog-editor')
  
  // css
  if (ed.classList.contains('br-css')) {
    let css = isPage ? $('style.br-page-css') : $('style.br-css')
    if (css) {
			if (code === '') {
				css.remove()
      } else {
				css.innerHTML = code
			}
    } else {
      createStyle(code, isPage)
    }
  
  // events
  } else if (ed.classList.contains('br-events')) {
    let events = $('script.br-events')
    if (events) {
			if (code === '') {
				events.remove()
      } else {
				events.innerHTML = code
			}
    } else {
      events = createElement(`<script class="br-events">${code}</script>`)
      br.ws.append(events)
    }
  
  // html
  } else {
    render(null, br.ws)
    br.ws.innerHTML = code
  }
  
  modified(true)
}




/* 
 *  Open dialog editor
 */
export const openDialogEditor = () => {
  const ed = $('.br-dialog-editor')
  if (ed) {
    dialogEditor(
      ed.className.includes('br-css') 
      ? 'css' 
      : (
        ed.className.includes('br-events')
        ? 'events'
        : 'html'
      )
    )
  }
}




