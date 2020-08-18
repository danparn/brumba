/*
 * Brumba
 * Copyright (c) 2012-2020 Dan Parnete
 *
 * This source code is licensed under the MIT license.
*/


import fs from 'fs'
import https from 'https'
import { err, strSplit } from './lib/common.js'
import { get, ObjectID } from './mongo.js'
import { createRequire } from 'module';

const require = createRequire(import.meta.url)


/* 
 * Create excel xlsx from json rows
 * 	columns = [
 * 		{field: 'serial_identity_number', header: 'Serie sasiu'},
 * 		{field: 'license_plate', header: 'Numar inmatriculare'},
 * 		{field: 'start_time', header: 'Data/Ora start', type: 'DateTime'},
 * 		{field: 'km', header: 'Km parcursi', type: 'Number', decimals: 3},
 * 		{field: 'total_time', header: 'Durata functionare', type: 'Time'}
 * 	]
*/
export class Excel {
	constructor(par) {
		this.httpRes = par.httpRes
		this.cols
		this.srvtz = par.args.timezone - new Date().getTimezoneOffset() * -60000
	}
	
	columns(cols) {
		this.cols = cols
		this.httpRes.writeHead(200, {
			'Content-Type': 'application/vnd.ms-excel',
			'Content-Disposition': `inline; filename="${new ObjectID()}.xls"`
		})
		this.httpRes.write(`
			<?xml version="1.0"?>
				<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
									xmlns:x="urn:schemas-microsoft-com:office:excel"
									xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
				  <Styles>
				    <Style ss:ID="Default" ss:Name="Normal"><Font ss:Size="8"/></Style>
				    <Style ss:ID="sBold"><Font ss:Size="8" ss:Bold="1"/></Style>
				    <Style ss:ID="sRight"><Alignment ss:Horizontal="Right"/></Style>
				    <Style ss:ID="sDate"><NumberFormat ss:Format="Short Date"/></Style>
				    <Style ss:ID="sDateTime"><NumberFormat ss:Format="General Date"/></Style>
				    <Style ss:ID="sTime"><NumberFormat ss:Format="Time"/></Style>
				  </Styles>
				 <Worksheet ss:Name="Sheet1">
				    <Table ss:StyleID="Default">
							<Row ss:StyleID="sBold">
		`)
		for (let i=0; i < cols.length; ++i) {
    	this.httpRes.write(`
				<Cell><Data ss:Type=String">${cols[i].header || cols[i].field}</Data></Cell>
			`)
		}
		this.httpRes.write('</Row>')
	}

	rows(docs) {
		for (let j=0,len=docs.length; j < len; ++j) {
			const doc = docs[j]
			this.httpRes.write('<Row>')
			for (let i=0; i < this.cols.length; ++i) {
				const c = this.cols[i]
				if (c.field in doc && (c.type !== 'Number' || !isNaN(doc[c.field])) ) {
	        let cell = `<Cell ss:Index="${i+1}"`
	        let data = '<Data ss:Type="'
					const val = doc[c.field]
					if ('Number,Boolean'.includes(c.type)) {
						data += 'Number'
					} else if ('DateTime'.includes(c.type)) {
						data += c.type
					} else {
						data += 'String'
					}
					data += '">'
					switch (c.type) {
						case 'Number': 
							if (!isNaN(c.decimals)) val = val.toFixed(c.decimals)
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
							if (val) {
								val = 1
							} else {
								val = 0
							}
							break
						default:
							if (typeof val == 'string') {
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

	end() {
		this.httpRes.end('</Table></Worksheet></Workbook>')
	}
}









/**************************************************************
 *
 *											Script caller
 *
 **************************************************************/
const scripts = []

/* 
 * Server script
 */
export const script = par => {
	// updated
	const updated = sc => {
		const srcipt = scripts.find(s => s.name === sc.name)
		if (script) {
			if (script.updated === sc.updated) return {found: true, updated: false}
			script.updated = sc.undated
			return {found: true, updated: true}
		}
		return {found: false}
	}
	
	return new Promise((resolve, reject) => {
		// callback
		const callback = dat => {
			if (dat.err) {
				reject(dat)
			} else {
				resolve(dat)
			}
		}

		if (!par.app || !par.script) return reject({err: err.param})
	
		const [m, f] = par.script.split('.')
		if (f) {
			get({db:par.app, coll:'scripts', where: {name: m}})
			.then(res => {
				if (!res[0]) {
					if (m === 'triggers') {
						return resolve({})
					} else {
						console.log(`Script not found: ${par.script}`)
						return reject({err: err.script})
					}
				}
				const sc = res[0]
				const u = updated(sc)
				if (!u.found || u.updated) {
					let path = process.cwd() + '/scripts/' + par.app
					fs.mkdir(path, e => {
						path += '/' + sc.name + '.js'
						fs.writeFileSync(path, sc.code)
						if (!u.found) {
							scripts.push({name:sc.name, updated:sc.updated})
						}
						import(`./scripts/${par.app}/${m}.js`)
						.then(mod => {
							if (f in mod) {
								mod[f](par, callback)
							} else if (f === '_just_load') {
								return resolve({})
							} else {
								console.log(`Cannot import script: ${par.script}`)
								reject({err: err.script})
							}
						})
						.catch(e => {
							if (m !== 'triggers') {
								console.log(e)
							}
							reject({err: err.script})
						})
					})
				} else {
					resolve({})
				}
			})
			.catch(reject)
		
		// srv script
		} else {
			import('./srv.js')
			.then(module => {
				if (module[m]) {
					module[m](par)
					.then(resolve)
					.catch(reject)
				} else {
					reject({err: err.script, msg: `Script not found: ${par.script}`})
				}
			})
			.catch(reject)
		}
	})
}



/* 
 * Uncache scripts
 */
export const uncacheScripts = par => {
	console.log('uncacheScripts')
	scripts.length = 0
}











/**************************************************************
 *
 *											References
 *
 **************************************************************/
/* 
 * References
 */
export const references = (par, data) => {
	console.log(data)
}









/**************************************************************
 *
 *											Brumba scripts
 *
 **************************************************************


/* 
 * Get user
 */
export const getUser = par => {
	return new Promise((resolve, reject) => {
		if (!par.hasOwnProperty('db') || !par.hasOwnProperty('username')) return reject({err: err.user})
		
		get({db: par.db, coll: '_users', where: {username: par.username}})
		.then(res => {
			if (!res[0]) return reject({err: err.user})
			delete res[0].password
			resolve(res[0])
		})
		.catch(reject)
	})
}




/* 
 * Menu items
 */
export const menuItems = par => {
	return get({db: par.app, coll: 'application', where: {section: 'menu'}})
	.then(res => {
		if (res.err || !res[0]) return reject(res)
		
		const m = []
		const sp = res[0].menu.split('\n')
		for (let i=0; i <= sp.length; ++i) {
			const ln = sp[i]
			if (ln) {
				let [menuitem, form] = strSplit(ln, '" ')
				if (form && form !== 'IDE' && (form !== 'pages._users' || par.username === 'admin')) {
					m.push({ 
						menuitem: menuitem.substring(1),
						form: form
					})
				}
			}
		}
		return m
	})
	.catch(e => e)
}

