/*
 * Brumba
 *
 * © 2012-2014 Dan Parnete
 * Dual licensed under the MIT and GPL licenses.
 *
 */

var https = require('https')
	, fs = require('fs')

	, cheerio =  require('cheerio')
	, PDFDocument = require('pdfkit')

	, M = require('./mongo')
	, U = require('./client/js/util')




/* Remote request
*/
function remote( par, callback, dat ) {
	var opt = {
			host: par.host,
			port: par.port || 8080,
			path: '/brumba?' + JSON.stringify(par),
			method: (dat) ? 'POST' : 'GET',
			rejectUnauthorized: false
		}
	
	https.request( opt, function(res) {
		var data = []
		res.on('data', function(chunk) {
			data[data.length] = chunk
		})
		.on('end', function() {
			if ( res.headers['content-type'] == 'application/json' )  callback(JSON.parse(data.concat()))
			else callback(data.concat())
		})
	})
	.on('error', function(err) {
		callback({err: U.err.data, mess: err})
	})
	.end(JSON.stringify(dat))
}



/* Flexigrid data format
*/ 
 function flexigridData( par, callback ) {
	par.result = 'count'
	M.get(par, function(res) {
		var tot = res.count
		delete par.result
		par.skip = (par.page-1) * par.limit
		M.get(par, function(res) {
			callback({"page":par.page, "total":tot, "rows":res})
		})
	})
}




/* Menu items as select options
*/
function menuItems( par, callback ) {
	var op = {
			db: par.app,
			coll: 'application',
			where: { section: 'menu' }
		}
	M.get(op, function(res) {
		if ( res.err || !res[0] )  callback(res)
		else {
			var m = [],
				sp = res[0].menu.split('\n'),
				lastabs = 0
			for ( var i=0; i <= sp.length; i++ ) {
				var ln = sp[i]
				if ( ln ) {
					var p = ln.lastIndexOf('"')
					if ( p > 0 ) {
						var item = { 
							menuitem: U.strRep(ln.substr(0,p), '"', ''),
							form: ln.substr(p+1).trim()
						}
						m.push(item)
					}
				}
			}
			callback(m)
		}
	})	
}



/* IDE save to other application
*/
function ideSaveTo( par, callback ) {
	M.get(par, function(res) {
		if ( res.err || !res[0] )  return callback(res)
		else {
			var frm = res[0]
				, u = par.url.split('/')
				, h = (u[1]) ? u[0].split(':') : null
				, opt = {
						host: (h) ? h[0] : null,
						cmd: 'GET',
						db: u[1] || u[0],
						coll: par.coll,
						where: { name: frm.name },
						fields: { _id: 1 },
						usercode: 'trusted'
					}
			if ( h && h[1] ) opt.port = parseInt(h[1], 10)
			delete frm._id
			
			// Remote
			if ( h ) {
				remote(opt, function(r) {
					if ( r.err ) return callback(r)
					opt.cmd = 'POST'
					if ( r[0] )  frm._id = r[0]._id
					remote(opt, function(r) {
						callback(r)
					}, res)
				})
			
			// Local
			} else {
				M.get(opt, function(r) {
					if ( r.err ) return callback(r)
					if ( r[0] )  frm._id = r[0]._id
					M.post(opt, res, function(r) {
						callback(r)
					})
				})
			}
			
		}
	})
}



/* Remote login
*/
function remoteLogin( par, callback ) {
	var opt = {
			app: app.val(),
			db: (ide) ? app.val() : db.val(),
			username: user.val(),
			password: pass.val()
		}
	$.ajax({
		url: '/login?' ,
		timeout: 10000,
		data: opt,
		success: function(data) {
			if ( data.usercode ) {
				sessionStorage.setItem('br.usercode', data.usercode)
				sessionStorage.setItem('br.userid', data.userid)
				sessionStorage.setItem('br.useradm', data.useradm)
				sessionStorage.setItem('br.menu', filterMenu(data.menu))
				window.location = (ide) ? '/ide.html' : '/default.html'
			} else {
				$("body").html("<H1>Login error</H1>")
			}
		}
	})
}








