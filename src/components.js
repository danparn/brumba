/*
 * Brumba
 * Copyright (c) 2012-2020 Dan Parnete
 *
 * This source code is licensed under the MIT license.
*/

import { render } from 'web/inferno';
import MetisMenu from 'web/metismenujs'
import { objLess, translate, toJSON, strSplit } from './common'
import { Message } from "./inferno-bulma"
import { $, e$, br, remote, modified, createElement } from './util'
import { findForm } from './forms'




/* 
 *  Render to string
 */
export const renderToString = (jsx) => {
	const div = createElement('<div></div>')
	render(jsx, div)
	return div.innerHTML
}



/* 
 *  Navbar
 */
export const Navbar = (props) => {
  const openSidebar = () => $("#br-sidebar").style.width = "300px"
  
  return (
    <nav>
      <div class="br-navbar">
        <a class="br-bars" onClick={openSidebar}><i class="fa fa-bars"></i></a>
        {props.children}
      </div>
    </nav>
  )
}




/* 
 *  Sidebar
 */
export const Sidebar = (props) => {
  const closeSidebar = () => $("#br-sidebar").style.width = "0px"
  
  return (
    <nav class="sidebar-nav" id="br-sidebar">
      <a class="closebtn" onclick={closeSidebar}>&times;</a>
      <ul class="metismenu" id="br-menu">
        {props.children}
      </ul>
    </nav>
  )
}

Sidebar.defaultHooks = {
  onComponentDidMount() {
    new MetisMenu("#br-menu")
  }
}

export const closeSidebar = () => {
  $('#br-sidebar').style.width = "0px"
  const el = $('#br-menu a.active')
  if (el) el.classList.remove('active')   // deactivate
  const cm = $('.CodeMirror')
  if (cm) cm.CodeMirror.toTextArea()
  render(null, br.ws)
  const wo = br.wo
  if (wo) {
    wo.removeAttribute('id')
    wo.name = ''
    wo.value = ''  
  }
}
  



/* 
 *  Dialog
 */
export const Dialog = (props) => {
  return (
    <Message {...props} onClose={closeDialog} />
  )
}

Dialog.defaultHooks = {
  onComponentDidMount(domNode) {
    const header = domNode.getElementsByClassName('message-header')[0]
    const dialog = domNode.parentNode
    header.draggable = true
    let offsetX, offsetY, pageX, pageY, screenX, screenY
    
    header.addEventListener("dragstart", e => {
      offsetX = e.offsetX
      offsetY = e.offsetY
      pageX = e.pageX
      pageY = e.pageY
      screenX = e.screenX
      screenY = e.screenY
    }, false)
    
    header.addEventListener("dragover", e => {
			e.preventDefault()
    }, false)
    
    header.addEventListener("dragend", e => {
			e.preventDefault()
      dialog.style.left = pageX + (e.screenX - screenX) - offsetX + 'px'
      dialog.style.top = pageY + (e.screenY - screenY) - offsetY + 'px'
    }, false)
  }
}

export const closeDialog = (e) => {
  const dlg = br.dlg
  // remenber pos
  const art = dlg.firstChild
  if (localStorage && art) {
    let pos = {top: dlg.style.top, left: dlg.style.left}
    if (art.className.includes('br-props')) {
      localStorage.setItem('br.dialogPos.props', JSON.stringify(pos))
    } else if (art.className.includes('br-css')) {
      localStorage.setItem('br.dialogPos.css', JSON.stringify(pos))
    } else if (art.className.includes('br-events')) {
      localStorage.setItem('br.dialogPos.events', JSON.stringify(pos))
    }  
  }

  render(null, dlg)
}
  
export const posDialog = (type) => {
  closeDialog()
  if (localStorage && type) {
//localStorage.removeItem('br.dialogPos.props')
    let pos = {top: '60px', left: '200px'}
    switch (type) {
      case 'props':
        pos = localStorage.getItem('br.dialogPos.props') || {top: '100px', left: '700px'}
        break
      case 'css':
        pos = localStorage.getItem('br.dialogPos.css') || {top: '60px', left: '600px'}
        break
      default:
        pos = localStorage.getItem('br.dialogPos.events') || pos
    }
    if (typeof pos === 'string') {
      pos = JSON.parse(pos)
    }
    br.dlg.style.top = pos.top
    br.dlg.style.left = pos.left
  }
}





/* 
 *  List box
 */
export const ListBox = (props) => {
  let items = []
  props.data.forEach(r => {
    items.push(<a id={r.id} class="list-item" onClick={props.onClick}>{r.text}</a>)
  })

  return (
    <Dialog id={props.id} title={props.title}>
      <div class="columns">
        <div class="column">
          <div class="list is-hoverable">
            {items}
          </div>
        </div>
      </div>
    </Dialog>
  )
}





/* 
 *  File from database
 */
