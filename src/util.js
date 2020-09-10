/*
 * Brumba
 * Copyright (c) 2012-2020 Dan Parnete
 *
 * This source code is licensed under the MIT license.
*/
import { err, objPick, strSplit, timezone, dateFormat } from './common'
import { formInput } from './form'


/** 
 * Brumba globals
 * @example
 * br = {
 *   app: 'applicationName',
 *   db: 'databaseName',
 *   usercode: '5f33f94ce1e692204f4d1697',
 *   ws: DOM element,							// workspace container link (root element)
 *   dlg: DOM element							// dialogs container link
 * }
 */
export let br = {}


/** 
 * Alias of document.querySelector
 * @example
 * import { $ } from '/lib/util.js'
 * 
 * const frm = $('form')
 */
export const $ = document.querySelector.bind(document)       // alias


/** 
 * Alias of document.querySelectorAll
 * @example
 * import { $$ } from '/lib/util.js'
 * 
 * const forms = $$('form')
 */
export const $$ = document.querySelectorAll.bind(document)   // alias


/** 
 * DOM element.querySelector syntax sugar
 * @function
 * @param {element} elem element to search on
 * @param {string} sel selector
 * @returns {element}
 */
export const e$ = (elem, sel) => (elem ? elem.querySelector(sel) : null)


/** 
 * DOM element.querySelectorAll syntax sugar
 * @function
 * @param {element} elem element to search on
 * @param {string} sel selector
 * @returns {NodeList}
 */
export const e$$ = (elem, sel) => (elem ? elem.querySelectorAll(sel) : [])


/** 
 * Name selector syntax sugar
 * @function
 * @param {string} names - Coma separated names list
 * @returns {NodeList}
 * @example
 * n$$('foo,bar') is an abbreviation of document.querySelectorAll('[name=foo],[name=bar]')
 */
export const n$$ = names => {
	let selector = ''
	strSplit(names, ',').forEach(name => selector += `[name=${name}],`)
	if (selector.length > 0) {
		selector = selector.substring(0, selector.length-1)
		return document.querySelectorAll(selector)
	}
	return null
}



export const decimalSeparator = (1.1).toLocaleString().substring(1, 2)




/** 
 * Remote. Fetch anvelope.
 * @function
 * @param {object} par query parameters
 * @param {json} data data to send on server; only for POST
 * @param {string} type data type, default 'application/json'
 * @returns {Promise<json>} promise
 * @example
 * Query parameters: par = {
 *   cmd: default 'GET' if coll, 'SRV' if script, 'REP' if report, 'POST' for data save, 'DEL' for delete
 *   app: 'applicationName', default br.app (from login)
 *   db: 'databaseName', default br.db (from login)
 *   coll: 'collectionName'
 *   script: 'scriptName.function', exludes coll
 *   fields: 'fld1,fld2,...', returns only this fields; only with coll
 *   concat: 'fieldName', returns only this embedded array field, merging all selected documents; only with coll; excludes fields
 *   add: 'fld1,fld2,...', adds fields to concat result; only with concat
 *   where: {_id: '...'}, query selector, optional
 *   sort: {fld1: 1, fld2: -1}, sort documents, 1 ascendin, -1 descending, optional
 *   args: {...}, more arguments if neaded, optional
 *   result: 'count', returns only the documents count, optional
 *   findOne: true, returns only one document, optional
 *   usercode: default br.usercode (from login)
 * }
 * @example
 * import { remote } from '/lib/util.js'
 * 
 * remote({coll: 'Patients', fields: 'firs_name,last_name', where:{active: true}, sort:{last_name: 1})
 * .then(res => {
 *   console.log(res)
 * })
 * .catch(console.log)
 * 
 * async function scr() {
 *   const data = await remote({script: 'demoSrv.formData'}).catch(console.log)
 *   console.log(data)
 * }
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
 * Loading indicator toggle
 */
export const loading = flag => {
	if (flag) {
		$('body').append(createElement(
			`<a class="button is-loading is-primary is-outlined is-large">loading...</a>`
		))
	} else {
		$$('.is-loading').forEach(el => el.remove())
	}
}




/*
 * Modified
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
 * Unselect
 */
export const unselect = () => $$('.br-selected').forEach(elem => elem.classList.remove('br-selected'))



/** 
 * Child index in the children list
 * @function
 * @param {element} elem - child element
 * @returns {number} index
 */
