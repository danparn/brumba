/*
 * Brumba
 * Copyright (c) 2012-2020 Dan Parnete
 *
 * This source code is licensed under the MIT license.
*/


import { render } from 'web/inferno'
import { toJSON, objEmpty } from './common'
import { $, $$, e$, e$$, br, remote, modified, unselect, createElement, createStyle, inputDate } from './util'
import { closeDialog } from './components'
import { formInit, formList, formUpdate } from './form'
import { formsInit, addForm, findForm, getDetails } from './forms'
import { gridRender } from './grid'




/* 
 *  Page open
 */
export const pageOpen = (pageName) => {
  const ws = br.ws
  $$('style.br-css').forEach(s => s.remove())
	$$('script.br-events').forEach(s => s.remove())
  render(null, ws)
  ws.innerHTML = ''
	formsInit()
	closeDialog()
	
  const [menupg, menuid, menuarg] =  pageName.split(';')
  br.menupg = menupg
  br.menuid = menuid
  br.menuarg = menuarg
  const [coll, name] =  menupg.split('.')
  const par = {
    cmd: 'GET',
    db: br.app,
    coll: coll,
    where: {name: name}
  }
  remote(par).then(res => {
    if (res.err) return
    if (!res[0]) return alert('Page not found '+pageName)
		
		pageRender(res[0])
		if ($('.br-content').firstChild.className.includes('has-list')) {
			$('.br-list').classList.remove('hidden')
		}
		const ctent = $('.br-content')
		ctent.style.width = ctent.offsetWidth+'px'
  })
}





/* 
 *  Page render
 */
export const pageRender = (data, ide) => {
  const ws = br.ws
  if (data) {
    ws.innerHTML = pageWrapper(data.html)
    const isPage = $('.br-page') ? true : false
    if (data.css) {
      createStyle(data.css, isPage)
    }
		if (data.events) {
			createScript(data.events)
		}
    if (isPage) {
			pageInit(ide)
		} else {
			const form = $('form')
			if (form.hasAttribute('data-grid')) {
				gridRender(form)
			} else if (!ide) {
				formInit(form)
				formList()
			}
		}
  } else {
    ws.innerHTML = ''
  }
}




/* 
 *  Page init
 */
export const pageInit = async (ide) => {
  $$('.tab').forEach(t => tabClick(t))
  const tiles = $$('.tile')
  for (let i=0; i < tiles.length; ++i) {
    const tile = tiles[i]
    const id = tile.getAttribute('data-form')
    if (id) {
      const par = {
        cmd: 'GET',
        db: br.app,
        coll: 'forms',
        where: {_id: id}
      }
      const res = await remote(par)
      if (!res.err && res[0]) {
				const rec = res[0]
				tile.innerHTML = rec.html
        if (rec.css) {
          createStyle(rec.css)
        }
 				if (rec.events) {
					createScript(rec.events)
				}
				const form = tile.firstChild
				if (form.hasAttribute('data-grid')) {
					gridRender(form)
				} else if (!ide) {
					formInit(form)
				}
			}
    }
  }
	formList()
}


/* 
 *  Tab click
 */
export const tabClick = (tab) => {
  tab.onclick = e => {
    e.stopPropagation()
    e.preventDefault()
    unselect()
    if (tab.className.includes('is-active')) return

    const active = $('.tabs .is-active')
    if (active) {
      active.classList.remove('is-active')
    }
    tab.classList.add('is-active')

    const name = tab.getAttribute('name')
    $$('.tab-pane').forEach(p => {
      if (p.getAttribute('name') === name) {
        p.style.display = "block"
      } else {
        p.style.display = "none"
      }
    })
  }
}




/* 
 *  Page wrapper
 */
export const pageWrapper = (page) => {
  const txt =  '<div class="columns">\
                  <div class="br-list column is-2 hidden"></div>\
                  <div class="br-content column">'+page+'</div>\
                </div>'
  return txt.replace(/> +/g, '>')
}




/* 
 *  Toggle list
 */
export const toggleList = (e) => {
  const list = $('.br-list')
  if (list) {
    const hid = 'hidden'
    if (list.className.includes(hid)) {
      list.classList.remove(hid)
    } else {
      list.classList.add(hid)
    }
    if (br.wo) {
			modified(true)
		}
  }
}




