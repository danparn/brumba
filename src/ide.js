/*
 * Brumba
 * Copyright (c) 2012-2020 Dan Parnete
 *
 * This source code is licensed under the MIT license.
*/


import { render } from 'web/inferno'
import { objLess, hex24 } from './common'
import { Textarea } from './inferno-bulma'
import { Navbar, Sidebar, closeSidebar, closeDialog, confirmModal, imgLoad, notification } from './components'
import { $, $$, e$$, br, remote, modified, createElement, createStyle, createScript, loadCSS, unselect } from './util'
import { newPage, tileEvents, tabEvents } from './ide-page'
import { pageRender, toggleList, pageWrapper } from './page'
import { newForm, addFields, fieldEvents, itemEvents, containerEvents } from './ide-form'
import { newGrid, gridRender, moveColumn } from './ide-grid'
import { newReport, openReport } from './ide-report'
import { properties, locales } from './ide-props'
import { Editor, openDialogEditor, dialogEditor, onApplay } from './ide-editor'

// css
loadCSS('/node_modules/basiccontext/dist/basicContext.min.css')
loadCSS('/node_modules/basiccontext/dist/themes/default.min.css')
loadCSS('/css/ide.css')



/* 
 *  Ide
 */
const Ide = (props) => {
  Object.assign(br, JSON.parse(props.br))
  let forms, pages, reports, scripts
  let par = {
    cmd: 'GET',
    db: br.app,
    fields: 'name',
    sort: {name: 1}
  }
  keyEvents()
    
  // tools
  const tools = e => {
	  $$('style.br-css').forEach(s => s.remove())
		$$('script.br-events').forEach(s => s.remove())
    switch (e.target.name) {
      case 'page':
        selected(e)
        closeSidebar()
        newPage()
        break
      case 'form':
        selected(e)
        closeSidebar()
        newForm()
        break
      case 'grid':
        selected(e)
        closeSidebar()
        newGrid()
        break
      case 'report':
        selected(e)
        closeSidebar()
        newReport()
        break
      case 'fields':
        $('#br-sidebar').style.width = "0px"
        addFields()
        break
      case 'script':
        selected(e)
        closeSidebar()
        br.wo.name = 'scripts'
        br.wo.value = new Date().toLocaleString()
        render(null, br.ws)
        br.ws.innerHTML = ''
        render(<Editor />, br.ws)  
        break
      default:
    }
  }
  
  // menu
  const getMenu = e => {
    closeSidebar()
    selected(e)
    par.coll = 'application'
    par.where = {section: 'menu'}
    delete par.fields
    remote(par).then(res => {
      if (res.err) return
      const menu = (res[0]) ? res[0].menu : ''
      if (res[0]) br.wo.id = res[0]._id
      render(null, br.ws)
      br.ws.innerHTML = ''
      closeDialog()
      render(<Editor code={menu} />, br.ws)
    })
  }

  // renderNav
  const renderNav = () => {
    const toolsText = (localStorage) ? localStorage.getItem('br.tools-text') : ''
    const workonChange = e => {
      e.target.modified = true
      modified(true)
      if ($('.br-props')) properties($('.br-selected'))
    }
    const onProperties = e => {
      properties($('.br-selected'))
    }
    const onEditor = e => {
      dialogEditor(e.target.textContent)
    }
    const onSave = e => {
      save(() => {
        reloadList()
      })
    }
    const onLocales = e => {
			locales($('.br-selected'))
    }
    const onDel = e => {
      del(() => {
        reloadList()
        render(null, br.ws)
        br.ws.innerHTML = ''
      })
    }

    const nav = (
      <div class="br-container">
        <Navbar>
          <div class="logo">brumba</div>
          <a id="br-save" class="space" onClick={onSave}><i class="fas fa-save"></i><span>save</span></a>
          <a onClick={onProperties}><i class="fa fa-list-alt"></i><span>properties</span></a>
          <a onClick={onEditor}><i class="fa fa-code"></i><span>events</span></a>
          <a onClick={onEditor}><i class="fab fa-css3"></i><span>css</span></a>
          <a onClick={onEditor}><i class="fab fa-html5"></i><span>html</span></a>
          <a onClick={onLocales}><i class="fa fa-globe"></i><span>locales</span></a>
          <a><input class="input is-small br-workon" onchange={workonChange} /></a>
          <a class="space" onClick={toggleList}><i class="fa fa-list-ol"></i><span>list</span></a>
          <a onClick={borders}><i class="fa fa-border-none"></i><span>borders</span></a>
          <a class="align-right" onClick={onDel}><i class="fa fa-trash"></i><span>delete</span></a>
        </Navbar>
        <Sidebar>
          <li><a class="has-arrow" aria-expanded="false">FORMS</a><ul class="forms">{forms}</ul></li>
          <li><a class="has-arrow" aria-expanded="false">PAGES</a><ul class="pages">{pages}</ul></li>
          <li><a class="has-arrow" aria-expanded="false">REPORTS</a><ul class="reports">{reports}</ul></li>
          <li><a class="has-arrow" aria-expanded="false">SCRIPTS</a><ul class="scripts">{scripts}</ul></li>
          <li><a name="menu" onClick={getMenu}>MENU</a></li>
          <li><a class="has-arrow" aria-expanded="false">TOOLS</a>
            <ul>
              <li><a name="page" onClick={tools}>new Page</a></li>
              <li><a name="form" onClick={tools}>new Form</a></li>
              <li><a name="grid" onClick={tools}>new Grid</a></li>
              <li><a name="report" onClick={tools}>new Report</a></li>
              <li><a name="script" onClick={tools}>new Script</a></li>
              <li><a name="fields" onClick={tools}>add Fields</a></li>
              <li>
                <div class="control">
                  <Textarea id="br-tools-text" value={toolsText} />
                </div>
              </li>
            </ul>
          </li>
        </Sidebar>
        <div id="br-dialog" />
        <div id="br-workspace" class="container is-fluid" />
      </div>
    )

    render(nav, $('#root'))
    br.ws = $('#br-workspace')
    br.wo = $('.br-workon')
    br.dlg = $('#br-dialog')
    br.wo.addEventListener('click', unselect)
//localStorage.clear()
//newForm()
//newGrid()
//newPage()
  }

  // get data and render
  (async () => {
    forms = await addItems('forms')
    pages = await addItems('pages')
    reports = await addItems('reports')
    scripts = await addItems('scripts')
    renderNav()
  })()
}

