/*
 * Brumba
 * Copyright (c) 2012-2020 Dan Parnete
 *
 * This source code is licensed under the MIT license.
*/

import querystring from 'querystring'
import connect from 'connect'
import serve_static from 'serve-static'
import https from 'https'
import fs from 'fs'
import { err, strGetBet } from './lib/common.js'
import { get, post, del, file, ObjectID } from './mongo.js'
import { script, uncacheScripts } from './srv.js'
import { report } from './report.js'


const port = process.argv[2] || 3000
const loggedUsers = []
const logTimeout = 30 * 60000
const sysForms = []







/* 
 *  Login
 */
const login = (req, res) => {
	const par = querystring.parse(req.url.substring(3))
	res.writeHead(200, {'Content-Type': 'application/json'})
	user(par, req.headers.host === 'localhost:3090')
	.then(ret => {
		res.end(JSON.stringify(ret))
	})
	.catch(e => {
		console.log(e)
		res.end(JSON.stringify(e))
	})
}



/* 
 * Generate user code and menu
 */
const user = (par, local) => {
	let user, perm
	return new Promise(async (resolve, reject) => {
		
		// User
		get({db: par.db, coll: '_users', where: {username: par.username}})
		.then(res => {
			if ((res[0] && res[0].password === par.password) || local) {
				user = res[0]
				permissions()
			} else {
				reject({err: err.user})
			}
		})
		.catch(reject)
	
		// Permissions
		const permissions = () => {
			if (par.username == 'admin' || user.admin) {
				perm = {admin: true}
				menu()
			} else {
				perm = user.permissions || []
				if (user.usergroups) {
					const q = {
						db: par.db,
						coll: '_users',
						where: {username: {$in: user.usergroups.split(/\s*,\s*/)}},
						concat: 'permissions'
					}
					get(q)
					.then(res => {
						perm = perm.concat(res)
						menu()
					})
					.catch(reject)
				} else {
					menu()
				}
			}
		}
	
		// Create menu
		const menu = () => {
			get({db: par.app, coll: 'application', where: {section: 'menu'}})
			.then(res => {
				if (par.usercode) return resolve({usercode: newCode()})
				const ret = {usercode: newCode(), userid: user._id}
				if (user.admin) ret.useradm = user.admin
				if (res[0]) {
					var m = ''
						, sp = res[0].menu.split('\n')
						, lastabs = 0
					for (let i=0; i <= sp.length; ++i) {
						var ln = sp[i]
							, pg = null
							, tabs = 0
							, prm = null
						if (ln) {
							var tit = strGetBet( ln, '"', '"' ),
							pg = ln.substr( ln.lastIndexOf('"') +1 ).trim( ' ' )
							prm = checkPermissions(pg)
							if (pg && !prm)  continue
							for (let j=0; ln[j] == '\t'; ++j)  tabs++
						}
						if (tabs == lastabs) {
							if (m.length > 0) {
								m += '</li>'
							}
						} else if (tabs > lastabs) {
							m += '<ul>'
						} else {
							for (let j=tabs; j < lastabs; ++j) {
								m += '</ul></li>'
							}
						}
						if (ln) {
							m += '<li><a'
							if (pg) {
								m += ' name="' + pg + '"'
							}
							if (prm !== '') {
								m += ' data-prm="' + prm + '"'
							}
							m += '>'+ tit + '</a>'
						}
						lastabs = tabs
					}
					ret.menu = m
					resolve(ret)
				} else if (user.admin) {
					ret.menu = `<ul id="menu">
												<li><a name="pages._users" data-prm="rwd">User Admin</a></li>
												<li><a name="IDE" data-prm="rwd">IDE</a></li>
											</ul>`
					resolve(ret)
				} else {
					reject({err: err.data, msg: "Menu not found"})
				}
			})
			.catch(reject)
		}
	
		const checkPermissions = pg => {
			if (perm.admin) return 'rwd'
			let p = ''
			for (let i=0; i < perm.length; ++i) {
				if (perm[i].form === pg) {
					if (perm[i].read)  p += 'r'
					if (perm[i].write)  p += 'w'
					if (perm[i].delete)  p += 'd'
				}
			}
			return p
		}
	
		// Generate user code
		const newCode = () => {
			const code = (new ObjectID()).toString()
			let i = 0
			while (i < loggedUsers.length && 
						!(loggedUsers[i].username === par.username && 
						loggedUsers[i].db === par.db)) {
				++i
			}
			loggedUsers[i] = {
				db: par.db,
				username: par.username,
				usercode: code,
				lastAccess: (new Date()).getTime()
			}
			return code
		}
	
	})
}



