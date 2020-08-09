/*
 * Brumba
 * Copyright (c) 2012-2020 Dan Parnete
 *
 * This source code is licensed under the MIT license.
*/

import mongodb from 'mongodb'
import fs from 'fs'
import sharp from 'sharp'
import { err, strSplit, objPick, objClone, objEmpty } from './lib/common.js'
import { script } from './srv.js'

export const ObjectID = mongodb.ObjectID

const dbs = []
const hex24 = new RegExp('^[0-9a-fA-F]{24}$') // check for hex string of 24 chars
let url = 'localhost:27017'
let client

const timer = setTimeout(() => {
	// open connection
	client = new mongodb.MongoClient('mongodb://'+url, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	client.connect(error => {
		if (error) console.log(error)
	})
}, 500)





/* 
 * Set URL
 */
export const mongoURL = newUrl => url = newUrl




/* 
 * Database
 */
export const database = dbname => {
	return new Promise((resolve, reject) => {
		for (let i=0; i < dbs.length; ++i) {
			if (dbs[i].databaseName === dbname) return resolve(dbs[i])
		}
		client.db('admin').command({'listDatabases': 1, filter: {name: dbname}}, (e, res) => {
			if (e) {
				reject({err: err.db, msg: 'MongoDb not responding'})
			} else if (res.databases.length === 0) {
				reject({err: err.db, msg: 'Database not found: '+dbname})
			} else {
				const db = client.db(dbname)
				dbs.push(db)
				resolve(db)
			}
		})
	})
}





/* 
 * Get
 *		par = { db, coll, where, fields/concat, sort, skip, limit, result }
 *		result = 'cursor'/'count'/'code'
 */
export const get = par => {
	return new Promise(async (resolve, reject) => {
		if (!(par && par.db && par.coll)) return reject({err: err.param})
		
		const db = await database(par.db).catch(reject)
		if (!db) return
		
		const collection = db.collection(par.coll)
		const where = par.where || {}
		const fields = {}
		let addflds, sp
		
		if (par.concat) {
			fields[par.concat] = 1
			if (par.add) {
				addflds = strSplit(par.add, ',')
				for (let j = 0; j < addflds.length; ++j) {
					fields[addflds[j]] = 1
				}
			}
		} else if (typeof par.fields === 'string') {
			sp = strSplit(par.fields, ',')
			for (let i = 0; i < sp.length; ++i) {
				fields[sp[i]] = 1
			}
		} else {
			Object.assign(fields, par.fields)
		}
		if (par.extra) {
			sp = sp.concat(strSplit(par.extra, ','))
			for (let i = 0; i < sp.length; ++i) {
				fields[sp[i]] = 1
			}
		}
		oid(where)
		
		// count
		if (par.result === 'count') {
			collection.countDocuments(where, (err, count) => {
				if (err) {
					console.log(`Database ${par.db}:  Count error on collection: ${par.coll}`)
					reject({err: err.count})
				} else {
					resolve({count: count})
				}
			})
			
		// aggregate
		} else if (par.aggregate) {
			collection.aggregate(par.aggregate).toArray((err, docs) => {
				if (err) {
					console.log(`Database ${par.db}:  aggregate error on collection: ${par.coll}`)
					console.log(err)
					reject({err: err.data})
				} else {
					resolve(docs)
				}
			})
			
		} else {
			const options = objPick(par, 'sort', 'skip', 'limit')
			if (!par.sort) {
				options.sort = {_id: 1}
			}
			
			// cursor
			const cursor = collection.find(where, options).project(fields)
			if (par.result == 'cursor') {
				resolve(cursor)
			} else {
				
				// concat
				if (par.concat) {
					let data = []
					cursor.batchSize = 1
					cursor.each((err, doc) => {
						if (err) {
							console.log(`Database ${par.db}:  concat error on collection: ${par.coll}`)
							console.log(err)
							cursor.close()
							reject({err: err.data})
						} else if (doc === null) {
							resolve(data)
						} else if (doc[par.concat]) {
							const arr = doc[par.concat]
							if (par.add) {
								for (let i=arr.length-1; i > -1; --i) {
									const r = arr[i]
									for (let j = 0; j < addflds.length; ++j) {
										const f = addflds[j]
										if (f in doc) r[f] = doc[f]
									}
								}
							}
							data = data.concat(arr)
						}
					})
				
				// toArray
				} else {
					cursor.toArray((err, docs) => {
						if (err) {
							console.log(`Database ${par.db}:  toArray error on collection: ${par.coll}`)
							console.log(err)
							reject({err: err.data})
						} else if (par.result === 'code') { // for client scripts
							if (docs[0] && docs[0].code) {
								resolve({
										head: {'Content-Type': 'application/javascript'},
										data: docs[0].code
									})
							} else {
								reject({err: err.script})
							}
						} else {
							resolve(docs)
						}
					})
				}
			}
		}
		
		
	})
}



/* 
 * Cursor
 */
export const cursor = par => {
	par.result = 'cursor'
	return get(par)
}



/* 
 * Post - insert documents to database
*/
export const post = (par, data) => {
	let collection, datc

	// saveRec
	const saveRec = rec => {
		return new Promise((resolve, reject) => {
			const ret = {}
			oid(rec)
			
			const end = d => {
				if (d.err) {
					reject(d)
				} else {
					par.res = d
					par.data = datc
					trigger('afterSave', par)
					.then(res => {
						resolve(d)
					})
					.catch(reject)
				}
			}

			// Update
			if (rec._id) {
				const cond = {_id: rec._id}
				collection.find(cond).toArray((er, res) => { // check if exists
//console.log(res)
					if (er) {
						console.log(`Database ${par.db}:  Collection ${par.coll}:  read error: ${err}`)
						return end({err: err.data})
					}
					if (res[0]) {
						ret._id = rec._id
						arrayUpdate(rec, cond, '', res[0])
						.then(() => {
							delete rec._id
							if (!objEmpty(rec)) {
console.log('update')
console.log('cond: '+cond)
								collection.updateOne(cond, $set(rec), (er, res) => {
									if (er) {
										console.log(`Database ${par.db}:  Collection ${par.coll}:  update error: ${er}`)
										console.log(rec)
										end({err: err.upd})
									} else {
										end(ret)
									}
								})
							} else {
								end(ret)
							}
						})
						.catch(reject)
					
					} else {
						insert()
					}
				})

			} else {
				insert()
			}
			
			// Insert
			function insert() {
console.log( 'insert' )
				arrayID(rec)
				collection.insertOne(rec, (er, res) => {
					if (er) {
						console.log(`Database ${par.db}:  Collection ${par.coll}:  insert error: ${er}`)
						console.log(rec)
						end({err: err.ins})
					} else {
						ret._id = res.insertedId
						end(ret)
					}
				})
			}
		})
	}

	// arrayUpdate
	const arrayUpdate = (rec, cond, prefix, current) => {
		return new Promise((resolve, reject) => {
			const arrflds = objPick(rec, k => Array.isArray(rec[k]))
			if (objEmpty(arrflds)) return resolve()
console.log( `arrayUpdate cond: ${JSON.stringify(cond)}  prefix: ${prefix}`)
console.log(rec)
			
			const values = Object.values(arrflds)
			const flds = Object.keys(arrflds)			
			
			// field
			const field = n => {
				if (n < values.length) {
console.log('field '+n)
					const ar = values[n]
					const f = flds[n]
					const cf = current[f]

					// row
					const row = i => {
						if (i < ar.length) {
console.log('row '+i)
							let st = {}
							const rc = ar[i]
							oid(rc)
console.log(rc)

							if (rc._id) { // update
								if (!cf) {
									console.log('arrayUpdate: current field not found: '+f)
									return field(n+1)
								}
								const idx = cf.findIndex(o => o._id+'' === rc._id+'')
								if (idx < 0) {
									console.log('arrayUpdate: current record not found: '+rc._id)
									return row(i+1)
								}
								const pref = prefix + f + '.' + idx + '.'
								arrayUpdate(rc, cond, pref, cf[idx])
								.then(() => {
									delete rc._id
									for (const p in rc) {
										const v = rc[p]
										if (p === '$inc') {
											const inc = {}
											for (const k in v) inc[pref + k] = v[k]
											st['$inc'] = inc
										} else {
											st[pref + p] = v
										}
									}
console.log('st befor')
console.log(st)
									st = $set(st)
console.log('st after')
console.log(st)
									if (st.$set || st.$unset) {
console.log( 'arrayUpdate: update')
console.log('cond: '+cond)
										collection.updateOne(cond, st, (err, res) => {
											if (err) console.log(err)
											row(i+1)
										})
									} else {
										row(i+1)
									}
								})
								.catch(reject)

							} else { // insert
								rc._id = new ObjectID()
								arrayID(rc)
								st[prefix + f] = rc
console.log( 'arrayUpdate: insert')
console.log(st)
								collection.updateOne(cond, {$push: st}, (err, res) => {
									if (err) console.log(err)
									row(i+1)
								})
							}
						} else {
							field(n+1)
						}
					}
					
					row(0)

				} else {
					for (const k in arrflds) {
						delete rec[k]
					}
					resolve()
				}
			}
			
			field(0)			
		})
	}

	// $set
	const $set = rec => {
		var uns = {}
		for (const k in rec) {
			if (rec[k] === null) { // delete null field
				uns[k] = ""
				delete rec[k]
			}
		}
		const st = {$set: rec}
		if (rec['$inc']) st = rec
		if (!objEmpty(uns)) st.$unset = uns
		if (objEmpty(st.$set)) delete st.$set
//console.log('$set: '+JSON.stringify(st))
		return st
	}

	// arrayID
	const arrayID = rec => {
		for (const f in rec) {
			if (Array.isArray(rec[f])) {
				var ar = rec[f]
				for (let i = 0; i < ar.length; ++i) {
					const rc = ar[i]
					if (!rc._id) {
						rc._id = new ObjectID()
					}
					arrayID(rc)
				}
			}
		}
	}
	
	// promise
	return new Promise(async (resolve, reject) => {
		if (!(par.db && par.coll && data)) return reject({err: err.param})
		
		const dat = (Buffer.isBuffer(data[0])) ? JSON.parse(Buffer.concat(data)) : data
		if (dat.length === 0) return reject({err: err.data})
		datc = objClone(dat)
		const db = await database(par.db).catch(reject)
		if (!db) return
		collection = db.collection(par.coll)
		
		
		// save
		const save = () => {
			if (Array.isArray(dat)) {
				const len = dat.length
				const ret = []
				arrdata(0)

				const arrdata = i => {
					saveRec(dat[i])
					.then(res => {
						ret.push(res)
						if (++i < len) {
							arrdata(i)
						} else {
							resolve(ret)
						}
					})
					.catch(reject)
				}

			} else {
				saveRec(dat)
				.then(res => {
					resolve(res)
				})
				.catch(reject)
			}
		}
		
		par.data = dat		// for trigger to alter data
		trigger('beforeSave', par)
		.then(res => {
			let ids
			if (Array.isArray(datc)) {
				ids = datc.reduce((acc, rec) => {
					if (rec._id) {
						acc.push(new ObjectID(rec._id))
					}
					return acc
				}, [])
			} else if (datc._id) {
				ids = [new ObjectID(datc._id)]
			}
			if (ids && ids[0]) {
				get({db: par.db, coll: par.coll, where: {_id: {$in: ids}}})
				.then(res => {
					par.before = res	// for trigger comparison
					save()
				})
				.catch(reject)
			} else {
				save()
			}
		})
		.catch(reject)		
	})
}




/* 
 * Delete
 * 		par = { db, coll, where }
 */
export const del = par => {
	return new Promise(async (resolve, reject) => {
		delete par.httpRes
		if (!(par && par.db && par.coll && par.where && !objEmpty(par.where))) {
			console.log(`del: Wrong parameters: ${JSON.stringify(par)}`)
			reject({err: err.param})
		}
		
		const db = await database(par.db).catch(reject)
		if (!db) return
		const collection = db.collection(par.coll)

		// _del
		const _del = () => {
			const where = objClone(par.where)
			oid(where)
	
			// Delete embeded array element
			if (par.field) {
				let s = par.field + '._id'
				const	cnd = {}
				const	pull = {}
				const	sp = par.field.split('.')
				cnd[s] = where._id
				s = ''
				for (let i=0; i < sp.length; ++i) {
					if (i > 0) s += '.$.'
					s += sp[i]
				}
				pull[s] = {_id: where._id}
				collection.updateOne(cnd, {$pull: pull}, (er, res) => {
					if (er) return callback({err: err.del})
					var r = res
					trigger('afterDelete', par)
					.then(res => {
						resolve(r)
					}, null, r)
					.catch(reject)
				})
	
			// Delete record
			} else {
				_references(par)
				.then(res => {
					collection.deleteOne(where, {safe: true}, er => {
						if (er) return reject({err: err.del})
						trigger('afterDelete', par)
						.then(res => {
							resolve({})
						})
						.catch(reject)
					})
				})
				.catch(reject)
			}
		}

		trigger('beforeDelete', par)
		.then(res => {
			_del()
		})
		.catch(reject)
	})
}

const _references = par => {
	return new Promise((resolve, reject) => {
		const p = objClone(par)
		p.db = p.app
		p.coll = '_references'
		p.where = {toColl: par.coll}
		get(p)
		.then(res => {
			if (res.length === 0) return resolve(false)
			const refs = res
			
			// check
			const check = i => {
				if (i < 0) return resolve(false)
				const ref = refs[i]
				const p = {
						db: par.db,
						coll: ref.fromColl,
						where: {$or: []},
						result: 'count'
					}
				let w = {}
				if (ref.fromField.substr(-3) == '_id') {
					w[ref.fromField] = where._id
				} else {
					w[ref.fromField] = par.where._id
				}
				p.where.$or.push(w)
				w = {}
				w[ref.fromField + '.val'] = where._id
				p.where.$or.push(w)
				get(p)
				.then(res => {
					if (res.count === 0) {
						check(i-1)
					} else {
						reject({
							err: err.del,
							msg: `${res.count} related records found in ${p.coll}`
						})
					}
				})
				.catch(reject)
			}				
			
			check(refs.length-1)
		})
		.catch(reject)
	})
}




/* 
 * File read/write
 * 		par = { db, _id, filename, mode, path, filetype, options }
 * 		mode: w/wf/r/rf (write / write file / read / read file)
 * 		path: full file path
 * 		options: GridStore options
 */
export const file = (par, request, response) => {
	// end
	const end = dat => {
		response.writeHead(200, {'Content-Type': 'application/json'})
		response.end(JSON.stringify(dat))
	}

	// thumbnail
	const thumbnail = f => {
		// sendThumb
		const sendThumb = bin => {
			if (bin instanceof mongodb.Binary) {
				bin = bin.read(0, bin.length)
			}
			response.writeHead(200, {'Content-Type': f.contentType})
			response.end(bin)
		}
		
		const coll = '_thumbnails'
		get({db: par.db, coll: coll, where: {img_id: par._id, width: par.w}})
		.then(res => {
			if (res[0]) {
				sendThumb(res[0].bin)
			} else {
				const resizer = sharp().resize({width: par.w})
				//resizer.pipe(response)
				resizer.toBuffer()
					.then(data => {
						sendThumb(data)
						post({db: par.db, coll: coll}, {img_id: par._id, width: par.w, bin: data}).then(res => {}) 
					})
					.catch(e => {
						console.log(e)
						end({err: err.file, msg: 'image resize error'})
					})
				gridFS(par, null, resizer)
				.then(res => {
				})
				.catch(e => end(e))
			}
		})
		.catch(e => end(e))
	}

	if (!par.db) return end({err: err.param})

	// Read
	if (par.mode === 'r') {
		const where = par._id ? {_id: par._id} : {filename: par.filename}
		get({db: par.db, coll: 'fs.files', where: where})
		.then(res => {
			if (!res[0]) return end({err: err.file, msg: 'file not found'})
			const f = res[0]
			if (par.w) {
				thumbnail(f)
			} else {
				response.writeHead(200, {'Content-Type': f.contentType})
				gridFS(par, null, response)
				.then(res => {
					response.end()
				})
				.catch(e => end(e))
			}
		})
		.catch(e => end(e))

	// Write
	} else if (par.mode === 'w') {
		gridFS(par, request, null)
		.then(res => {
			end(res)
		})
		.catch(e => end(e))

	} else {
		console.log(`file: Database ${par.db}:  File ${par.filename}:  Mode error, must be w/r`)
		end({err: err.param})
	}
}




/* 
 * GridFS file read/write
 * 		par = { db, _id, filename, mode, path, filetype, options }
 * 		mode: w/wf/r/rf (write / write file / read / read file)
 * 		path: full file path
 * 		options: GridStore options
 */
export const gridFS = (par, readStream, writeStream) => {
	return new Promise(async (resolve, reject) => {
		if (!par.db) return reject({err: err.param})
		oid(par)

		const db = await database(par.db).catch(reject)
		if (!db) return
		
		const bucket = new mongodb.GridFSBucket(db)
		
		// Read
		if (writeStream) {
			let bucketStream
			if (par._id) {
				bucketStream = bucket.openDownloadStream(par._id)
			} else {
				bucketStream = bucket.openDownloadStreamByName(par.filename)
			}
			bucketStream.pipe(writeStream)
			bucketStream.on('error', er => {
					console.log(`gridFS: database ${par.db}:  Cannot read file: ${par.filename || par._id}`)
					console.log(er)
					reject({err: err.file})
				})
				.on('end', () => {
					resolve({})
				})

		// Write
		} else if (readStream) {
			const id = par._id || new ObjectID()
			readStream.pipe(bucket.openUploadStreamWithId(id, par.filename, par.options))
				.on('error', er => {
					console.log(`gridFS: database ${par.db}:  Cannot write file: ${par.filename}`)
					console.log(er)
					reject({err: err.file})
				})
				.on('finish', function() {
					resolve({newid: id})
				})

		} else {
			reject({err: err.param})
		}
	})
}





/* 
 * Convert to ObjectID
 */
const oid = rec => {
	if (rec) {
//console.log('oid: '+JSON.stringify(rec))
		for (const p in rec) {
			if (p.endsWith('_id')) {
				const val = rec[p]
				if (Array.isArray(val)) {
					for (let i=0; i < val.length; ++i) {
						oid(val[i])
					}
				} else if (typeof val === 'string' && hex24.test(val)) {
					rec[p] = new ObjectID(val)
				} else if (typeof val === 'object' && val.$in) {
					const ids = []
					const a = val.$in
					for (let i=0; i < a.length; ++i) {
						const v = a[i]
						if (typeof v === 'string' && hex24.test(v)) {
							ids.push(new ObjectID(a[i]))
						} else {
							ids.push(v)
						}
					}
					val.$in = ids
				} else if (!isNaN(val)) {
					rec[p] = parseInt(val, 10)
				}
			}
			//if ( (p.substr(-3) == '_id' && typeof rec[p] == 'string' && hex24.test(rec[p])) ||
			//(p.substr(-4) == '.val' && typeof rec[p] == 'string' && hex24.test(rec[p])) )
		}
//console.log(rec)
	}
}



/* 
 * Returns one field array
 */
export const subQuery = par => {
	return new Promise((resolve, reject) => {
		if (!par.field) return resolve([])		
		const p = par.field.lastIndexOf('.')
		let	f, ar
		if (p > 0) {
			f = par.field.substr(p + 1)
			ar = par.field.substr(0, p)
		} else {
			f = par.field
		}
		if (ar) {
			par.concat = ar
		}
		get(par)
		.then(res => {
			const ret = []
			for (let i=0, len=res.length; i < len; ++i) {
				const r = res[i]
				const	v = r[f]
				if (r[f]) {
					if (typeof v === 'string' && hex24.test(v)) {
						v = new ObjectID(v)
					}
					ret.push(v)
				}
			}
			resolve(ret)
		})
		.catch(reject)
	})
}





/* 
 * Database triggers
 *		beforeSave, afterSave, beforeDelete, afterDelete 
 */
const trigger = (name, par) => {
	return new Promise((resolve, reject) => {
		if (!par.app) return reject({err: err.param, msg: 'Param app missing'})
//console.log(`trigger: ${name} ${par.coll}`)
		par.script = `triggers.${par.coll}_${name}`
		script(par)
		.then(res => {
			resolve(res)
		})
		.catch(e => {
			if (e.err === err.script) {
				resolve({})
			} else {
				reject(e)
			}
		})
	})
}




