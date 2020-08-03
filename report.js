/*
 * Brumba
 * Copyright (c) 2012-2020 Dan Parnete
 *
 * This source code is licensed under the MIT license.
*/

import https from 'https'
import fs from 'fs'

import jsdom from 'jsdom'
import PDFDocument from 'pdfkit'

import { err, dateFormat, strSplit, timezone, objEmpty, objClone, toJSON, formulaValues } from './lib/common.js'
import { get, file, ObjectID } from './mongo.js'
import { script } from './srv.js'


const { JSDOM } = jsdom




/*********************************************
 * 				Report object
 *********************************************/
class Report {
	
	constructor(par, pdf) {
		this.par = par							// parameters
		this.dom = null							// report html DOM
		this.bands = []
		this.grps = 0
		this.pdf = pdf
		this.nested = (pdf) ? true : false
		this.left = (this.nested) ? par.args.left : 0
		this.top = (this.nested) ? par.args.top : 0
		this.font = {size: 11, fam: 'Helvetica'}
		this.selects = []
		this.bottom = 0
		this.pgnum = 0
		this.data = null
		this.rec = null
		this.srvtz = timezone()
		this.extraHeight = 0

		if (!(this.par.app && this.par.db && this.par.args && this.par.args.report)) {
			return this.returnError({err: U.err.param})
		}

		if (this.par.args.timezone) {
			this.srvtz = this.par.args.timezone - this.srvtz
		}
		
		this.init()
	}
	
			
	/*
	 * 		init
	 */
	init() {
		// exists
		const exists = (name, q ) => {
			for (let i=this.selects.length-1; i >= 0; --i ) {
				const s = this.selects[i]
				if (s.coll === q.coll && (!q.where || !s.where || JSON.stringify(s.where) === JSON.stringify(q.where))) {
					this.selects[i].field.push(name)
					return true
				}
			}
			return false
		}
	
		// add
		const add = (name, q, data) => {
			const sl = {field: [name], coll: q.coll, data: data}
			if (q.where) {
				sl.where = q.where
			}
			this.selects.push(sl)
		}
		
		// get report
		get({db: this.par.app, coll: 'reports', where: {name: this.par.args.report}})
		.then(async res => {
			const html = res[0].html.replace(/ id=+/g, ' name=')
			this.dom = JSDOM.fragment(html)
			const form = this.dom.firstChild
			
			// bands
			form.querySelectorAll('.br-band').forEach(b => {
				const name = b.getAttribute('name')
				if (name === 'group') name += this.grps++
				const st = getStyle(b.getAttribute('style'))
				const band = {name: name, html: b, height: st.height}
				if (name === 'footer') band.rec = {}
				this.bands.push(band)
			})
			
			// new page
			if (!this.nested) {
				const opt = {size: 'A4', margin: 0}
				if (form.getAttribute('data-landscape') == 'true') {
					opt.layout = 'landscape'
				}
				this.pdf = new PDFDocument(opt)
				this.bottom = this.pdf.page.height - this.bands[this.bands.length-1].height
			}
			
			// font
			const fo = getFont(form.getAttribute('style'))
			if (fo) {
				this.font = fo
			}
			this.pdf.fontSize(this.font.size)
			this.pdf.font(this.font.fam)

			// selects
			const sels = form.querySelectorAll('select')
			for (let i=0; i < sels.length; ++i) {
				const sel = sels[i]
//console.log(sel.outerHTML)
				const qs = sel.getAttribute('data-query')
				const name = sel.nodeName					
				if (qs) {
					const q = toJSON(qs)
					if (!exists(name, q)) {
						if (Array.isArray(q)) {
							add(name, q, q)
						} else {
							// resu
							const resu = res => {
								if (!res.err) {
									add(name, q, res)
								}
							}
							
							q.db = this.par.db
							if (q.fields) {
								const sp = strSplit(q.fields, ',')
								q.fields = {}
								for (let j=0; j < sp.length; ++j) {
									q.fields[sp[j]] = 1
								}
							}
							if (q.coll) {
								q.cmd = 'GET'
								await get(q).then(resu).catch(this.returnError)
							} else if (q.script) {
								q.cmd = 'SRV'
								q.app = this.par.app
								await script(q).then(resu).catch(this.returnError)
							}
						}
					}
				}			
			}

			this.build()
		})
		.catch(this.returnError)
	}
	
	
	/*
	 * 		build
	 */
	build() {
//console.log(`build ${this.par.args.report}`)
		const _this = this
		const h = this.findBand('header')
		this.query('header', err => {
			if (!err) {
				if (!h.count) {
					h.count = 1
				}
				header(0)
			} 
		})
		
		// header
		function header(i) {
//console.log('header '+i)
			if (i < h.count) {
				if (_this.data) {
					_this.rec = _this.data[i]
				}
				if (!_this.nested) {
					_this.newPage(i)
				}
				_this.print('header', err => {
					if (err) {
						console.log('print header err')
					} else if (_this.findBand('group0')) {
						group(0, () => {
							header(i+1)
						})
					} else {
						detail(err => {
							if (err) {
								_this.returnError(err)
							} else {
								header(i+1)
							}
						})
					}
				}, i)
			} else {
				if (_this.nested) {
					//callback(_this.top)
				} else {
					_this.print('footer', err => {
						if (err) {
							console.log('print footer err')
						}
						_this.par.httpRes.writeHead(200, {'Content-Type': 'application/pdf',
													'Content-Disposition': `inline; filename="${new ObjectID()}.pdf"`})
						_this.pdf.pipe(_this.par.httpRes)
						_this.pdf.end()
//console.timeEnd('report')
					})
				}
			}
		}
	
		// group
		function group(i, error) {
			_this.query('group'+i, err => {
				if (!err) {
					const band = _this.findBand('group'+i)
					prn(0)

					// prn
					function prn(n) {
						if (n < band.count) {
							_this.print('group'+i, err => {
								if (err) {
									console.log(err)	
								} else {
									if (i+1 < _this.grps) {
										group(i+1, () => {
											prn(n+1)
										})
									} else {
										detail(err => {
											if (err) {
												_this.returnError(err)
											} else {
												prn(n+1)
											}
										})
									}
								}
							}, n)
						}
					}
				}
			})
		}
	
		// detail
		function detail(callback) {
//console.log('detail')
			_this.query('detail', err => {
				if (err) {
					console.log('query detail err')	
					callback(err)
				} else {
					const band = _this.findBand('detail')
					prn(0)
					
					// prn
					function prn(i) {
						if (i < band.count) {
							_this.print('detail', err => {
								if (err) {  
									console.log('print detail err')
									callback(err)
								} else {
									prn(i+1)
								}
							}, i)
						} else {
							_this.print('total', err => {
								if (err) {  
									console.log('print total err')
									callback(err)
								} else {
									callback()
								}
							})
						}
					}
				}
			})
		}
	}
	
	
	/*
	 * 		query
	 */
	query(bandname, callback) {
//console.log(`query ${bandname}`)
		const band = this.findBand(bandname)
		const qs = band ? band.html.getAttribute('data-query') : null
		if (qs) {
			const q = toJSON(qs)
			if (q.coll) {
				if (q.where && qs.indexOf('#') >= 0) {
					this.hashArgs(q.where)
					if (objEmpty(q.where)) {
						delete q.where
					}
				}
				q.db = this.par.db
				q.result = 'cursor'
//console.log(q)
				get(q)
				.then(res => {
					band.cursor = res
					band.cursor.count((err, count) => {
						if (err) return callback(err)
//console.log(count)
						band.count = count
						callback()
					})
				})
				.catch(this.returnError)
			
			} else if (q.field) {
				const rec = this.bands[this.findBand(bandname, true)-1].rec
				if (rec) {
					band.data = rec[q.field]
				} else if (this.par.args.parentData) {
					band.data = this.par.args.parentData[q.field]
				}
				if (band.data) {
					band.count = band.data.length
				} else {
					band.count = 0
				}
				callback()
			
			} else if (q.script && bandname === 'header') {
//console.log('script')
				q.app = this.par.app
				q.db = this.par.db
				q.args = objClone(this.par.args)
				q.band = bandname
//console.log(q)
				script(q)
				.then(res => {
					this.data = res
					band.count = this.data.length
					callback()
				})
				.catch(this.returnError)
			
			} else {
				callback()
			}
		
		} else if (this.rec && bandname === 'detail') {
			band.count = this.rec['detail'].length
			callback()
		} else if (this.rec && bandname === 'group0') {
			band.count = this.rec['group0'].length
			callback()
		} else {
			callback()
		}
	}
	
	
	/*
	 * 		print
	 */
	print(bandname, callback, idx) {
//console.log(`print ${bandname}`)
		const _this = this
		const band = this.findBand(bandname)
		if (this.top + band.height > this.bottom && bandname != 'footer') {
			this.print('footer', err => {
				if (err) console.log('print footer err')
				this.newPage(1)
				this.print('header', err => {
					if (err) console.log('print header err')
					bandrec()
				})
			})
		} else {
			bandrec()
		}

		// bandrec
		function bandrec() {
			if (band.cursor) {
				band.cursor.next((err, doc) => {
					if (err) {
						console.log(err)	
						_this.returnError({err: err.data})
						callback(true)
					} else {
						band.rec = doc
						prn()
					}
				})
			} else {
				if (band.data) {
					band.rec = band.data[idx]
				} else if (_this.rec) {
					if (bandname === 'header') {
						band.rec = _this.rec
					} else {
						const bdata = _this.rec[bandname]
						if (bdata) {
							if (Array.isArray(bdata) && idx >= 0) {
								band.rec = bdata[idx]
							} else {
								Object.extend(band.rec, bdata)
							}
						}
					}
				}
				prn()
			}
		}

		// prn
		async function prn() {
			if (bandname === 'header' && band.rec && idx >= 0) {
				Object.extend(band.rec, _this.par.args)
			}
			_this.computedFields(band)
			let imgs = 0
//console.log(`prn ${band.name} children=${band.html.children.length}`)
			for (var i=0; i < band.html.children.length; ++i) {
				const el = band.html.children[i]
				if (el.classList.contains('br-hidden') || el.hasAttribute('disabled')) return
				const style = getStyle(el.getAttribute('style'))
				if (style.font) {
					_this.pdf.fontSize(style.font.size)
					_this.pdf.font(style.font.fam)
				}
				const op =  {}
				if (style['text-align']) {
					op = {align: style['text-align'], width: style.width}
				}

				let left = style.left + _this.left + 1
				let top = style.top + 2
				top += (bandname === 'footer') ? _this.bottom : _this.top 
				// label
				if (el.classList.contains('br-label')) {
//console.log(style.font)
					_this.pdf.text(el.textContent, left, top, op)
				// field
				} else if (el.classList.contains('br-field') && band.rec) {
					const name = el.getAttribute('name')
					let val
					if (name === '_page') {
						val = _this.pgnum
					} else if (name === '_date') {
						val = strDate(new Date().getTime()+_this.srvtz, 'hm')
					} else {
						val = band.rec[name]
					}
					if (val || typeof val === 'number') {
						if (el.nodeName === 'select') {
							val = selectVal(el, val)
						} else if (val.lab) {
							val = val.lab
						} else {
							switch (el.nodeType) {
								case 'date':
									val = strDate(new Date(val).getTime()+_this.srvtz)
									break
								case 'datetime-local':
									val = strDate(val+_this.srvtz, 'hm')
									break
								case 'time':
									val = strTime(val)
									break
								case 'number':
									const dec = el.getAttribute('data-decimals')
									if (dec && typeof val === 'number') {
										val = val.toFixed(dec)
									}
									break
								default:
							}
						}

						if (el.nodeName === 'TEXTAREA') {
							const h = _this.pdf.heightOfString(val, {width: style.width, height: style.height})
							if (h > style.height) {
								_this.extraHeight = h - style.height
							}
							_this.pdf.text(val, left, top, {width: style.width, height: style.height+_this.extraHeight})
						} else if (el.type === 'checkbox') {
							_this.pdf.image('www/images/checked.png', left, top, {width: 9})
						} else {
							_this.pdf.text(val, left, top, op)
						}
					}
					// image
				} else if (el.tagName === 'img') {
					imgs++
					const id = el.attr('data-id')
					const file = await file({db: _this.par.app, _id: id, mode: 'rf'}).catch(returnError)
					if (file) {
						const path = 'tmp/' + id
						fs.writeFileSync(path, file)
						_this.pdf.image(path, style.left + _this.left, style.top + _this.top, 
													{width: style.width, height: style.height})
					}
					if (--imgs === 0) {
						prnend()
					}
				}
				// reset to default font
				if (style.font) {
					_this.pdf.fontSize(_this.font.size)
					_this.pdf.font(_this.font.fam)
				}
				// border
				if (style.border) {
					let w = style.width + style.border || 100
					let h = style.height + style.border || 13
					if (h===1) h = 0
					_this.pdf.lineWidth(style.border)
					_this.pdf.rect(style.left + _this.left, style.top + _this.top, w, h).stroke()
				}
			}
			if (imgs === 0) {
				prnend()
			}
			
			// prnend
			function prnend() {
				var nest = band.html.querySelectorAll('.br-nested')
				if ( nest.length > 0 ) {
//console.log('nest')
					var par = U.cloneJSON(_this.par)
						, css = cssObj(nest)
					par.args.report = nest.getAttribute('data-nested')
					par.args.parentData = band.rec
					par.args.left = style.left
					par.args.top = _this.top + style.top
					new Report(par, function(r) {
						if ( r.err )  return error(r)
						r.build( function(top) {
							_this.top = top
							callback()
						})
					}, _this.pdf)
				} else {
					_this.top += band.height + _this.extraHeight
					_this.extraHeight = 0
					if ( bandname == 'detail') total(band.rec)
					callback()
				}
			}
		
			// total
			function total(detrec) {
				const tot = _this.findBand('total')
				if (!tot || !tot.html.children.length === 0) return
				if (!tot.rec) {
					tot.rec = {}
				}
				const rec = tot.rec
				for (var i=0; i < tot.html.children.length; ++i) {
					const el = tot.html.children[i]
					if (['number','time'].includes(el.type)) {
						const name = el.getAttribute('name')
						if (detrec && !isNaN(detrec[name])) {
							if (!rec[name]) {
								rec[name] = 0
							}
							rec[name] += detrec[name]
						}
					}
				}
			}

		}
	
		// selectVal
		function selectVal(el, val) {
			const name = el.getAttribute('name')
			const flds = strSplit(el.getAttribute('data-fields'), ',')
			for (let i=_this.selects.length-1; i >= 0; --i) {
				const sel = _this.selects[i]
				if (sel.field.indexOf(name) >= 0) {
					for (let k=sel.data.length-1; k >= 0; --k) {
						const rec = sel.data[k]
						if (rec[flds[0]]+'' === val+'') {
							val = ''
							for (let j=1; j < flds.length; ++j) {
								let f = flds[j]
								if (j > 1) {
									if (f.charAt(0) === '+') {
										val += ' '
										f = flds[j].substr(1)
									} else {
										val += ' - '
									}
								}
								val += rec[f]
							}
							break
						}
					}
					break
				}
			}
			return val
		}
	}
	
	
	/*
	 * 		utilities
	 */
	computedFields(band) {
		band.html.querySelectorAll('input[data-formula]').forEach(el => {
			const expr = formulaValues(band.rec, el.getAttribute('data-formula'))
			if (expr) {
console.log(expr)
				try {
					const v = eval(expr)
					if (v) {
						band.rec[el.getAttribute('name')] = v
					}
				} catch(e) {
					console.log(e)
				}
			}
		})
	}
	
