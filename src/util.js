/*
 * Brumba
 * Copyright (c) 2012-2020 Dan Parnete
 *
 * This source code is licensed under the MIT license.
*/

import { err, objPick, strSplit, timezone, dateFormat } from './common'
import { formChanges } from './forms'


export let br = {}
export const $ = document.querySelector.bind(document)       // alias
export const $$ = document.querySelectorAll.bind(document)   // alias
export const e$ = (elem, sel) => (elem ? elem.querySelector(sel) : null)
export const e$$ = (elem, sel) => (elem ? elem.querySelectorAll(sel) : [])
export const decimalSeparator = (1.1).toLocaleString().substring(1, 2)



/* 
 *  Coma separated names list selector
 */
export const n$$ = nameList => {
	let selector = ''
	strSplit(nameList, ',').forEach(name => selector += `[name=${name}],`)
	if (selector.length > 0) {
		selector = selector.substring(0, selector.length-1)
		return document.querySelectorAll(selector)
	}
	return null
}



/* 
 *  Remote
 */
export const remote = (par, dat, type) => {
  // getMsg
  const getMsg = error => {
		let msg
		switch(error) {
			case err.db: msg = 'database not found: '+par.db; break
			case err.coll: msg = 'collection not found: '+par.coll; break
			case err.unique: msg = 'value not unique'; break
			case err.count: msg = 'count error'; break
			case err.cursor: msg = 'cursor error'; break
			case err.ins: msg = 'ins error'; break
			case err.upd: msg = 'update error'; break
			case err.del: msg = 'delete error'; break
			//case err.file: msg = 'file error'; break
			case err.dupl: msg = 'duplicate record'; break
			case err.param: msg = 'wrong parameters'; break
			case err.data: msg = 'wrong data'; break
			case err.gen: msg = 'generic error'; break
			case err.srv: msg = 'server error'; break
			case err.script: msg = 'script not found: '+par.script; break
			case err.user: msg = 'user not authenticated'; break
			case err.trig: msg = 'trigger error'; break
			case err.sock: msg = 'socket error'; break
			default:
		}
		return msg
	}
	
	//loading(true)
	const timer = setTimeout(() => {	
		loading(true)
	}, 500)
	
  if (!par.cmd) {
    if (par.script) {
      par.cmd = 'SRV'
    } else {
      par.cmd = 'GET'
    }
  }
  Object.assign(par, objPick(br, 'app,usercode'))
  if (!par.db) {
    par.db = br.db || br.app
  }
	if (!par.db) return alert('Database not specified')

  return fetch(br.url+'/brumba?'+JSON.stringify(par), {
    method: dat ? 'post' : 'get',
    headers: {'Content-Type': (type || 'application/json')},
    body: type ? dat : JSON.stringify(dat)
  })
  .then(res => res.json())
  .then(data => {
    clearTimeout(timer)
    loading(false)
    if (data.err && data.err !== err.file) {
			if (!data.msg) {
				const msg = getMsg(data.err)
				if (msg) data.msg = msg
			}
      alert(JSON.stringify(data))
    }
    return data
  })
  .catch(e => {
    clearTimeout(timer)
    alert(e)
    return {err: err.srv, msg: 'remote error'}
  })
}




/* 
 *  Loading indicator
 */
export const loading = (flag) => {
	if (flag) {
		$('body').append(createElement(
			`<a class="button is-loading is-primary is-outlined is-large">loading...</a>`
		))
	} else {
		$$('.is-loading').forEach(el => el.remove())
	}
}




/* 
 *  Modified
 */
export const modified = (flag) => {
  const save = $('#br-save')
  if (flag) {
    save.classList.add('modified')
  } else {
    save.classList.remove('modified')
  }  
}



/* 
 *  Unselect
 */
export const unselect = () => $$('.br-selected').forEach(elem => elem.classList.remove('br-selected'))



/* 
 *  Tools text
 */
export const toolsText = () => {
  const text = $('#br-tools-text').value
  if (!text.length) {
    alert('Write some comma separeted field names in the Tools text area')
    return ''
  }
  if (localStorage) {
    localStorage.setItem('br.tools-text', text)
  }
  return text
}



/* 
 *  Child index
 */
export const childIndex = elem => {
	let i = 0
	let child = elem
	while (child = child.previousElementSibling) ++i
  return i
}




/* 
 *  Create element
 */
export const createElement = (str) => {
  const div = document.createElement('div')
  div.innerHTML = str.trim()
  return div.firstChild
}




/* 
 *  Create style
 */
export const createStyle = (css, isPage) => {
  const cls = isPage ? ' br-page-css' : ''
  $('head').append(createElement(`<style class="br-css${cls}">${css}</style>`))
}



/* 
 *  Load CSS
 */
export const loadCSS = (href) => {
	//if (!$(`link[href="${href}"]`)) {
		$('head').append(createElement(`<link rel="stylesheet" href="${href}" type="text/css" />`))
	//}
}





/* 
 *  Validate fields
 */
export const validate = fields => {
	// valid
	const valid = input => {
		switch (input.type) {
			case 'email':
				if (! /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(input.value)) return false
				break
			case 'password':
				if (! /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/.test(input.value)) return false
				break			
			default:
				if (input.value === '') return false
		}
		return true
	}
	
	if (fields) {
		const flds = strSplit(fields, ',')
		for (let i=0; i < flds.length; ++i) {
			const input = $(`[name=${flds[i]}]`)
			if (!valid(input)) return input
		}
	} else {
		const inputs = $$('input,select,textarea')
		for (let i=0; i < inputs.length; ++i) {
			const input = inputs[i]
			if (!input.disabled && !valid(input)) return input
		}
	}
	return true
}





/* 
 * Substitutes retrieve arguments
 */
export const substArgs = (where, elem) => {
	if (where) {
		const dat = page.forms[0].dataset[0]
		let ok = true
		for (k in where) {
			if (typeof where[k] === 'string' && where[k].charAt(0) === '#') {
				let v = null
				if (elem) {
					v = fieldVal(elem.parent().find(where[k]))
				}
				if (!v && dat) {
					v = dat[where[k].substr(1)]
				}
				if (v) {
					where[k] = v
				} else {
					delete where[k]
					ok = false
				}
			}
		}
		return ok
	}
	return false
}




/* 
 * Report call
 */
export const report = (formName, report, args) => {
	if (formName) { 
    const par = {
      cmd: 'REP',
      app: br.app,
      db: br.db,
      args: {report: report, timezone: timezone()},
      usercode: br.usercode
    }
    Object.assign(par.args, formChanges(formName))
    if (args) {
			Object.assign(par.args, args)
		}
    window.open('/brumba?' + JSON.stringify(par))
  }
}




/* 
 * Input date
 */
export const inputDate = str => {
	const pad = n => n<10 ? '0'+n : n
	const dayFirst = dateFormat.startsWith('d')
	const sep = str.includes('.')	? '.'	: str.includes('-')	? '-'	: '/'
	const now = new Date()
	let [d, m, y] = strSplit(str, sep)
	m = m ? parseInt(m, 10) : now.getMonth() + 1
	y = y ? parseInt(y, 10) : now.getFullYear()
	if (y < 100) {
		y += (y > 50 ? 1900 : 2000)
	}
	return `${y}-${pad(dayFirst?m:d)}-${pad(dayFirst?d:m)}`
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
 *  Client script
 */
export const clientScript = async (scriptName, cb) => {
	await remote({script: scriptName+'._just_load'}).catch()
	const module = await import(`/scripts/${br.app}/${scriptName}.js`).catch(alert)
	if (cb) cb(module)
	
}