/*********************************************
 * 				Report object
 *********************************************/
function Report( par, callback, pdf ) {
	this.par = par						// parameters
	this.httpRes = null
	this.$ = null							// report html DOM
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
	this.srvtz = 0
	this.time = process.hrtime()

	this.init(callback)
}

Report.prototype = {
	
	init : function( callback ) {
		if ( !(this.par.app && this.par.db && this.par.args && this.par.args.report) ) {
			return callback({err: U.err.param})
		}

		this.srvtz = this.par.args.timezone - new Date().getTimezoneOffset() * -60000
		var self = this
		M.get({db: this.par.app, coll: 'reports', where: { name: this.par.args.report}}, function(res) {
			if ( res.err )  return callback(res)
			if ( res.length == 0 )  return callback({err: U.err.param})
			var band
			self.$ = cheerio.load(res[0].html)
			self.$('.br-band').each( function() {
				var $this = self.$(this)
					, name = $this.attr('name')
				if ( name == 'group' ) name += self.grps++
				band = {name: name, html: $this, height: parseInt($this.css('height'), 10)}
				if ( name == 'footer' ) band.rec = {}
				self.bands.push(band)
			})
			// new page
			if ( !self.nested ) {
				var opt = { size: 'A4', margin: 0 }
				if ( self.$('.br-report').attr('data-landscape') == 'true' )  opt.layout = 'landscape'
				self.pdf = new PDFDocument(opt)
				self.bottom = self.pdf.page.height - band.height
			}
			// font
			var s = self.$('.br-report').attr('style')
			if ( s ) {
				var f = self.getFont()
				if ( f ) self.font = f
			}
			self.pdf.fontSize(self.font.size)
			self.pdf.font(self.font.fam)
			
			// selects
			var select = self.$('select')
			if ( select.length > 0 ) {
				selData(0)
				
				function selData( n ) {
					if ( n < select.length ) {
						var sel = select.eq(n)
							, qs = sel.attr('data-query')
							, id = sel.attr('id')
							
						if ( qs ) {
							var q = U.toJSON(qs)
							if ( exists(id, q) ) selData(i+1)
							else {
								if ( Array.isArray(q) ) {
									add(id, q, q)
									selData(n+1)
								} else {
									q.db = self.par.db
									if ( q.fields ) {
										var sp = U.strSplit(q.fields, ',')
										q.fields = {}
										for ( var i=0; i < sp.length; i++ )  q.fields[sp[i]] = 1
									}
									M.get(q, function(res) {
										if ( res.err ) selData(n+1)
										else {
											add(id, q, res)
											selData(n+1)
										}
									})
								}
							}
						} else callback(self)
					} else callback(self)
				}
			
				function exists( id, q ) {
					for ( var i=self.selects.length-1; i >= 0; --i ) {
						var s = self.selects[i]
						if ( s.coll == q.coll && (!q.where || !s.where || JSON.stringify(s.where) == JSON.stringify(q.where)) ) {
							self.selects[i].field.push(id)
							return true
						}
					}
					return false
				}
			
				function add( id, q, data ) {
					var sel = {field: [id], coll: q.coll, data: data}
					if ( q.where ) sel.where = q.where
					self.selects.push(sel)
				}
			
			} else callback(self) 
		})
	},
	
	
	build : function( httpRes ) {
		this.httpRes = httpRes
		var self = this
			, h = this.findBand('header')
		
		this.query('header', function(err) {
			if ( !err ) {
				if ( !h.count )  h.count = 1
				header(0)
			} 
		})
		
		function header( i ) {
			if ( i < h.count ) {
				if ( self.data ) self.rec = self.data[i]
				if ( !self.nested ) self.newPage(i)
				self.print('header', function(err) {
					if ( err ) console.log( 'print header err' )
					else if ( self.findBand('group0') ) {
						group(0, function() {
							header(i+1)
						})
					} else {
						detail( function(err) {
							if ( err ) callback(err)
							else header(i+1)
						})
					}
				}, i)
			} else {
				if ( self.nested ) callback(self.top)
				else {
					self.print('footer', function(err) {
						if ( err ) console.log( 'print footer err' )
						httpRes.writeHead(200, {'Content-Type': 'application/pdf'})
						self.pdf.pipe(httpRes)
						self.pdf.end()
self.time = process.hrtime( self.time )
console.log( 'report done in %d.%ds', self.time[0], (self.time[1]/1000000).toFixed(0) )
					})
				}
			}
		}
	
		function group( i, callback ) {
			self.query('group'+i, function(err) {
				if ( !err ) {
					var band = self.findBand('group'+i)
					prn(0)
					
					function prn( idx ) {
						if ( idx < band.count ) {
							self.print('group'+i, function(err) {
								if ( err ) console.log( err )	
								else {
									if ( i+1 < self.grps ) {
										group(i+1, function() {
											prn(idx+1)
										})
									} else {
										detail( function(err) {
											if ( err ) callback(err)
											else prn(idx+1)
										})
									}
								}
							}, idx)
						} else callback()
					}
				}
			})
		}
	
		function detail( callback ) {
			self.query('detail', function(err) {
				if ( err ) {
					console.log( 'query detail err' )	
					callback(err)
				} else {
					var band = self.findBand('detail')
					prn(0)
					
					function prn( i ) {
						if ( i < band.count ) {
							self.print('detail', function(err) {
								if ( err ) {  
									console.log( 'print detail err' )
									callback(err)
								} else prn(i+1)
							}, i)
						} else {
							self.print('total', function(err) {
								if ( err ) {  
									console.log( 'print total err' )
									callback(err)
								} else callback()
							})
						}
					}
				}
			})
		}
	
	},
	
	
	query : function( bandname, callback ) {
//console.log( 'query %s %s', bandname, this.par.args.report  )
		var band = this.findBand(bandname)
			, qs =  band.html.attr('data-query')
			, self = this
		if ( qs ) {
			var q = U.toJSON(qs)
			if ( q.coll ) {
				if ( q.where && qs.indexOf('#') >= 0 ) {
					for ( p in q.where ) {
						var v = q.where[p] 
						if ( isNaN(v) && v.charAt(0) == '#' ) {
							var f = v.substr(1)
							v = this.par.args[f]
							if ( v )  q.where[p] = v
							else  delete q.where[p]
						}
					}
				}
				q.db = this.par.db
				M.cursor(q, function(res) {
					if ( res.err ) {
						self.returnError(res)
						callback(true)
					} else {
						band.cursor = res
						band.cursor.count(function(err, count) {
							band.count = count
							callback()
						})
					}
				})
			} else if ( q.field ) {
				var rec = this.band[this.findBand(bandname, true)-1].rec
				if ( rec ) band.data = rec[q.field]
				else if ( this.par.args.parentData ) band.data = this.par.args.parentData[q.field]
				if ( band.data ) band.count = band.data.length
				else band.count = 0
				callback()
			} else if ( q.script && bandname == 'header' ) {
				q.app = this.par.app
				q.db = this.par.db
				q.args = U.cloneJSON(this.par.args)
				q.band = bandname
				script(q, function(res) {
					if ( res.err ) {
						self.returnError(res)
						callback(true)
					} else {
						self.data = res
						band.count = self.data.length
						callback()
					}
				})
			} else  callback()
		} else if ( self.rec && bandname == 'detail' ) {
			band.count = self.rec['detail'].length
			callback()
		} else  callback()
	},
	
	
	print : function( bandname, callback, idx ) {
//console.log( 'print %s %s', bandname, this.par.args.report  )
		var band = this.findBand(bandname)
			, self = this
			, ret = function(err) {callback(err)}
		if ( self.top + band.height > self.bottom && bandname != 'footer' ) {
			self.print('footer', function(err) {
				if ( err ) console.log( 'print footer err' )
				self.newPage(1)
				self.print('header', function(err) {
					if ( err ) console.log( 'print header err' )
					bandrec()
				})
			})
		} else bandrec()

		function bandrec() {
			if ( band.cursor ) {
				band.cursor.nextObject( function(err, doc) {
					if ( err ) {
						console.log( err )	
						self.returnError({err: U.err.data})
						callback(true)
					} else {
						band.rec = doc
						prn(ret)
					}
				})
			} else if ( self.rec ) {
				if ( bandname == 'header' ) band.rec = self.rec
				else {
					var bdata = self.rec[bandname]
					if ( bdata ) {
						if ( Array.isArray(bdata) && idx >= 0 ) band.rec = bdata[idx]
						else U.objExtend(band.rec, bdata)
					}
				}
				prn(ret)
			/*} else if ( band.data ) {
				if ( idx >= 0 ) band.rec = band.data[idx]
				prn(ret)*/
			} else {
				prn(ret)
			}
		}

		function prn( callback ) {
			if ( bandname == 'header' && band.rec && idx >= 0 ) U.objExtend(band.rec, self.par.args)
			self.computedFields(band)
			var imgs = 0
			band.html.children().each( function() {
				var el = self.$(this)
				if ( el.hasClass('br-hidden') || el.attr('disabled') ) return
				var f = self.getFont(el.attr('style'))
					, css = cssObj(el)
					, op =  {}
				if ( css['text-align'] ) op = {align: css['text-align'], width: css.width}
				// font
				if ( f ) {
					self.pdf.fontSize(f.size)
					self.pdf.font(f.fam)
				}

				var left = css.left + self.left + 1
					, top = css.top + 2
				top += (bandname == 'footer') ? self.bottom : self.top 
				if ( el.hasClass('br-label') ) {
					self.pdf.text(el.text(), left, top, op)
				} else if ( el.hasClass('br-field') && band.rec ) {
					var id = el.attr('id')
						, val
					if ( id == 'PAGE' ) val = self.pgnum
					else if ( id == 'DATE' ) val = new Date().getTime()
					else val = band.rec[id]
					if ( val || typeof val == 'number' ) {
						if  ( el[0].name == 'select' ) val = selectVal(el[0], val)
						else if ( el.attr('type') == 'date' ) val = U.strDate(new Date(val).getTime()+self.srvtz)
						else if ( el.attr('type') == 'datetime' ) val = U.strDate(new Date(val).getTime()+self.srvtz, 'hm')
						else if ( el.attr('type') == 'time' ) val = U.strTime(val)
						else if ( val.lab ) val = val.lab
						else if ( el.attr('type') == 'number' ) {
							var dec = el.attr('data-decimals')
							if ( dec && typeof val == 'number' ) val = val.toFixed(dec)
						} 
						if ( el[0].name == 'textarea' ) {
							self.pdf.text(val, left, top, {width: css.width, height: css.height})
						} else if ( el.attr('type') == 'checkbox' ) {
							self.pdf.image('client/images/checked.png', left, top, {width: 9})
						} else self.pdf.text(val, left, top, op)
					}
				} else if ( el[0].name == 'img' ) {
					imgs++
					var id = el.attr('data-id')
					M.file({db: self.par.app, _id: id, mode: 'rf'}, null, function(file) {
						if ( !file.err ) {
							var path = 'tmp/' + id
							fs.writeFileSync(path, file)
							self.pdf.image(path, css.left + self.left, css.top + self.top, 
														{width: css.width, height: css.height})
						}
						if ( --imgs == 0 ) prnend()
					})
				}
				// reset to default font
				if ( f ) {
					self.pdf.fontSize(self.font.size)
					self.pdf.font(self.font.fam)
				}
				// border
				if ( css.border ) {
					var w = css.width || 100
						, h = css.height || 13
					if ( el.hasClass('br-rectangle') ) {
						w += css.border
						h += css.border
					}
					self.pdf.lineWidth(css.border)
					self.pdf.rect(css.left + self.left, css.top + self.top, w, h).stroke()
				}
			})
			if ( imgs == 0 ) prnend()
			
			function prnend() {
				var nest = band.html.find('.br-nested')
				if ( nest.length > 0 ) {
//console.log( 'nest' )
					var par = U.cloneJSON(self.par)
						, css = cssObj(nest)
					par.args.report = nest.attr('data-nested')
					par.args.parentData = band.rec
					par.args.left = css.left
					par.args.top = self.top + css.top
					new Report(par, function(r) {
						if ( r.err )  return callback(r)
						r.build( function(top) {
							self.top = top
							callback()
						})
					}, self.pdf)
				} else {
					self.top += band.height
					if ( bandname == 'detail' ) total(band.rec)
					callback()
				}
			}
		
			function total( detrec ) {
				var tot = self.findBand('total')
				if ( !tot.rec ) tot.rec = {}
				var rec = tot.rec
				tot.html.find('input[type=number],input[type=time]').each( function() {
					var el = self.$(this)
						, id = el.attr('id')
					if ( detrec && !isNaN(detrec[id]) ) {
						if ( !rec[id] ) rec[id] = 0
						rec[id] += detrec[id]
					}
				})
			}

		}
	
		function cssObj( el ) {
			var s = el.attr('style')
			if ( s ) {
				var st = U.strSplit(s, ';')
					, css = {}
				for ( var i=0; i < st.length; i++ ) {
					var pr = U.strSplit(st[i], ':')
					if ( 'top,left,width,height'.indexOf(pr[0]) > -1 ) css[pr[0]] = parseInt(pr[1].replace('px', ''), 10) 
					else css[pr[0]] = pr[1]
				}
				return css
			}
			return {}
		}
	
		function selectVal( el, val ) {
			var el = self.$(el)
				, id = el.attr('id')
				, flds = U.strSplit(el.attr('data-fields'), ',')
			for ( var i=self.selects.length-1; i >= 0; i-- ) {
				var sel = self.selects[i]
				if ( sel.field.indexOf(id) >= 0 ) {
					for ( var k=sel.data.length-1; k >= 0; k-- ) {
						var rec = sel.data[k]
						if ( rec[flds[0]]+'' == val+'' ) {
							val = ''
							for ( var j=1; j < flds.length; j++ ) {
								var f = flds[j]
								if ( j > 1 ) {
									if ( f.charAt(0) == '+' ) {
										val += ' '
										f = flds[j].substr(1)
									} else val += ' - '
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

	},
	
	computedFields : function( band ) {
		var self = this
		band.html.find('input[data-formula]').each( function() {
			var el = self.$(this)
				, formula = el.attr('data-formula')
			if ( formula ) {
				var expr = formulaExpr(band.rec, formula)
				if ( expr ) {
					var v
					try {
						v = eval(expr)
					} catch (e) {
					}
					if ( v ) band.rec[el.attr('id')] = v 
				}
			}
		})

		function formulaExpr( rec, formula ) {
			if ( rec ) {
				var op = '*+/-()'
					, p = 0, b = 0
					, expr = ''
				formula = U.strRep(formula, ' ', '')
				do {
					while ( op.indexOf(formula.charAt(p)) > -1 ) expr += formula.charAt(p++)
					b = p
					p = U.strFindAny(formula, op, p)
					if ( p < 0 ) p = formula.length
					var f = formula.substring(b,p)
						, v = (isNaN(f)) ? rec[f] : f
					if ( !v ) v = 0
					expr += v + formula.charAt(p)
					p++
				} while ( p < formula.length )
				return expr
			}
			return '0'
		}
	},
	
	
	newPage : function( i ) {
		if ( i > 0 )  this.pdf.addPage()
		this.pgnum++
		this.top = 0
	},
	
	
	findBand : function( name, idx ) {
		for ( var i=0; i < this.bands.length; i++ )
			if ( this.bands[i].name == name ) {
				if ( idx ) return i
				else return this.bands[i]
			}
	},
	
	getFont : function( s ) {
		if ( !s ) return null
		
		var p = s.indexOf('font:')
			, sz, fam
			, family = function(f, s) {
					if ( ['arial', 'verdana', 'helvetica'].indexOf(f) >= 0 ) {
						if ( s == 'bold') return 'Helvetica-Bold'
						else if ( ['italic', 'oblique'].indexOf(f) >= 0 ) return 'Helvetica-Oblique'
						else return 'Helvetica'
					}
				}
		if ( p >= 0 ) {
			var sp = U.strSplit(s.substring(p+5, s.indexOf(';', p)), ' ')
			if ( sp && sp.length > 1 ) {
				if ( sp[0].indexOf('px') > 0 ) {
					sz = sp[0]
					fam = family(sp[1])
				} else {
					sz = sp[1]
					fam = family(sp[2], sp[0])
				}
				return {size: parseInt(sz, 10), fam: fam}
			}
		}
		return null
	},
	
	returnError : function( res ) {
		this.httpRes.write('report error:\n')
		this.httpRes.end(JSON.stringify(res))
	}
	
}
/*************** END Report object *************/



/* Default report call
*/
function report( par, httpRes ) {
	new Report(par, function(r) {
		if ( r.err ) {
			httpRes.write('report error:\n')
			httpRes.end(JSON.stringify(r))
		} else r.build(httpRes)
	})
}






/* Server script
*/
function script( par, callback ) {
	if ( par.app && par.script ) {
		var m = par.script.split('.')
		if ( m[1] ) {
			loadScripts(par, function(res) {
				if ( res.err )  return callback(res)
				else {
					try {
						var mod = require('./scripts/' + m[0])
						mod[m[1]](par, function(res) {callback(res)})
					} catch (err) {
						console.log(err)
						callback({err: U.err.script})
					}
				}
			})
		} else if ( module.exports[par.script] ) {
			module.exports[par.script](par, function(res) {callback(res)})
		} else {
			console.log('Script not found: ' + par.script)
			callback({err: U.err.script})
		}
	} else  callback({err: U.err.param})
}


var scripts = []

/* Load application scripts on disk
*/
function loadScripts( par, callback ) {
console.log( 'loadScripts' )
	M.get({db:par.app, coll:'scripts', fields:'name,updated,external'}, function(res) {
		if ( res.err || res.length == 0 )  return callback(res)
		else {
			var cd = process.cwd()
			loop(0)

			function loop( i ) {
				if ( i < res.length ) {
					if ( res[i].external ) return loop(i+1) 					
					var sc = res[i]
						, path = cd + '/scripts/'+ sc.name + '.js'
						, u = updated(sc)
					if ( !u.found || u.updated ) {
						M.get({db:par.app, coll:'scripts', where:{name:sc.name}}, function(res) {
							if ( res.err || res.length == 0 )  return callback(res)
							else {
//console.log( 'write ' + sc.name )
								fs.writeFileSync(path, res[0].code)
								delete require.cache[path]
								if ( !u.found )  scripts.push({name:sc.name, updated:sc.updated})
								loop(i+1)
							}
						})
					} else loop(i+1)
				} else callback({})
			}

			function updated( sc ) {
//console.log( sc )
				for ( var i=0, len=scripts.length; i < len; i++ ) {
					if ( scripts[i].name == sc.name ) {
						if ( scripts[i].updated == sc.updated )  return {found: true, updated: false}
						else {
							scripts[i].updated = sc.undated
							return {found: true, updated: true}
						}
					}
				}
				return {found: false}
			}

		}
	})
}






exports.remote = remote
exports.flexigridData = flexigridData
exports.menuItems = menuItems
exports.ideSaveTo = ideSaveTo
exports.report = report
exports.script = script

 