export const childIndex = elem => {
	let i = 0
	let child = elem
	while (child = child.previousElementSibling) ++i
  return i
}




/** 
 * Create DOM element from string HTML syntax
 * @function
 * @param {string} str - html syntax
 * @returns {element} element
 */
export const createElement = str => {
  const div = document.createElement('div')
  div.innerHTML = str.trim()
  return div.firstChild
}




/*
 * Create style
 */
export const createStyle = (css, isPage) => {
  const cls = isPage ? ' br-page-css' : ''
  $('head').append(createElement(`<style class="br-css${cls}">${css}</style>`))
}



/*
 * Load CSS
 */
export const loadCSS = (href) => {
	//if (!$(`link[href="${href}"]`)) {
		$('head').append(createElement(`<link rel="stylesheet" href="${href}" type="text/css" />`))
	//}
}





/** 
 * Validate inputs.
 * @function
 * @param {string} fields - comma separated fields list
 * @returns {boolean|element} true/element
 * 
 * If fields parameter undefined, all fields of the form are validated.
 * <br>All specified fields are considered required, some has type check.
 * <br>Returns the non valid element, or true if all valid.
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




/** 
 * Report call.
 * <br>All form inputs are passed as arguments.
 * @method
 * @param {string} formName
 * @param {string} reportName
 * @param {object} args - more arguments
 */
export const report = (formName, reportName, args) => {
	if (formName) { 
    const par = {
      cmd: 'REP',
      app: br.app,
      db: br.db,
      args: {report: reportName, timezone: timezone()},
      usercode: br.usercode
    }
    Object.assign(par.args, formInput(formName))
    if (args) {
			Object.assign(par.args, args)
		}
    window.open('/brumba?' + JSON.stringify(par))
  }
}




/** 
 * Input date.
 * <br>Converst input to 'yyyy-mm-dd' string. Separators accepted: . / -
 * @function
 * @param {string} str - imput string
 * @returns {string} string
 * @example
 * '1.1.17' will be converted to '2017-01-01'
 * '1.1' will be converted to 'currentYear-01-01'
 * '1' will be converted to 'currentYear-currentMonth-01'
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
 * Create script
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




/** 
 * Client script.
 * <br>Dynamic import of a server saved module.
 * @method
 * @param {string} scriptName
 * @param {callback} cb
 * @example
 * Dynamic import of a server saved module.
 * It's methods canot be imported as usual, but called by module.method()
 * 
 * import { clientScript } from '/lib/util.js'
 * 
 * clientScript('scriptName', mod => {
 *   mod.methodName()
 *   ...
 * })
 */
export const clientScript = async (scriptName, cb) => {
	await remote({script: scriptName+'._just_load'}).catch()
	const module = await import(`/scripts/${br.app}/${scriptName}.js`).catch(alert)
	if (cb) cb(module)
}




/** 
 * Translate string to lang
 * @function
 * @param {string} str
 * @param {json} lang
 * @returns {string} string
 */
export const translate = str => {
	if (br.locales) {
		const t = br.locales.find(r => r.default === str)
		if (t) {
			return t[br.lang] || str
		}
	}
	return str
}


/*
 * Translate all
 */
export const translateAll = htmlStr => {
	const htm = createElement(htmlStr)
	// label, button
	e$$(htm, 'label, button').forEach(el => {
		if (!el.classList.contains('radio')) {
			el.textContent = translate(el.textContent)
		}
	})
	// input
	e$$(htm, 'input').forEach(el => {
		['placeholder','help'].forEach(attr => {
			if (el.hasAttribute(attr)) {
				el.setAttribute(attr, translate(el.getAttribute(attr)))
			}
		})
		if (el.type === 'button') {
			el.value = translate(el.value)
		}
	})
	// grid
	const attr = 'data-grid'
	const transGrid = el => {
		const grid = JSON.parse(el.getAttribute(attr))
		grid.columns.forEach(c => c.header = translate(c.header))
		el.setAttribute(attr, JSON.stringify(grid))
	}
	if (htm.hasAttribute(attr)) {
		transGrid(htm)
	}
	e$$(htm, attr).forEach(el => transGrid(el))
	// tab
	e$$(htm, '.tab span').forEach(el => el.textContent = translate(el.textContent))
	return htm.outerHTML
}

