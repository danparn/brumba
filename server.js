/*
 * Brumba
 *
 * © 2012-2014 Dan Parnete
 * Dual licensed under the MIT and GPL licenses.
 *
 */

var querystring = require('querystring')
	, connect = require('connect')
	, static = require('serve-static')
	, https = require('https')
	, fs = require('fs')
	, ObjectID = require('mongodb').ObjectID
	, U = require('./client/js/util')
	, M = require('./mongo')
	, S = require('./srv')


	, port = ( process.argv[2] ) ? parseInt(process.argv[2], 10) : 8080
	, logged = []		// logged users
	, logTimeout = 60 * 60000
	, trusted = null	// trusted servers


if ( process.argv[3] )   M.setURL( process.argv[3] )


function brumba( req, res ) {
	var par = JSON.parse( decodeURIComponent(req.url.substr(2)) )
		, data = []
//console.log( req.connection.remoteAddress + '   ' + new Date() )
console.log( JSON.stringify(par) )

	// check user
	if ( !usercheck(req.connection.remoteAddress) ) return callback({err: U.err.user})

	// data
	req.on('data', function(chunk) {
		data[data.length] = chunk
	})

	req.on('end', function() {
		switch ( par.cmd ) {
		  case 'GET':
		  	if ( (par.coll == 'forms' || par.coll == 'pages') && par.where && par.where.name  
		  					&& par.where.name.charAt(0) == '_' ) {
		  		var frm = sysform(par)
		  		if ( frm ) {
		  			callback([frm])
		  			break
		  		}
		  	}
		  	M.get(par, function(r) {
		  		if ( par.coll == '_users' && Array.isArray(r) ) {
		  			for ( var i=r.length-1; i >= 0; i-- )
		  				if ( r[i].password ) r[i].password = 'aa'
		  		}
		  		callback(r)
		  	}, res)
		  	break
		  case 'POST':  M.post( par, data, callback );  break
		  case 'DEL':  M.del( par, callback );  break
		  case 'FILE':
				if ( par.mode == 'r' )  M.file(par, res, callback)
				else  M.file(par, data, callback)
				break
		  case 'SRV':  par.httpRes = res; S.script(par, callback);  break
		  case 'REP':  S.report(par, res);  break
		  default:
				console.log('brumba: unknoun command: ' + par.cmd)
				callback({err: U.err.param})
		}
		if ( par.cmd == 'POST' && par.coll == 'scripts' ) uncache(par)
	})

	// callback
	function callback( dat ) {
		var head = {'Content-Type': 'application/json'}
			, body
		if ( dat.head ) {
			head = dat.head 			
			body = dat.body
		} else body = JSON.stringify(dat)
		res.writeHead(200, head)
		res.end(body)
	}

	function usercheck( remoteHost ) {
		if ( par.usercode ) {
return true
			if ( par.usercode == 'trusted' ) {
				if ( !trusted ) {
					try {
						trusted = JSON.parse(fs.readFileSync('trusted.json'))
					} catch (e) {
						console.log('Error: trusted.json')
					}
				}
				if ( trusted && trusted.indexOf(remoteHost) > -1 ) return true
			} else {
				for ( var i=logged.length-1; i >= 0; i-- ) {
					if ( logged[i].usercode == par.usercode ) {
						logged[i].lastAccess = (new Date()).getTime()
						return true
					}  
				}
			}
		}
		return false
	}
}

function login( req, res ) {
	var par = querystring.parse( req.url.substr(3) )
	res.writeHead(200, {'Content-Type': 'application/json'})
	userMenu( par, function(ret) {
		res.end( JSON.stringify(ret) )
	})
}


var app = connect()
//	.use( connect.morgan('short') )
		.use( static(__dirname + '/client') )
		.use( '/brumba', brumba )
		.use('/login', login )

var options = {
    key:    fs.readFileSync('key.pem'),
    cert:   fs.readFileSync('key-cert.pem')
}

https.createServer(options, app).listen(port)
console.log( 'Connect server listening on port ' + port )



/* Logged users timeout
*/
setInterval( function() {
	var now = (new Date()).getTime()
	for ( var i=0; i < logged.length; i++ ) {
		if ( now - logged[i].lastAccess > logTimeout )  logged.splice( i, 1 )
	}
}, 60000)



