/*
 * Brumba
 * Copyright (c) 2012-2020 Dan Parnete
 *
 * This source code is licensed under the MIT license.
*/

import { render } from 'web/inferno'
import { strSplit, strCap, toJSON, objClone, decimals, objEmpty, timezone } from './common'
import { $, e$, e$$, br, remote, createElement, modified, substArgs, translate } from './util'
import { Dialog, posDialog, closeDialog, confirmModal, autocomplete, autocompleteText, 
					notification, inputImageLoad, inputFile } from './components'
import { addForm, findForm, listForm, getDetails, refreshForms } from './forms'
import { Grid, gridRefresh } from './grid'
import sha256 from 'web/sha256'


const eventMsg = 'Event blocked by handlers.'


/* 
 *  Form init
 */
export const formInit = (formE) => {
  let form = addForm(formE)
  
  // input types
  e$$(formE, '.br-date').forEach(el => el.setAttribute('type', 'date'))
  e$$(formE, '.br-datetime-local').forEach(el => el.setAttribute('type', 'datetime-local'))
  e$$(formE, '[type=radio]').forEach(el => el.value = el.nextSibling.textContent)
  e$$(formE, '.br-autocomplete').forEach(el => autocomplete(el, form))
  e$$(formE, '[type=image]').forEach(el => inputFile(el, true))
  e$$(formE, '.br-file').forEach(el => inputFile(el))
  e$$(formE, '.br-password').forEach(el => el.setAttribute('type', 'password'))
  e$$(formE, '.br-email').forEach(el => el.setAttribute('type', 'email'))
  
  // fields
  const classType = (el) => {
		if (el.className.includes('br-number')) return 'number'
		else if (el.className.includes('br-email')) return 'email'
	}
  form.fields = []
  e$$(formE, 'input,select,textarea').forEach(el => {
		if (el.classList.contains('br-disabled')) el.setAttribute('disabled', 'true')
		if (el.classList.contains('br-readonly')) el.setAttribute('readonly', 'true')
		const name = el.getAttribute('name')
		if (!form.fields.find(f => f.name === name)) {
			form.fields.push({
				name: name,
				type: (el.getAttribute('type')) || (classType(el)) ||
							(el.tagName === 'INPUT' ? 'text' : el.tagName.toLowerCase())
			})
		}
		
		// onchange
		el.addEventListener('change', e => {
			const type = el.getAttribute('type')
			if (type !== 'autocomplete') {
				let val = el.value
				switch (type) {
					case 'checkbox':
						if (el.checked) val = true
						else val = ''
						break
					case 'datetime-local':
						val = Date.parse(val)
						break
					default:
				}
				if (val === '') {
					val = null
				}
				const fld = form.fields.find(f => f.name === el.getAttribute('name'))
				fld.newval = val
				if (!formE.classList.contains('br-readonly') && !form.searchMode) {
					form.modified = true
					modified(true)
				}
			}
		})
		
		if (el.tagName === 'SELECT') {
			select(el, form)
		}
	})
}




/**
 * Form: retrieve, then update.
 * @method
 * @param {object} form - form object
 * @param {string} id - document id
 */
export const formRetrieve = (form, id) => {
	remote({db: br.db, coll: form.query.coll, where: {_id: id}}).then(res => {
		if (res.err) return
		if (res[0]) {
			form.data = res[0]
			if (!$(`form[name=${form.name}]`).dispatchEvent(new Event('retrieve', {cancelable: true}))) {
				return alert(eventMsg)
			}
			formUpdate(form, form.data)
		}
	})
}




/**
 * Form: data update
 * @method
 * @param {element} formE
 * @param {json} data
 */
export const formUpdate = (formE, data) => {
	if (!formE || !data) return console.log('formUpdate no args')
	if (!formE.tagName) {
		formE = $(`form[name=${formE.name}]`)
	}
	const form = findForm(formE)
	if (form) {
		form.data = data
		form.fields.forEach(f => delete f.newval)
		updateDetails(form)
	}
	
	e$$(formE, 'input,select,textarea').forEach(el => {
		const type = el.classList.contains('br-autocomplete')
								? 'autocomplete'
								: el.getAttribute('type') || el.tagName.toLowerCase()
		const val = data[el.name]
//console.log(`name=${el.name}  type=${type}  val=${val}`)
		if (val) {
			switch (type) {
				case 'number':
					const dec = el.getAttribute('data-decimals')
					if (dec) {
						el.value = decimals(val, parseInt(dec, 10))
					} else {
						el.value = val
					}
					break
				case 'datetime-local':
					el.value = (new Date(val+timezone())).toJSON().substring(0, 16)
					break
				case 'checkbox':
					el.checked = val
					break
				case 'radio':
					el.checked = (el.value === val)
					break
				case 'autocomplete':
					autocompleteText(el, form)
					break
				case 'image':
					el.classList.remove('input')
					inputImageLoad(el, val)
				default:
					el.value = val
			}
		} else if (['checkbox','radio'].includes(type)) {
			el.checked = false
		} else {
			el.value = ''
			if (type === 'image') {
				el.removeAttribute('src')
				el.classList.add('input')
			}
		}
	})

	formE.dispatchEvent(new Event('update'))
}