/* 
 *  Create script
 */
export const createScript = (code, src, type) => {
	const script = document.createElement('script')
	script.classList.add('br-events')
	script.type = type || 'module'
	if (src) {
		script.src = src
	} else {
		script.textContent = code
	}
	$('head').append(script)
}



/* 
 *  Page search
 */
export const pageSearch = () => {
  const close = e => br.dlg.innerHTML = ''
	const form = findForm($('form.has-list'))
  
  const ok = e => {
		let where = {}
		e$$(br.dlg, '.row').forEach(r => {
			const field = e$(r, '[name=field]')
			const f = field.value
			const t = e$(field, `option[value="${f}"]`).getAttribute('type')
			let v = e$(r, '[name=value]').value
			if (t === 'date') {
				v = inputDate(v)
			}
			let val
			switch (e$(r, '[name=condition]').value) {
				case '=':
					if ('textarea'.includes(t)) {
						val = {'$regex': v, '$options': 'i'}
					} else {
						val = v
					}
					break
				case '>':
					val = {$gt: v}
					break
				case '<':
					val = {$lt: v}
					break
				case '>=':
					val = {$gte: v}
					break
				case '<=':
					val = {$lte: v}
					break
				default:
			}
			if (e$(r, '[name=logic]').value === 'OR' && !where.$or) {
				where = objEmpty(where) ? {$or: []} : {$or: [where]}
			}
			if (Array.isArray(where.$or)) {
				const n = {}
				n[f] = val
				where.$or.push(n)
			} else {
				where[f] = val
			}
		})
		form.search = where
		formUpdate(form, [])
		formList()
	}
	
	if (form) {
		render(null, br.dlg)
		br.dlg.innerHTML = `
			<div class="modal is-active">
				<div class="modal-background"></div>
				<div class="modal-card">
					<header class="modal-card-head">
						<p class="modal-card-title">Search</p>
						<button class="delete" aria-label="close"></button>
					</header>
					<section class="modal-card-body">
					</section>
					<footer class="modal-card-foot">
						<button class="button mod-ok">Ok</button>
						<button class="button mod-close">Cancel</button>
					</footer>
				</div>
			</div>
		`	
		e$(br.dlg, '.mod-ok').addEventListener('click', e => {ok(); close()})
		e$(br.dlg, '.mod-close').addEventListener('click', close)
		e$(br.dlg, '.delete').addEventListener('click', close)
		e$(br.dlg, 'section').append(addRow())
		
		function addRow() {
			const row = createElement(`
				<div class="row columns">
					<div class="select">
						<select name="field"></select>
					</div>
					<div class="select width-unset">
						<select name="condition"></select>
					</div>
					<input class="input" name="value" />
					<div class="select width-unset">
						<select name="logic">
							<option value=""></option>
							<option value="AND">AND</option>
							<option value="OR">OR</option>
						</select>
					</div>
				</div>
			`)
			
			// colect fields
			const fields = e$(row, '[name=field]')
			const colectFields = (frm, pref) => {
				(frm.columns || frm.fields).forEach(f => {
					const name = pref ? pref+'.'+f.name : f.name
					fields.append(createElement(`<option type="${f.type}" value="${name}">${name}</option>`))
				})
				getDetails(frm).forEach(fr => {
					if (fr.query.field) {
						colectFields(fr, fr.query.field.substring(fr.query.field.indexOf('.')+1))
					} else if (!fr.query.concat) {
						colectFields(fr)
					}
				})
			}
			colectFields(form)
			
			const cond = e$(row, '[name=condition]')
			'=,>,<,>=,<='.split(',').forEach(c => {
				cond.append(createElement(`<option value="${c}">${c}</option>`))
			})
			
			e$(row, '[name=logic]').addEventListener('change', e => {
				const r = e.target.closest('.row')
				if (e.target.value === '') {
					if (r.nextElementSibling) {
						r.nextElementSibling.remove()
					}
				} else {
					if (!r.nextElementSibling) {
						e$(br.dlg, 'section').append(addRow())
					}
				}
			})
			
			return row
		}
	}
}