	newPage(i) {
		if (i > 0) {
			this.pdf.addPage()
		}
		this.pgnum++
		this.top = 0
	}
	
	
	findBand(name, idx) {
		for (let i=0; i < this.bands.length; ++i) {
			if (this.bands[i].name === name) {
				if (idx) {
					return i
				} else {
					return this.bands[i]
				}
			}
		}
	}
	
	returnError(res) {
		console.log(res)
		this.par.httpRes.write('report error:\n')
		this.par.httpRes.end(JSON.stringify(res))
	}

	hashArgs(where) {
		for (let p in where) {
			let v = where[p]
			if (typeof v === 'object') {
				this.hashArgs(v)
			} else {
				if (isNaN(v) && v.charAt(0) === '#') {
					const f = v.substr(1)
					v = this.par.args[f]
					if (v) {
						where[p] = v
					} else {
						delete where[p]
					}
				}
			}
		}
	}

}
/*************** END Report object *************/



/* 
 * Default report call
 */
export const report = par => {
	const r = new Report(par)
	if (r.err) {
		if (par.httpRes) {
			par.httpRes.write('report error:\n')
			par.httpRes.end(JSON.stringify(r))
		} else {
			console.log(r)
		}
	} else {
		//r.build()
	}
}




/* 
 * Default report call
 */