export default Ide;






/* 
 *  Set events
 */
const setEvents = () => {
  $$('.field').forEach(el => fieldEvents(el))
  $$('.br-label,.image,.button').forEach(el => itemEvents(el))
  $$('.container').forEach(el => containerEvents(el))
}



/* 
 *  Selected items
 */
const selected = e => {
  const wo = br.wo
  wo.value = e.target.text
  wo.name = e.target.name
  wo.id = e.target.id
  e.target.classList.add('active')        // active item
  modified(false)
}



/* 
 *  Create menu items list
 */
const addItems = async (coll) => {
  const par = {
    cmd: 'GET',
    db: br.app,
    coll: coll,
    fields: 'name',
    sort: {name: 1}
  }
  
  // menuItem
  const menuItem = async e => {
    closeSidebar()
    selected(e)
    open(e.target.name, e.target.id)
  }
  
  const res = await remote(par)
  delete par.fields
  delete par.sort
  let list = []
  for (let i=0; i < res.length; ++i) {
    list.push(
      <li>
        <a name={coll} id={res[i]._id} onClick={menuItem}>
          {res[i].name}
        </a>
      </li>
    )
  }
  if (list.length === 0) {
    list.push(<li />)
  }
  return list
}




/* 
 *  Open by id or name
 */