/* Generate user code and menu
*/
function userMenu( par, callback ) {
	var user, perm

	// User
	M.get({db: par.db, coll: '_users', where: {username: par.username}}, function(res) {
		if ( res.err )  return callback(res)
		if ( !res[0] ) {
			var brumba = '57b5892eb115f4302e54748e7de9ac80e254f36a6a6b9e9dd90465ed7ef31992'
			if ( par.username == 'admin' && par.password == brumba  ) {
				user = { username: 'admin', password: brumba, admin: true }
				M.post( {db: par.db, coll: '_users'}, user, function(res) {
					if ( res.err ) callback(res)
					user._id = res.newid
					permissions()
				})
			} else callback({err: U.err.user})
		} else if ( res[0].password == par.password ) {
			user = res[0]
			permissions()
		} else callback({err: U.err.user})
	})

	// Permissions
	function permissions() {
		if ( par.username == 'admin' || user.admin ) {
			perm = {admin: true}
			menu()
		} else {
			perm = user.permissions || []
			if ( user.usergroups ) {
				M.get({db: par.db, coll: '_users', where: {username: {$in: user.usergroups.split(/\s*,\s*/)}}, concat: 'permissions'}, function(res) {
					if ( res.err )  callback( res )
					else {
						perm = perm.concat( res )
						menu()
					}
				})
			} else  menu()
		}
	}

	// Create menu
	function menu() {
		M.get( {db: par.app, coll: 'application', where: { section: 'menu' }}, function(res) {
			var ret = {usercode: newCode(), userid: user._id}
			if ( user.admin ) ret.useradm = user.admin
			if ( res.err )  return callback(res)
			else if ( !res[0] ) return callback(ret)
			else {
				var m = ''
					, sp = res[0].menu.split('\n')
					, lastabs = 0
				for ( var i=0; i <= sp.length; i++ ) {
					var ln = sp[i]
						, pg = null
						, tabs = 0
						, prm = null
					if ( ln ) {
						var tit = U.strGetBet( ln, '"', '"' ),
						pg = ln.substr( ln.lastIndexOf('"') +1 ).trim( ' ' )
						prm = checkPermissions(pg)
						if ( pg && !prm )  continue
						for ( var j=0; ln[j] == '\t'; j++ )  tabs++
					}
					if ( tabs == lastabs ) {
						if ( m.length > 0 )  m += '</li>'
					} else if ( tabs > lastabs ) {
						m += '<ul>'
					} else {
						for ( var l=tabs; j < lastabs; j++ )  m += '</ul></li>'
					}
					if ( ln ) {
						m += '<li'
						if ( pg )  m += ' data-item="' + pg + '"'
						if ( prm != '' )  m += ' data-prm="' + prm + '"'
						m += '><a href="#">'+ tit + '</a>'
					}
					lastabs = tabs
				}
				m = '<ul id="menu">' + m + '</ul>'
				ret.menu = m
				callback(ret)
			}
		})
	}

	function checkPermissions( pg ) {
		if ( perm.admin )  return 'rwd'
		else {
			var p = ''
			for ( var i=0; i < perm.length; i++ ) {
				if ( perm[i].form == pg ) {
					if ( perm[i].read )  p += 'r'
					if ( perm[i].write )  p += 'w'
					if ( perm[i].delete )  p += 'd'
				}
			}
			return p
		}
	}

	// Generate user code
	function newCode() {
		var code = (new ObjectID()).toString()
			, i = 0
		while ( i < logged.length && !(logged[i].username == par.username && logged[i].db == par.db)  )  i++
		logged[i] = {
			db: par.db,
			username: par.username,
			usercode: code,
			lastAccess: (new Date()).getTime()
		}
		return code
	}
}







var sysforms = null

/* Load form from sysform.json file
*/
function sysform( par ) {
	if ( !sysforms ) {
		try {
			sysforms = JSON.parse(fs.readFileSync('sysforms.json'))
		} catch (e) {
			return null
		}
	}
	for ( var i=0; i < sysforms.length; i++ ) {
		if ( sysforms[i].name == par.where.name &&
				( par.coll == 'pages' && sysforms[i].html.indexOf('br-page') > 0 ||
				par.coll == 'forms' && sysforms[i].html.indexOf('br-form') > 0) )
			return sysforms[i]
	}
	return null
}




/* Uncache module
*/
function uncache( par ) {
	M.get({db:par.db, coll:'scripts', fields:'name'}, function(res) {
		if ( !res.err )
			for ( var i=0; i < res.length; i++ ) unc(res[i].name)
	})

	function unc( name ) {
		var mod
		try {
			mod = require.resolve('./scripts/'+name)
		} catch(e) {
			return
		}
console.log( 'uncache ' + name )
		if ( mod ) delete require.cache[mod]
	}
}




/* Get user
*/
function getUser( par, callback ) {
	if ( !U.objHasFields(par, 'db,usercode') ) return callback({err: U.err.user})
	
	var i = 0
		, len = logged.length
	while ( i < len && !(logged[i].usercode == par.usercode && logged[i].db == par.db ) ) i++
	if ( i == len ) callback({err: U.err.user})
	else {
		M.get({db:par.db, coll:'_users', where:{username:logged[i].username}}, function(res) {
			if ( res.err || !res[0] ) callback({err: U.err.user})
			else {
				delete res[0].password
				callback(res[0])
			}
		})
	}
}



exports.getUser = getUser