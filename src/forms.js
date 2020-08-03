/*
 * Brumba
 * Copyright (c) 2012-2020 Dan Parnete
 *
 * This source code is licensed under the MIT license.
*/

import { toJSON, strSplit, objEmpty } from './common'
import { br } from './util'
import { formRetrieve, formUpdate } from './form'

/* 
 *  Form = {
 * 			name: string,
 * 			query: {coll: '', firlds: 'fld1,fld2', where: {}, sort: {field:1}},
 * 			list: string,
 * 			fields: [{
 * 								name: string,
 * 								type: string,
 * 								newval: newval
 * 							},
 * 							...
 * 							],
 * 			data: {},
 * 			newval: false
 * 	}
 */

let forms = []
export const formsInit = () => {forms = []}


/* 
 *  Add new form
 */
export const addForm = (formE) => {
	const name = formE.getAttribute('name')
	const	form = {
	  name: name,
	  query: toJSON(mainArgs(formE.getAttribute('data-query'))),
	  list: formE.getAttribute('data-list')
	}
	const i = forms.findIndex(f => f.name === name)
	if (i < 0) {
		forms.push(form)
	} else {
		forms[i] = form
	}
	setMaster(form)
	return form
}




/* 
 *  Add new grid
 */
export const addGrid = (grid) => {
	if (!findForm(grid.name)) {
		forms.push(grid)
		setMaster(grid)
	}
}




/* 
 *  Find form
 */
export const findForm = (arg) => {
	if (!arg) return null
	
	if (typeof arg !== 'string') {
		arg = arg.getAttribute('name')
	}
	return forms.find(f => f.name === arg)
}



/* 
 *  Get details
 */
export const getDetails = (form) => {
	let det = []
	if (form) {
		forms.forEach(f => {
			if (f.master === form) {
				det.push(f)
			}
		})
	}
	return det
}



/* 
 *  Find list form
 */
export const listForm = () => {
	return forms.find(f => f.list && f.query && f.query.coll && !f.query.findone)
}



/*
 * Get fields values and check
 */
export const formChanges = (formName, fields, check) => {
	if (formName) {
		const form = findForm(formName)
		if (form) {
			let data = {}
			// fields
			if (fields) {
				const fld = strSplit(fields, ',')
				for (let i=0; i < fld.length; ++i) {
					const fname = fld[i]
					const val = form.fields.find(f => f.name === fname).newval
					if (val) {
						data[fname] = val
					} else if (check) {
						alert('Required field: ' + fname)
						return false
					}
				}
			// all modified
			} else {
				for (let i=0; i < form.fields.length; ++i) {
					if (form.fields[i].newval) {
						data[form.fields[i].name] = form.fields[i].newval
					}
				}
			}
			return data
		} else {
			alert('getValues: form not found')
		}
	} else {
		alert('getValues: wrong parameters')
	}
	return false
}




/* 
 *  Set form's master
 */
export const setMaster = (form) => {
	if (form && form.query && !form.query.coll && !form.master) {
		const field = form.query.field || form.query.concat
		
		if (form.query.master) {
			form.master = findForm(form.query.master)
			delete form.query.master			
		
		} else if (field) {
			const p = field.lastIndexOf('.')
			if (p > 0) {
				const coll = field.substring(0, p)
				forms.forEach(f => {
					let fc = f.query.field
					if (f.query.concat) {
						if (f.query.coll) {
							fc = f.query.coll + '.' + f.query.concat
						} else {
							fc = f.query.concat
						}
					}
					if (f.query && (f.query.coll === coll || fc === coll)) {
						form.master = f
						return
					}
				})
			}
		
		} else if (objEmpty(form.query)) {
			form.master = listForm()
		}
	}
//console.log(`form: ${form.name}  master: ${form.master ? form.master.name : 'null'}`)
}




/* 
 *  Refresh forms
 */
export const refreshForms = () => {
	forms.filter(r => r.query.coll || r.query.script).forEach(f => {
		if (f.columns) {
			f.externRefresh()
		} else if (f.data && f.data._id) {
			formRetrieve(f, f.data._id)
		} else {
			formUpdate(f, {})
		}
	})
}




/* 
 * Replace main arguments
 */
export const mainArgs = str => {
	if (str) {
		let qs = str.replace('$user', br.user)
		const uid = isNaN(br.userid) ? '"'+br.userid+'"' : br.userid
		qs = qs.replace('$userid', uid)
		if (br.menuid) {
			qs = qs.replace('$menuid', br.menuid)
		}
		qs = qs.replace('$menuarg', br.menuarg || '_id')
		return qs
	}
}