const open = async (coll, id) => {
	const ws = br.ws
	render(null, ws)
	ws.innerHTML = ''
  $$('style.br-css').forEach(s => s.remove())
	$$('script.br-events').forEach(s => s.remove())
 
  const par = {
    cmd: 'GET',
    db: br.app,
    coll: coll,
		where: hex24.test(id) ? {_id: id} : {name: id}
  }
	const res = await remote(par)
	if (res.err || !res[0]) return
	const rec = res[0]
	
	switch (coll) {
		case 'pages':
			await pageRender(rec, true)
			$$('.tile').forEach(t => tileEvents(t))
			$$('.tab').forEach(t => tabEvents(t))
			if ($('.br-page').classList.contains('has-list')) {
				$('.br-list').classList.remove('hidden')
			}
			borders()
			openDialogEditor()
			break

		case 'forms':
			ws.innerHTML = pageWrapper(rec.html)
			if (rec.css) {
				createStyle(rec.css)
			}
			if (rec.events) {
				$('head').appendChild(createElement(`
					<script class="br-events">${rec.events}</script>
				`))
			}
			const form = $('form')
			if (form.classList.contains('has-list')) {
				$('.br-list').classList.remove('hidden')
			}
			if (form.hasAttribute('data-grid')) {
				gridRender(JSON.parse(form.getAttribute('data-grid')), form, true)
			} else {
				$$('form input').forEach(el => {
					el.setAttribute('readonly', '')
					if (!'button,radio'.includes(el.type)) {
						el.value = el.name
					}
				})
				$$('.field, button').forEach(el => {
					el.setAttribute('draggable', 'true')
				})
				$$('.label').forEach(el => {
					if (!el.parentElement.classList.contains('field')) {
						el.setAttribute('draggable', 'true')
					}
				})
				$$('.image').forEach(img => imgLoad(br.app, img))
				setEvents()  
			}
			e$$(form, '[hidden]').forEach(el => {
				el.removeAttribute('hidden')
				el.classList.add('br-hidden')
			})
			borders()
			if ($('.br-props')) properties()
			else openDialogEditor()
			break

		case 'reports':
			openReport(rec)
			break

		case 'scripts':
			closeDialog()
			render(<Editor code={rec.code} />, ws)
			break
		default:
	}    
}



/* 
 *  Reload list
 */
export const reloadList = async () => {
	const coll = br.wo.name
	const list = await addItems(coll)
	const cont = $('ul.'+coll)
	render(null, cont)
	cont.innerHTML = ''
	render(<div>{list}</div>, cont)
}



/* 
 *  Save
 */