const getStyle = str => {
	const style = {}
	if (str) {
		strSplit(str, ';').forEach(s => {
			if (s.length) {
				let [prop, val] = strSplit(s, ':')
				if (val.endsWith('px')) {
					val = val.substring(0, val.length-2)
				}
				switch (prop) {
					case 'width':
					case 'height':
					case 'left':
					case 'top':
						//style[prop] = Math.round(parseFloat(val))
						style[prop] = parseFloat(val)
						break
					case 'font':
						style[prop] = getFont(val)
						break
					case 'border':
						const p = val.indexOf('px')
						style[prop] = parseInt(p ? val.substring(0, p) : val, 10)
						break
					default:
						style[prop] = val
				}
			}
		})
	}
	return style
}



/* 
 * Get font
 */
const	getFont = font => {
	if (!font) return null
	
	let sz, fam
	const sp = strSplit(font, ' ')
	if (sp[0].endsWith('px')) {
		sz = sp[0]
		fam = family(sp[1])
	} else {
		sz = sp[1]
		fam = family(sp[2], sp[0])
	}
	return {size: parseInt(sz.substring(0, sz.length-2), 10), fam: fam}

	// family
	function family(f, w) {
		if ( ['arial', 'verdana', 'helvetica'].indexOf(f) >= 0 ) {
			if (w === 'bold') {
				return 'Helvetica-Bold'
			} else if ( ['italic', 'oblique'].indexOf(w) >= 0 ) {
				return 'Helvetica-Oblique'
			} else {
				return 'Helvetica'
			}
		}
	}
}
	




