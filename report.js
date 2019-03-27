/*
 * Brumba
 *
 * © 2012-2016 Dan Parnete
 * Dual licensed under the MIT and GPL licenses.
 *
 */

var https = require('https')
	, fs = require('fs')

	, _ = require('underscore')
	, cheerio =  require('cheerio')
	, PDFDocument = require('pdfkit')

	, U = require('./util')
	, S = require('./srv')
	, M = require('./mongo')




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
	
//console.time('report')
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
									if ( q.coll ) {
										q.cmd = 'GET'
										M.get(q, function(res) {resu(res)})
									} else if ( q.script ) {
										q.cmd = 'SRV'
										q.app = self.par.app
										S.script(q, function(res) {resu(res)})
									}
									
									function resu(res) {
										if ( res.err ) selData(n+1)
										else {
											add(id, q, res)
											selData(n+1)
										}
									}
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
						httpRes.writeHead(200, {'Content-Type': 'application/pdf',
													'Content-Disposition': 'inline; filename="'+new M.ObjectID()+'.pdf"'})
						self.pdf.pipe(httpRes)
						self.pdf.end()
//console.timeEnd('report')
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
				var rec = this.bands[this.findBand(bandname, true)-1].rec
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
				S.script(q, function(res) {
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
		} else if ( self.rec && bandname == 'group0' ) {
			band.count = self.rec['group0'].length
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
			} else {
				if ( band.data ) band.rec = band.data[idx]
				else if ( self.rec ) {
					if ( bandname == 'header' ) band.rec = self.rec
					else {
						var bdata = self.rec[bandname]
						if ( bdata ) {
							if ( Array.isArray(bdata) && idx >= 0 ) band.rec = bdata[idx]
							else _.extend(band.rec, bdata)
						}
					}
				}
				prn(ret)
			}
		}

		function prn( callback ) {
			if ( bandname == 'header' && band.rec && idx >= 0 ) _.extend(band.rec, self.par.args)
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
							self.pdf.image('www/images/checked.png', left, top, {width: 9})
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
				, expr = U.formulaValues(band.rec, el.attr('data-formula'))
			if ( expr ) {
console.log(expr)
				try {
					var v = eval(expr)
					if ( v ) band.rec[el.attr('id')] = v
				} catch (e) {
					console.log(e)
				}
			}
		})
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






exports.report = report