const save = (cb) => {
  const saveBut = $('#br-save')
  const modif = 'modified'
  if (!saveBut.classList.contains(modif)) return
  const wo = br.wo
  const cme = $('.CodeMirror')
  const cm = (cme) ? cme.CodeMirror : null
  let css
  unselect()
  $$('.br-borders').forEach(el => el.classList.remove('br-borders'))
  // has-list
  const pg = $('.br-page') || $('form')
  if (pg && wo.name !== 'reports') {
		if ($('.br-list').classList.contains('hidden')) {
			pg.classList.remove('has-list')
		} else {
			pg.classList.add('has-list')
		}
	}

  let par = {cmd: 'POST', db: br.app, coll: wo.name}
  let data = {name: wo.value}
	if (wo.id) {
		data._id = wo.id
	}
  
  switch (wo.name) {    
    // menu
    case 'menu':
      par.coll = 'application'
      delete data.name
      data.menu = cm.getValue()
      if (!wo.id) {
        data.section = wo.name
      }
      break
    
    // scripts
    case 'scripts':
      data.code = cm.getValue()
      data.updated = Date.now()
      break

    // form and report
    case 'forms':
    case 'reports':
      if ($('.br-dialog-editor')) {
				onApplay()
			}
      const form = $('form')
      if (!form) return
      $$('[draggable]').forEach(el => el.removeAttribute('draggable'))
      e$$(form, '.br-hidden').forEach(el => {
				el.setAttribute('hidden', '')
				el.classList.remove('br-hidden')
			})
//$$('.dropzone').forEach(el => el.classList.remove('dropzone'))
      e$$(form, 'input,textarea').forEach(el => {
        el.removeAttribute('readonly')
        if (el.tagName === 'TEXTAREA') {
					el.textContent = ''
        } else if (!'button,radio'.includes(el.type)) {
          el.removeAttribute('value')
        }
      })
      form.name = wo.value
      if (form.hasAttribute('data-grid')) {
        form.innerHTML = ''
      }
      data.html = form.outerHTML
      css = $('head style.br-css')
      if (css) {
        data.css = css.innerHTML
      }
      const events = $('script.br-events')
      if (events) data.events = events.innerHTML
      break
    
    // page
    case 'pages':
      if ($('.br-dialog-editor')) {
				onApplay()
			}
      const page = createElement($('.br-page').outerHTML)
      page.setAttribute('name', wo.value)
      let forms = e$$(page, 'form')
      forms.forEach(f => f.remove())
      css = $('head style.br-page-css')
      if (css) {
        data.css = css.innerHTML
      }
      data.html = page.outerHTML
      break
    
    default:
  }
  
  remote(par, data).then(res => {
    if (res.err) {
      console.log(res)
    } else {
      saveBut.classList.remove(modif)
      if ('forms,pages,reports'.includes(wo.name)) {
				open(wo.name, wo.id || wo.value)
			}
    }
    if (cb) cb()
  })
}



/* 
 *  Delete
 */
const del = (cb) => {
  const msg = 'Are you sure you want to delete this page/form?'
  const onOk = e => {
		if (br.wo.id) {
			const par = {cmd: 'DEL', db: br.app, coll: br.wo.name, where: {_id: br.wo.id}}
			remote(par).then(res => {
				if (res.err) {
					console.log(res)
				}
				if (cb) cb()
			})
		}
	}
	
	confirmModal(msg, onOk, 'is-danger')
}



/* 
 *  Borders
 */
const borders = () => {
  let cls
  if ($('.br-page')) {
    cls = '.tile'
  } else if ($('.br-band')) {
    cls = '.br-band'
  } else {
    cls = '.container'
  }
  const elems = $$('.br-borders')
  if (elems.length > 0) {
    elems.forEach(el => el.classList.remove('br-borders'))
  } else {
    $$(cls).forEach(el => {
			if (el.id !== 'br-workspace') {
				el.classList.add('br-borders')
			}
		})
  }
}



/* 
 *  Keyboard events
 */
