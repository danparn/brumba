/*
 * Brumba
 *
 * © 2012-2016 Dan Parnete
 * Dual licensed under the MIT and GPL licenses.
 *
 */


var fs = require('fs')
	, https = require('https')
	, Readable = require('stream').Readable 
	, util = require('util')
	, _ = require('underscore')
	, U = require('./util')
	, M = require('./mongo')




/* Create excel xlsx from json rows
	columns = [
		{field: 'serial_identity_number', header: 'Serie sasiu'},
		{field: 'license_plate', header: 'Numar inmatriculare'},
		{field: 'start_time', header: 'Data/Ora start', type: 'DateTime'},
		{field: 'km', header: 'Km parcursi', type: 'Number', decimals: 3},
		{field: 'total_time', header: 'Durata functionare', type: 'Time'}
	]
*/
function excel( par ) {
	this.httpRes = par.httpRes
	this.cols
	this.colslen
	this.srvtz = par.args.timezone - new Date().getTimezoneOffset() * -60000
	
	this.columns = function( cols ) {
		this.cols = cols
		this.colslen = cols.length
		this.httpRes.writeHead(200, {'Content-Type': 'application/vnd.ms-excel',
											'Content-Disposition': 'inline; filename="'+new M.ObjectID()+'.xls"'})
		this.httpRes.write('<?xml version="1.0"?>' +
				'<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ' +
									'xmlns:x="urn:schemas-microsoft-com:office:excel" ' + 
									'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">' +
				  '<Styles>' +
				    '<Style ss:ID="Default" ss:Name="Normal"><Font ss:Size="8"/></Style>' +
				    '<Style ss:ID="sBold"><Font ss:Size="8" ss:Bold="1"/></Style>' +
				    '<Style ss:ID="sRight"><Alignment ss:Horizontal="Right"/></Style>' +
				    '<Style ss:ID="sDate"><NumberFormat ss:Format="Short Date"/></Style>' +
				    '<Style ss:ID="sDateTime"><NumberFormat ss:Format="General Date"/></Style>' +
				    '<Style ss:ID="sTime"><NumberFormat ss:Format="Time"/></Style>' +
				  '</Styles>' +
				  '<Worksheet ss:Name="Sheet1">' +
				    '<Table ss:StyleID="Default">' +
							'<Row ss:StyleID="sBold">')
		for ( var i=0; i < cols.length; i++ )
    	this.httpRes.write('<Cell><Data ss:Type="String">' + (cols[i].header || cols[i].field) + '</Data></Cell>')
		this.httpRes.write('</Row>')
	}

	this.rows = function( docs ) {
		for ( var j=0,len=docs.length; j < len; j++ ) {
			var doc = docs[j]
			this.httpRes.write('<Row>')
			for ( var i=0; i < this.colslen; i++ ) {
				var c = this.cols[i]
				if ( c.field in doc && (c.type != 'Number' || !isNaN(doc[c.field])) ) {
	        var cell = '<Cell ss:Index="' + (i+1) + '"'
	        	, data = '<Data ss:Type="'
						, val = doc[c.field]
					if ( 'Number,Boolean'.indexOf(c.type) > -1 ) data += 'Number'
					else if ( 'Date,DateTime,Time'.indexOf(c.type) > -1 ) data += c.type
					else data += 'String'
					data += '">'
					switch ( c.type ) {
						case 'Number': 
							if ( !isNaN(c.decimals) ) val = val.toFixed(c.decimals)
							break
						case 'Date':
							cell += ' ss:StyleID="sDate"'
							//val = U.strDateXml(val+this.srvtz)
							break
						case 'DateTime':
							cell += ' ss:StyleID="sDateTime"'
							val = U.strDateXml(val+this.srvtz, true)
							break
						case 'Time':
							cell += ' ss:StyleID="sTime"'
							val = U.strTime(val+this.srvtz, true)
							break
						case 'Boolean': 
							if ( val ) val = 1
							else val = 0
							break
						default:
							if ( typeof val == 'string' ) {
								val = val.replace(/</g, '&lt;')
								val = val.replace(/&/g, '&amp;')
							}
					}
					data += val + '</Data>'
					cell += '>' + data + '</Cell>'
					this.httpRes.write(cell)
				}
			}
			this.httpRes.write('</Row>')
		}
	}

	this.end = function() {
		this.httpRes.end('</Table></Worksheet></Workbook>')
	}
}