export const fileFromDb = (par, cb) => {
  const onClick = (e) => {
    cb({id: e.target.id, filename: e.target.textContent})
    render(null, br.dlg)
  }
  
	const q = {cmd: 'GET', db: par.db || br.db, coll: 'fs.files'}
	if (par.type) q.where = {contentType: {$regex:'^'+par.type}}
  remote(q).then(res => {
		if (res.err) return
    let dat = []
    res.forEach(r => {
      dat.push({id: r._id, text: r.filename})
    });
  
    render(
      <ListBox data={dat} title="File from database" onClick={onClick} />,
      br.dlg
    )
	})
}





/* 
 *  File upload
 */
export const fileUpload = (db, cb) => {
  const f = createElement('<input type="file" style="display: none" />')
  $('body').append(f)
	
	f.addEventListener('change', (e) => {
    const file = f.files[0]
    let par = {cmd: 'FILE', mode: 'r', db: db, filename: file.name}
    remote(par).then(res => {
      if (res.err || res.lastModified !== file.lastModified) {
        par = Object.assign(par, {
          mode: 'w',
          options: {
            contentType: file.type,
            metadata: {
              lastModified: file.lastModified
            }
          }
        })
        remote(par, file, file.type).then(res => {
          res.filename = file.name
          f.remove()
          cb(res)
        })
      } else {
        res.filename = file.name
        cb(res)
      }
    })
	})
	
	f.click()
}




/* 
 *  Image load
 */
export const imgLoad = (db, img) => {
	if (db && img) {
		const id = img.getAttribute('data-id')
		if (id) {
			const par = {cmd: 'FILE',	mode: 'r', db: db, _id: id, usercode: br.usercode}
			img.firstElementChild.setAttribute('src', '/brumba?' + JSON.stringify(par))
		}
	}
}



/* 
 *  Confirm modal
 */
export const confirmModal = (message, okHandler, color) => {
  const close = e => br.dlg.innerHTML = ''
  color = color || 'is-primary'
  
  render(null, br.dlg)
	br.dlg.innerHTML = `
		<div class="modal is-active">
			<div class="modal-background"></div>
			<div class="modal-card">
				<header class="modal-card-head">
					<p class="modal-card-title">Confirmation needed</p>
					<button class="delete" aria-label="close"></button>
				</header>
				<section class="modal-card-body">
					${message}
				</section>
				<footer class="modal-card-foot">
					<button class="button ${color} mod-ok">Ok</button>
					<button class="button mod-close">Cancel</button>
				</footer>
			</div>
		</div>
	`
	e$(br.dlg, '.mod-ok').addEventListener('click', e => {okHandler(); close()})
	e$(br.dlg, '.mod-close').addEventListener('click', close)
	e$(br.dlg, '.delete').addEventListener('click', close)
}






/* 
 *  Autocomplete
 */
export const autocomplete = (input, form) => {
	const auto = createElement(`
		<div class="dropdown br-autocomplete is-active">
			<div class="dropdown-trigger br-autocomplete">
			</div>
			<div class="dropdown-menu" role="menu">
				<div class="dropdown-content">
				</div>
			</div>
		</div>
	`)
	input.parentNode.replaceChild(auto, input)
	e$(auto, '.dropdown-trigger').append(input)
	const content = e$(auto, '.dropdown-content')
	content.style.display = 'none'

	input.addEventListener('change', e => {
		content.innerHTML = ''
		if (input.value.length > 2) {
			const query = toJSON(input.getAttribute('data-query'))
			const list = strSplit(input.getAttribute('data-list'), ',')
			if (query && list) {
				if (!query.where) query.where = {}
				const regex = {
					'$regex': input.value,
					'$options': 'i'
				}
				if (list[1].charAt(0) === '+') {
					const fld0 = {}
					fld0[list[0]] = regex
					const fld1 = {}
					fld1[list[1].substring(1)] = regex
					query.where.$or = [fld0, fld1]
				} else {
					query.where[list[0]] = regex
				}
				query.limit = 100
				remote(query).then(res => {
					if (res.err) return
					if (res.length === 100) {
						notification(translate(`
							Too many records, only the first 100 returned. Please try to write more characters.
						`))
					}
					res.forEach(r => {
						const txt = listArgs(list, r)
						const a = createElement(`
							<a id=${r._id} href="#" class="dropdown-item">${txt}</a>
						`)
						content.append(a)
						
						a.addEventListener('click', e => {
							content.style.display = 'none'
							const rec = res.find(r => r._id+'' === e.target.id+'')
							const fld = form.fields.find(f => f.name === input.getAttribute('name'))
							if (fld && rec) {
								fld.newval = rec._id
								input.value = e.target.textContent
								if (query.extra) {
									extraFields(query.extra, rec, input)									
								}
							} else {
								alert(`fld: ${fld}  rec: ${rec}`)
							}
						})
					})
					content.style.display = 'block'
				})
			}
		} else {
			alert(translate('Minimum 3 characters please'))
		}
	})
	
	input.addEventListener('focusout', e => {
		if (!(e.relatedTarget && e.relatedTarget.classList.contains('dropdown-item'))) {
			content.style.display = 'none'
		}
	})
	
}