export const keyEvents = () => {
	let count = 0
	let step = 1
  
  document.addEventListener("keydown", e => {
    if (e.isComposing || e.keyCode === 229) return
    if (br.dlg.firstChild && 'Delete,ArrowLeft,ArrowRight,ArrowUp,ArrowDown'.includes(e.code)) {
			return																		// do nothing if Properties opened
		}
		const isReport = br.wo.name === 'reports'
		const gridE = $('[data-grid]')
		const selected = $$('.br-selected')
		if (e.repeat) {
			++count
			if (step === 1 && count > 20) {
				step = 5
			}
		} else if (count) {
			count = 0
			step = 1
		}

    // DEL
    if (e.code === 'Delete' && e.ctrlKey) {
			e.stopPropagation()
			e.preventDefault()
			selected.forEach(el => {
				if (el.classList.contains('tile')) {
					if (!el.classList.contains('is-ancestor')) {
						const p = el.parentNode
						p.removeChild(el)
						if (p.childElementCount === 0) {
							p.classList.remove('is-vertical')
						}
						modified(true)
					}
				} else if (el.classList.contains('container') || el.classList.contains('br-band')) {
					el.remove()
				} else {
					const p = el.closest('.field')
					if (el.tagName === 'LABEL') {
						el.parentNode.removeChild(el)
					} else {
						el.parentNode.parentNode.removeChild(el.parentNode)
					}
					if (p && p.childNodes.length === 0) {
						p.parentNode.removeChild(p)
					}
					modified(true)
				}
			})
    
    // CTRL+S
    } else if (e.code === 'KeyS' && e.ctrlKey) {
      e.stopPropagation()
      e.preventDefault()
      save()

    // CTRL+B
    } else if (e.code === 'KeyB' && e.ctrlKey) {
      e.stopPropagation()
      e.preventDefault()
      borders()

    // ArrowLeft
    } else if (e.code === 'ArrowLeft') {
      if (isReport) {
				reportArrows(-step, 0)
			} else if (gridE) {
				moveColumn(e, -1)
			} else if (e.shiftKey) {
        setWidth(-1)
			}
    
    // ArrowRight
    } else if (e.code === 'ArrowRight') {
      if (isReport) {
				reportArrows(step, 0)
			} else if (gridE) {
				moveColumn(e, 1)
			} else if (e.shiftKey) {
        setWidth(1)
			}

    // ArrowUp
    } else if (e.code === 'ArrowUp') {
      if (isReport) {
				reportArrows(0, -step)
			}
    
    // ArrowDown
    } else if (e.code === 'ArrowDown') {
      if (isReport) {
				reportArrows(0, step)
			}
    }
			
    // setWidth
    function setWidth(inc) {
			e.stopPropagation()
			e.preventDefault()
      selected.forEach(elem => {
        // tile
        if (elem.classList.contains('tile')) {
          if (!elem.parentElement.classList.contains('is-vertical') && elem.nextSibling) {
						let w = 6
						let old
						elem.classList.forEach(c => {
							if (c.startsWith('is-')) {
								const n = c.substring(3)
								if (!isNaN(n)) {
									w = parseInt(n, 10)
									old = c
								}
							}
						})
						if ((inc > 0 && w+inc < 12) || (inc < 0 && w+inc > 0)) {
							if (old) {
								elem.classList.remove(old)
							}
							w += inc
							elem.classList.add('is-'+w)
						}
          }
        
        // container
        } else if (elem.classList.contains('container')) {
					if (elem !== elem.parentElement.lastChild) {
						let w = elem.offsetWidth / elem.parentElement.offsetWidth * 100
						w += inc
						elem.style.width = w+'%'
						if (!elem.style.flex) elem.style.flex = 'none'
					}
        } else {
          const parent = elem.closest('.columns')
          const el = elem.tagName === 'LABEL' || elem.classList.contains('container')
                    ? elem 
                    : elem.parentElement
          let w = el.style.width
                ? parseInt(el.style.width.substring(-1), 10)
                : Math.round(el.offsetWidth/parent.offsetWidth*100)
          w = Math.min(Math.max(w+inc, 5), 100)
          el.style.width = w+'%'  
        }
        modified(true)
      })
    }
    
    // reportArrows
    function reportArrows(hor, ver) {
			e.stopPropagation()
			e.preventDefault()
      selected.forEach(el => {
				if (hor) {
					if (e.shiftKey) {
						el.style.width = Math.max((parseInt(el.style.width.substring(-1), 10) || 50) + hor, 5) + 'px'
					} else {
						el.style.left = Math.max(parseInt(el.style.left.substring(-1), 10) + hor, 0) + 'px'
					}
				}
				if (ver) {
					if (e.shiftKey) {
						el.style.height = Math.max((parseInt(el.style.height.substring(-1), 10) || 17) + ver, 5) + 'px'
					} else {
						el.style.top = Math.max(parseInt(el.style.top.substring(-1), 10) + ver, 0) + 'px'
					}
				}
        modified(true)
			})
    }
    
  })
}