/* 
 *  Update details
 */
export const updateDetails = (form) => {
	getDetails(form).forEach(d => {
		if (d.query) {
//console.log(`updateDetails: ${d.name}`)
			// field
			if (d.query.field && d.externRefresh) {
				const fld = strSplit(d.query.field, '.').pop()
				d.externRefresh((form.data ? form.data[fld] : null) || [])
			
			// concat
			} else if (d.query.concat && d.externRefresh) {
				let mdata = []
				const flds = strSplit(d.query.concat, '.')
				let m = d.master
				for (let i=flds.length-1; i >= 0; --i) {
					if (m) {
						if (!m.columns && m.data && m.data[flds[i]]) {
							mdata = m.data[flds[i]]
							break
						}
						m = m.master
					}
				}
				let data = []
				let fld = flds[flds.length-1]
				for (let i=0,len=mdata.length; i < len; ++i) {
					const fldata = mdata[i][fld]
					if (fldata) {
						// add
						if (d.query.add) {
							const adds = strSplit(d.query.add, ',')
							for (let j=0; j < fldata.length; ++j) {
								adds.forEach(a => {
									if (mdata[i][a]) {
										fldata[j][a] = mdata[i][a]
									}
								})
							}
						}
						data = data.concat(fldata)
					}
				}
				d.externRefresh(data)
				
			// {}
			} else if (objEmpty(d.query)) {
				formUpdate(d, form.data)
			}
			
			updateDetails(d)
		}
	})
}




/**
 * Form input. Collect input data.
 * @function
 * @param {object|string} form - form or formName
 * @param {string} fields - comma separated fields list
 * @param {boolean} required - required fields
 * @returns {object|null} collected data, null if errors
 */
export const formInput = (form, fields, required) => {
	if (typeof form === 'string') form = findForm(form)
	if (!form) return null
	
	const data = {}
	const flds = fields ? strSplit(fields, ',') : null
	form.fields.forEach(f => {
		const inFields = flds && flds.includes(f.name)
		if (inFields && !f.newval && check) {
			alert('Required field: ' + fname)
			return null
		}
		if (f.newval && (inFields || !fields)) {
			if (f.type === 'password') {
				data[f.name] = sha256(f.newval)
			} else {
				data[f.name] = f.newval
			}
		}
	})
	return data
}





/**
 * Form save. Save modified data
 * @method
 * @param {element} formE
 */
export const formSave = (formE) => {
	const form = findForm(formE)
	if (form && form.modified && form.query) {
		if (!formE.dispatchEvent(new Event('save', {cancelable: true}))) {
			return alert(eventMsg)
		}
		let rec = formInput(form)
		if (!objEmpty(rec)) {
			let coll
			let master
			let hasId = false
			// _id
			if (form.data && form.data._id) {
				rec._id = form.data._id
				hasId = true
			// user and type
			} else if (form.query.coll) {
				rec._user = br.user
				if (br.menuid) {
					rec.type = br.menuid
				}
			}
			
			// query.field
			if (form.query.field) {
				let f = form
				let r = rec
				while (f.master) {
//console.log('master: '+f.master.name)
					if (!f.master.data || !f.master.data._id) {
						notification('Master record not found')
						return
					}
					const fld = strSplit(f.query.field, '.').pop()
					let m = {_id: f.master.data._id}
//console.log(m)
					m[fld] = [r]
//console.log(m)
					r = m
					f = f.master
				}
				master = f
				coll = f.query.coll
				rec = r
			}
			
			const par = {cmd: 'POST', coll: coll || form.query.coll}
			if (form.query.db) {
				par.db = form.query.db
			}
//console.log(par)
//console.log(rec)
//return
			remote(par, rec).then(res => {
				if (res.err) return
				modified(false)
				if (formE.hasAttribute('data-list')) {
					formList()
				}
				refreshForms()
				if (formE.classList.contains('br-grid-form')) {
					render(null, br.dlg)
				}
			})
		}
	}
}




/* 
 *  Form search
 */
export const formSearch = () => {
	const formE = $('form.has-list')
	const form = findForm(formE)
	if (!form) return
	
	if (form.searchMode) {
		form.searchMode = false
		formE.classList.remove('br-search')
		form.search = formInput(form)
		formUpdate(form, [])
		formList()
		
	} else {
		form.searchMode = true
		form.search = null
		formE.classList.add('br-search')
		formUpdate(form, [])
	}
}



/* 
 *  Form delete
 */
export const formDelete = () => {
	const form = listForm()
	if (form && form.data && form.data._id) {
		if (!$(`form[name=${form.name}]`).dispatchEvent(new Event('delete', {cancelable: true}))) {
			return alert(eventMsg)
		}
		const par = {coll: form.query.coll, where: {_id: form.data._id}}
		if (form.query.db) {
			par.db = form.query.db
		}
		deleteRecord(par, res => {
			formList()
			formUpdate(form, {})
			modified(false)
		})
	}
}

/* 
 *  Delete record
 */
