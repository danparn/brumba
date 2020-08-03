/*
 * Brumba
 * Copyright (c) 2012-2020 Dan Parnete
 *
 * This source code is licensed under the MIT license.
*/

import { render, Component } from 'web/inferno'
import { objLess } from './common'
import { $, br, modified, createElement, createStyle } from './util'
import { Dialog, posDialog } from './components'
import 'https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.10.3/beautify-html.min.js'
import CodeMirror from 'node/codemirror/src/codemirror'
/*import '/lib/codemirror/javascript.js'
import '/lib/codemirror/css.js'
import '/lib/codemirror/xml.js'
import '/lib/codemirror/htmlmixed.js'
import '/lib/codemirror/foldcode.js'
import '/lib/codemirror/foldgutter.js'
import '/lib/codemirror/xml-fold.js'*/
import { createRequire } from 'module';

const require = createRequire(import.meta.url)
require('/node_modules/codemirror/addon/dialog/dialog')
require('/node_modules/codemirror/addon/search/searchcursor')
require('/node_modules/codemirror/addon/search/search')

//import 'node/codemirror/addon/fold/indent-fold.js'
/*require('/node_modules/codemirror/addon/fold/brace-fold')
require('/node_modules/codemirror/addon/edit/closebrackets')
require('/node_modules/codemirror/mode/xml/xml')
require('/node_modules/codemirror/mode/javascript/javascript')
require('/node_modules/codemirror/mode/css/css')
require('/node_modules/codemirror/mode/htmlmixed/htmlmixed')
*/




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
      autoCloseTags: true
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