/* 
 *  listArgs
 */
export const listArgs = (list, rec) => {
	let txt = rec[list[0]]
	const add = (sep, val) => txt += rec[val] ? sep + rec[val] : ''
	
	for (let i=1; i < list.length; ++i) {
		if (list[i].charAt(0) === '+') {
			add(' ', list[i].substring(1))
		} else {
			add(' - ', list[i])
		}
	}
	return txt
}





/* 
 *  autocompleteText
 */
export const autocompleteText = async (input, form) => {
	const query = toJSON(input.getAttribute('data-query'))
	const fld = form.fields.find(f => f.name === input.getAttribute('name'))
	let rec = fld.data ? fld.data.find(r => r._id === form.data[fld.name]) : null
	// read data
	if (!fld.data || !rec) {
		const id = {_id: form.data[fld.name]}
		query.where = query.where ? Object.assign(query.where, id) : id
		const res = await remote(query)
		if (res.err) return
		if (!res[0]) return alert(translate('autocomplete _id not found '+input.value))
		if (fld.data) {
			fld.data.push(res[0])
			rec = res[0]
		} else {
			fld.data = res
			rec = fld.data.find(r => r._id === form.data[fld.name])
		}
	}
	if (rec) {
		input.value = listArgs(strSplit(input.getAttribute('data-list'), ','), rec)
		if (query.extra) {
			extraFields(query.extra, rec, input)
		}
	}
}




/* 
 *  extraFields
 */
const extraFields = (extraStr, rec, input) => {
	const formE = input.closest('form')
	const form = findForm(formE)
	const extra = strSplit(extraStr, ',')
	extra.forEach(f => {
		if (rec[f]) {
			e$(formE, `[name=${f}]`).value = rec[f]
			if (form.data) form.data[f] = rec[f]
		}
	})
}







/* 
 *  Notification
 */
export const notification = message => {
	const notif = createElement(`
		<div class="notification is-danger">
			<button class="delete"></button>
		</div>
	`)
	notif.append(createElement('<p>'+message+'</p>'))
	e$(notif, 'button').addEventListener('click', e => notif.remove())
	$('body').append(notif)
}





/* 
 *  Input image load
 */
export const inputImageLoad = (elem, id) => {
	if (id) {
		const par = {
			cmd: 'FILE',
			db: br.db,
			mode: 'r',
			_id: id,
			w: Math.round(elem.width),
			usercode: br.usercode
		}
		elem.setAttribute('src', '/brumba?' + JSON.stringify(par))
	}
}





/* 
 *  Input type file or image
 */
export const inputFile = (elem, image) => {
	elem.setAttribute('alt', ' ')
	
	// click
	elem.addEventListener('click', e => {
		openFile(elem.value, image ? elem.value : null)
	}, false)
	
	// right click
	elem.addEventListener('contextmenu', e => {
		e.preventDefault()
		fileUpload(br.db, res => {
			if (res.err) return alert('Cannot upload file')
			if (image) {
				const val = res.newid || res._id
				elem.value = val
				inputImageLoad(elem, val)
			} else {
				elem.value = res.filename
			}
			elem.dispatchEvent(new Event('change'))
		})        
	}, false)
}



/* 
 *  Open file
 */
export const openFile = (filename, id) => {
	const par = {
		cmd: 'FILE',
		db: br.db,
		mode: 'r',
		usercode: br.usercode
	}
	if (id) {
		par._id = id
	} else {
		par.filename = filename
	}
	window.open('/brumba?' + JSON.stringify(par))
}






/* 
 *  Context menu
 */
/*export const contextMenu = (input, options) => {
	const cm = createElement(`
		<div class="dropdown br-contextmenu is-active">
			<div class="dropdown-trigger">
			</div>
			<div class="dropdown-menu" role="menu">
				<div class="dropdown-content">
				</div>
			</div>
		</div>
	`)
	const parent = input.parentNode
	parent.replaceChild(cm, input)
	e$(cm, '.dropdown-trigger').append(input)
	
	
	const content = e$(cm, '.dropdown-content')
	content.style.display = 'none'

	content.innerHTML = ''
	options.forEach(o => {
		const a = createElement(`
			<a class="dropdown-item">${o.title}</a>
		`)
		a.onclick = o.fn
		content.append(a)
	})
	content.style.display = 'block'
	
	
	
}

const contextMenuClose = e => {
console.log('contextMenuClose')
	const cm = $('.br-contextmenu')
	if (cm) {
		const input = e$(cm, 'input')
		if (input) {
			cm.parentNode.replaceChild(input, cm)
		}
	}
}

$('body').addEventListener('click', contextMenuClose)
*/