const pad = n => n<10 ? '0'+n : n

/* 
 * Date to string			time: hm (just hour and minute), else full time
 */
const strDate = (timestamp, time) => {
	let s
	if (timestamp) {
		const date = new Date(timestamp)
		const d = date.getDate()
		const m = date.getMonth() + 1
		if (dateFormat.charAt(0) == 'd' ) {
			s = pad(d) + '/'+ pad(m) + '/'
		} else {
			s = pad(m) + '/'+ pad(d) + '/'
		}
		s += date.getFullYear()
		if (time) {
			s += ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes())
			if (time != 'hm') {
				s  += ':' + pad(date.getSeconds())
			}
		}
	}
	return s
}



/* 
 * Time from milliseconds to string
 */
function strTime(timestamp, sec) {
	let ret = ''
	if (timestamp >= 0) {
		if (timestamp < 2678400000 ) {	// 1 feb 1970
			let s = timestamp / 1000
			const h = Math.floor(s/3600)
			s -= h * 3600
			const m = Math.floor(s/60)
			ret = pad(h) + ':' + pad(m)
			if (sec) {
				s -= m * 60
				ret += ':' + pad(s)
			}
		} else {
			const dt = new Date(time)
			ret = pad(dt.getHours()) + ':' + pad(dt.getMinutes())
			if (sec) {
				ret += ':' + pad(dt.getSeconds())
			}
		}
	}
	return ret
}