/**************************************************************
 *
 *											Script caller
 *
 **************************************************************/
var scripts = []

/* Server script
*/
function script( par, callback ) {
	if ( par.app && par.script ) {
		var m = par.script.split('.')
		if ( m[1] ) {
			var f = m[1]
				, m = m[0]
			loadScripts(par, function(res) {
				if ( res.err || !scripts[0] )  return callback(res)
				else {
					var mod
					try {
						mod = require('./scripts/' + par.app + '/' + m)
						if ( f in mod ) mod[f](par, callback)
						else callback({err: U.err.script})
					} catch (err) {
						if ( !mod && m != 'triggers' ) console.log(err)
						callback({err: U.err.script})
					}
				}
			})
		} else if ( module.exports[par.script] ) {
			module.exports[par.script](par, callback)
		} else {
			console.log('Script not found: ' + par.script)
			callback({err: U.err.script})
		}
	} else  callback({err: U.err.param})
}



/* Load application scripts on disk
*/
function loadScripts( par, callback ) {
//console.log( 'loadScripts' )
	scripts = []
	M.get({db:par.app, coll:'scripts', fields:'name,updated,external'}, function(res) {
		if ( res.err || res.length == 0 )  return callback(res)
		else {
			var cd = process.cwd()
			loop(0)

			function loop( i ) {
				if ( i < res.length ) {
					if ( res[i].external ) return loop(i+1) 					
					var sc = res[i]
						, u = updated(sc)
					if ( !u.found || u.updated ) {
						M.get({db:par.app, coll:'scripts', where:{name:sc.name}}, function(res) {
							if ( res.err || res.length == 0 )  return callback(res)
							else {
								var path = cd + '/scripts/' + par.app
								fs.mkdir(path, function(err) {
									path += '/' + sc.name + '.js'
									fs.writeFileSync(path, res[0].code)
									delete require.cache[path]
									if ( !u.found )  scripts.push({name:sc.name, updated:sc.updated})
									loop(i+1)
								})
							}
						})
					} else loop(i+1)
				} else callback({})
			}

			function updated( sc ) {
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



/* Uncache scripts
*/
function uncacheScripts( par ) {
	M.get({db:par.app, coll:'scripts', fields:'name'}, function(res) {
		if ( !res.err )
			for ( var i=0; i < res.length; i++ ) unc(res[i].name)
	})

	function unc( name ) {
		var mod
		try {
			mod = require.resolve(process.cwd() + '/scripts/' + par.app + '/' + name)
		} catch(e) {
			return
		}
console.log( 'uncache ' + name )
		if ( mod ) delete require.cache[mod]
	}
}










/**************************************************************
 *
 *											Brumba scripts
 *
 **************************************************************

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




/* Get user
*/
function getUser( par, callback ) {
console.log(par.username)
	if ( !_.has(par, 'db') || !_.has(par, 'username') ) return callback({err: U.err.user})
	
	M.get({db: par.db, coll: '_users', where: {username: par.username}}, function(res) {
		if ( res.err || !res[0] ) callback({err: U.err.user})
		else {
			delete res[0].password
			callback(res[0])
		}
	})
}





/* Readable Buffer
*/
function ReadableBuffer( buffer ) {  
	Readable.call(this)
	this.buffer = buffer
	this.off = 0
	this.size = 1024
} 
util.inherits(ReadableBuffer, Readable) 

ReadableBuffer.prototype._read = function () { 
	if ( this.off < this.buffer.length ) {
    var chunk = this.buffer.slice(this.off, this.off+this.size)
    if ( chunk.length > 0 ) {
	    this.off += chunk.length
      return this.push(chunk)
    }
  }
  this.push(null) 
} 





exports.script = script
exports.uncacheScripts = uncacheScripts
exports.flexigridData = flexigridData
exports.menuItems = menuItems
exports.ideSaveTo = ideSaveTo
exports.remote = remote
exports.excel = excel
exports.getUser = getUser
exports.ReadableBuffer = ReadableBuffer