export const deleteRecord = (par, cb) => {
  const msg = translate('Are you sure you want to delete the selected record?')
  const onOk = e => {
    Object.assign(par, {cmd: 'DEL'})
    remote(par).then(res => {
			if (res.err) return
			if (cb) cb(res)
		})
	}
	
	confirmModal(msg, onOk, 'is-danger')
}





/* 
 *  Form list
 */
export const formList = () => {
	const form = listForm()
	if (form) {
		const formE = $(`form[name=${form.name}]`)
		const query = objClone(form.query)
		query.result = 'count'
		if (form.search) {
			query.where = query.where
										? Object.assign(query.where, form.search)
										: form.search
		}
		remote(query).then(res => {
			if (res.err) return
		
			const flds = strSplit(form.list, ',')
			if (flds && flds.length) {
				const grid = {
					query: query,
					rows: 20,
					fixed: 0,
					columns: [],
					readonly: true
				}
				flds.forEach(f => {
					const [fname, head] = strSplit(f, ':')
					const [name, as] = strSplit(fname, ' as ')
					const col = {
						name: name,
						header: translate(head || strCap(as || name).replace(/_/g, ' '))
					}
					if (as) col.as = as
					const fld = e$(formE, `[name=${as || name}]`)
					if (fld) {
						if (fld.tagName === 'SELECT' || fld.classList.contains('br-autocomplete')) {
							if (fld.tagName === 'SELECT') {
								col.type = 'select'
							} else {
								col.type = 'autocomplete'
							}
							col.query = fld.getAttribute('data-query')
							col.list = fld.getAttribute('data-list')
						} else if (fld.type) {
							col.type = fld.type
						}
					}
					grid.columns.push(col)
				})
				
				const rowClick = selected => {
					selected.forEach(row => {
						if (row.id) {
							formRetrieve(form, row.id)
						} else {
							formUpdate(form, {})
						}
					})
					modified(false)
				}
				
				const list = $('.br-list')
				render(null, list)
				render(
					<Grid grid={grid} rowClick={rowClick} />,
					list
				)
			}
		})
	}
}















/* 
 *  Select
 */
const select = (elem, form) => {
	const query = elem.getAttribute('data-query')
	if (query) {
		let q = toJSON(query)
		if (!q) return

		if (Array.isArray(q)) { // array of {_id:..., _txt:...}
			selectFromArrayQuery(elem, q)
		} else {
			if (elem.classList.contains('br-query-args') && !substArgs(q.where, elem)) return
			const fld = form.fields.find(f => f.name === elem.name)

			if (q.coll) {
				remote(q).then(res => {
					if (res.err) return
					fld.data = res
					selectPopulate(elem, res)
				})

			} else if (q.script) { // already formated from server script 
				remote(q)
				.then(res => {
					if (res.err) return
					if (res.html) {
						elem.append(res.html)
					} else {
						fld.data = res
						selectPopulate(elem, res)
					}
				})
				.catch(console.error)
			}
		}
	}
}


export const selectPopulate = (elem, data) => {
	const fields = elem.getAttribute('data-list')
	const fld = strSplit(fields, ',')
	const q = toJSON(elem.getAttribute('data-query'))
	let txt = ''
	if (!fields || !q) return
	
	elem.innerHTML = ''
	elem.append(createElement('<option></option>'))
	for (let i = 0, len = data.length; i < len; ++i) {
		const r = data[i]
		txt = ''
		for (let j = 1; j < fld.length; ++j) {
			let fl = fld[j],
						sep = ''
			if (j > 1) {
				if (fld[j].charAt(0) === '+') {
					fl = fld[j].substr(1)
					sep = ' '
				} else {
					sep = ' - '
				}
			}
			if (r[fl]) {
				txt += sep
				txt += r[fl]
			}
		}
		const val = r[fld[0]]
		const typ = (typeof val == 'number') ? 'type="number" ' : ''
		const opt = createElement('<option ' + typ + 'value="' + val + '">' + txt + '</option>')
		if (q.group || q.groupsel) {
			if (data.find(d => d[fld[0]].indexOf(val+'.') === 0)) {
				opt.classList.add('br-optgroup')
				if (!q.groupsel) {
					opt.setAttribute('disabled', '')
				}
			}
		}
		elem.append(opt)
	}
}


export const selectText = (rec, flds) => {
	let val = ''
	if (rec && flds && Array.isArray(flds)) {
		for (let j=1; j < flds.length; ++j) {
			let f = flds[j]
			if (j > 1) {
				if (f.charAt(0) === '+') {
					val += ' '
					f = f.substring(1)
				} else {
					val += ' - '
				}
			}
			val += (rec[f] || '')
		}
	}
	return val
}


export const selectFromArrayQuery = (elem, data) => {
	if (elem && data) {
		elem.innerHTML = ''
		elem.append(createElement('<option value=""></option>'))
		for (let i = 0, len = data.length; i < len; i++) {
			let s = data[i]._txt || data[i]._id+''
			s = translate(s)
			elem.append(createElement(`<option value="${data[i]._id}">${s}</option>`))
		}
	}
}