/*
 * Logged users timeout
 */
setInterval(() => {
	const now = (new Date()).getTime()
	for (let i=0; i < loggedUsers.length; ++i) {
		if (now - loggedUsers[i].lastAccess > logTimeout) {
			loggedUsers.splice(i, 1)
		}
	}
}, 60000)










const brumba = (req, res) => {
	const par = JSON.parse(decodeURIComponent(req.url.substring(2)))
	
	// FILE
	if (par.cmd === 'FILE') {
		file(par, req, res)
		return
	}
	
	// Other commands
	console.log(JSON.stringify(par) +'   '+ (new Date()).toJSON())
	const data = []

	// callback
	const callback = dat => {
		let head = {'Content-Type': 'application/json'}
		let body
		if (dat.head) {
			head = dat.head 			
			body = dat.body
		} else {
			body = JSON.stringify(dat)
		}
		res.writeHead(200, head)
		res.end(body)
	}

	// usercheck
	const usercheck = () => {
		if (req.headers.host === 'localhost:3090') {
			if (loggedUsers[0]) {
				par.username = loggedUsers[0].username
			} else {
				par.username = 'admin'
			}
			return true
		}
		
		if (par.usercode) {
			for (let i=loggedUsers.length-1; i >= 0; --i) {
				if (loggedUsers[i].usercode === par.usercode) {
					loggedUsers[i].lastAccess = (new Date()).getTime()
					par.username = loggedUsers[i].username
					return true
				}  
			}
		}
		return false
	}
	if (!usercheck()) return callback({err: err.user})

	// data
	req.on('data', chunk => {
		data[data.length] = chunk
	})

	req.on('end', () => {
		switch (par.cmd) {
		  case 'GET':
		  	if ((par.coll === 'forms' || par.coll === 'pages') && par.where && par.where.name  
		  					&& par.where.name.charAt(0) === '_' ) {
		  		const frm = sysform(par)
		  		if (frm) {
		  			callback([frm])
		  			break
		  		}
		  	}
		  	get(par)
		  	.then(r => {
		  		if (par.coll === '_users' && Array.isArray(r)) {
		  			for (let i=r.length-1; i >= 0; --i) {
		  				if (r[i].password) {
								r[i].password = 'aa'
							}
						}
		  		}
		  		callback(r)
		  	})
		  	.catch(callback)
		  	break
		  case 'POST':
				post(par, data).then(callback).catch(callback)
				break
		  case 'DEL':
				del(par).then(callback).catch(callback)
				break
		  case 'SRV':
				par.httpRes = res
				par.data = data
				script(par).then(callback).catch(callback)
				break
		  case 'REP':
				par.httpRes = res
				report(par)
				break
		  default:
				console.log('brumba: unknoun command: ' + par.cmd)
				callback({err: err.param})
		}
	})
	if (par.cmd == 'POST' && par.coll == 'scripts') uncacheScripts(par)
}








const app = connect()
		.use(serve_static(process.cwd() + '/'))
		.use('/brumba', brumba)
		.use('/login', login)
		.use('/ide', (req, res) => {
			const index = fs.readFileSync('index.html')
			res.end(index)
		})
		
const options = {
    key:    fs.readFileSync('server-key.pem'),
    cert:   fs.readFileSync('server-cert.pem')
}

https.createServer(options, app).listen(port)
console.log(`Brumba v1.00 listening on port ${port}   (node ${process.version})`)







/* 
 * System forms from sysform.json file
 */
const sysform = par => {
	if (!sysForms) {
		try {
			sysForms = JSON.parse(fs.readFileSync('sysForms.json'))
		} catch (e) {
			return null
		}
	}
	for (let i=0; i < sysForms.length; ++i) {
		if (sysForms[i].name === par.where.name &&
				(par.coll == 'pages' && sysForms[i].html.indexOf('br-page') > 0 ||
				par.coll == 'forms' && sysForms[i].html.indexOf('br-form') > 0)) {
			return sysForms[i]
		}
	}
	return null
}



