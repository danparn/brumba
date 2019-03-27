/*
 * Brumba
 *
 * © 2012-2016 Dan Parnete
 * Dual licensed under the MIT and GPL licenses.
 */

var MongoClient = require('mongodb').MongoClient,
	GridStore = require('mongodb').GridStore,
	ObjectID = require('mongodb').ObjectID,
	Binary = require('mongodb').Binary,
	_ = require('underscore'),
	fs = require('fs'),
	im = require('imagemagick'),
	U = require('./util'),
	S = require('./srv')

var dbs = [],
	hex24 = new RegExp('^[0-9a-fA-F]{24}$'), // check for hex string of 24 chars
	mongoURL = 'localhost:17270'


function setURL(url) {
	mongoURL = url
}

/* Find opened database, or open it
 */
function dbOpen(dbname, callback) {

	if (!dbname) {
		console.log('dbOpen:  parameters error:  dbname = ' + dbname + '  collname = ' + collname)
		return
	}

	// Look dbs list (opened databases) for this dbname
	for (var i = 0; i < dbs.length; i++) {
		if (dbs[i].databaseName == dbname) { // if found return it
			callback(dbs[i])
			return
		}
	}

	MongoClient.connect('mongodb://' + mongoURL + '/' + dbname, {native_parser: true}, function(err, db) {
		if (err) {
			console.log('err = ' + err)
			console.log('dbOpen: cannot open ' + dbname + ' database')
			callback({
				err: U.err.db
			})
		} else {
			dbs.push(db) // add to dbs list
			callback(db)
		}
	})
}



/* Open collection
	ret = coll, db
*/
function coll(dbname, collname, callback) {
	if (dbname && collname) {
		dbOpen(dbname, function(db) {
			if (db.err) callback(db)
			else {
				db.collection(collname, function(err, coll) {
					if (err) {
						console.log('err = ' + err)
						console.log('Database ' + dbname + ':  Collection not found: ' + collname)
						callback({
							err: U.err.coll
						})
					} else {
						callback(coll, db)
					}
				})
			}
		})
	} else {
		console.log('coll:  parameters error:  dbname = ' + dbname + '  collname = ' + collname)
		callback({
			err: U.err.param
		})
	}
}



/* Get

 par = { db, coll, where, fields/concat, sort, skip, limit, result }
 result = 'cursor'/'count'/'code'
*/
function get(par, callback, res) {
	if (par && par.db && par.coll) {
//console.dir(par, {depth: null})
//var time = process.hrtime()
		coll(par.db, par.coll, function(coll, db) {
			if (coll.err) callback(coll)
			else {
				var where = par.where || {},
					fields = {},
					addf, sp
				if (par.concat) {
					fields[par.concat] = 1
					if (par.add) {
						addf = U.strSplit(par.add, ',')
						for (var j = 0; j < addf.length; j++) fields[addf[j]] = 1
					}
				} else if (typeof par.fields == 'string') {
					sp = U.strSplit(par.fields, ',')
					for (var i = 0; i < sp.length; i++) fields[sp[i]] = 1
				} else _.extend(fields, par.fields)
				if (par.extra) {
					sp = sp.concat(U.strSplit(par.extra, ','))
					for (var i = 0; i < sp.length; i++) fields[sp[i]] = 1
				}
				oid(where)
				if (par.result == 'count') {
					coll.count(where, function(err, count) {
						if (err) {
							console.log('Database ' + par.db + ':  Count error on collection: ' + par.coll)
							callback({
								err: U.err.count
							})
						} else {
							callback({
								count: count
							})
						}
					})
				} else {
					var options = _.pick(par, 'sort', 'skip', 'limit')
					if (!par.sort) options.sort = {
						_id: 1
					}
					var cur = coll.find(where, fields, options)
					if (par.result == 'cursor') {
						//time = process.hrtime( time )
						//console.log( 'cursor time=%ds %dms', time[0], time[1]/1000000 )
						callback(cur)
					} else {
						if (par.concat) {
							var data = []
							cur.batchSize = 1
							cur.each(function(err, doc) {
								if (err) {
									console.log('Database ' + par.db + ':  concat error on collection: ' + par.coll)
									console.log(err)
									cur.close()
									callback({
										err: U.err.data
									})
								} else if (doc == null) {
									callback(data)
								} else if (doc[par.concat]) {
									var arr = doc[par.concat]
									if (par.add) {
										for (var i = arr.length - 1; i > -1; i--) {
											var r = arr[i]
											for (var j = 0; j < addf.length; j++) {
												var f = addf[j]
												if (f in doc) r[f] = doc[f]
											}
										}
									}
									data = data.concat(arr)
								}
							})
						} else {
							cur.toArray(function(err, docs) {
								if (err) {
									console.log('Database ' + par.db + ':  toArray error on collection: ' + par.coll)
									callback({
										err: U.err.data
									})
								} else if (par.result == 'code') { // for client scripts
									if (docs[0] && docs[0].code) {
										var head = {
											'Content-Type': 'application/javascript'
										}
										callback({
												head: head,
												data: docs[0].code
											})
											//callback(docs[0].code)
									} else callback({
										err: U.err.script
									})
								} else {
									//time = process.hrtime( time )
									//console.log( 'get recs=%d   time=%ds %dms   db=%s  coll=%s  where=%s', docs.length, time[0], time[1]/1000000, par.db, par.coll, JSON.stringify(where) )
									//console.log( 'get recs=%d   db=%s  coll=%s  where=%s', docs.length, par.db, par.coll, JSON.stringify(where) )
									callback(docs)
								}
							})
						}
					}
				}
			}
		})
	} else {
		console.log('get: Wrong parameters: ' + JSON.stringify(par))
	}
}



/* Cursor
 */
function cursor(par, callback) {
	par.result = 'cursor'
	get(par, callback)
}



/* Post - insert documents to database
 par = { db, coll }
*/
function post(par, data, callback) {
	if (!par.db || !par.coll || !data) return callback({
		err: U.err.param
	})

	var dat = (Buffer.isBuffer(data[0])) ? JSON.parse(Buffer.concat(data)) : data
	if (dat.length == 0) return callback({
		err: U.err.data
	})
	var datc = U.cloneJSON(dat)
//console.dir(datc, {depth: null})

	coll(par.db, par.coll, function(coll) {
		if (coll.err) callback(coll)
		else {
			//par.data = datc
			par.data = dat		// for trigger to alter data
			trigger('beforeSave', par, function(res) {
				if (res.err) callback(res)
				else before(function() {
					save()
				})
			})
		}

		function save() {
			if (Array.isArray(dat)) {
				var len = dat.length,
					ret = []
				arrdata(0)

				function arrdata(i) {
					saveRec(dat[i], function(res) {
						if (res.err) callback(res)
						else {
							ret.push(res)
							if (++i < len) arrdata(i)
							else {
								par.res = ret
								par.data = datc
								trigger('afterSave', par, function(res) {
									if (res.err) callback(res)
									else callback(ret)
								})
							}
						}
					})
				}

			} else {
				saveRec(dat, function(res) {
					par.res = res
					par.data = datc
					trigger('afterSave', par, function(res) {
						if (res.err) callback(res)
						else callback(par.res)
					})
				})
			}
		}

		function saveRec(rec, callback) {
			var ret = {}
			if (rec._idx >= 0) { // record index assigned by the client data model 
				ret._idx = rec._idx
				delete rec._idx
			}
			oid(rec)

			// Update
			if (rec._id && !par.insert) {
				var cond = {_id: rec._id}
				coll.find(cond).toArray(function(err, res) { // check if exists
//console.log(res)
					if (err) {
						console.log('Database ' + par.db + ':  Collection ' + par.coll + ':  read error: ' + err)
						return callback(err)
					}
					if (res[0]) {
						ret._id = rec._id
						arrayUpdate(rec, cond, '', res[0], function() {
							delete rec._id
							if (!_.isEmpty(rec)) {
//console.log('update')
//console.log(cond)
//console.dir($set(rec), {depth: null})
								coll.update(cond, $set(rec), function(err, res) {
									if (err) {
										console.log('Database ' + par.db + ':  Collection ' + par.coll + ':  update error: ' + err)
										console.log(rec)
										callback({err: U.err.upd})
									} else callback(ret)
								})
							} else callback(ret)
						})
					} else { // force insert
						par.insert = true
						save(rec, callback)
					}
				})

				// Insert
			} else {
				arrayID(rec)
//console.log( 'insert' )
//console.dir(rec, {depth: null})
				coll.insert(rec, function(err, res) {
					if (err) {
						console.log('Database ' + par.db + ':  Collection ' + par.coll + ':  insert error: ' + err)
						console.log(rec)
						callback({
							err: U.err.ins
						})
					} else {
						ret._id = res.insertedIds[0]
						callback(ret)
					}
				})
			}
		}

		function arrayUpdate(rec, cond, prefix, current, callback) {
//console.log( 'arrayUpdate cond: ' + JSON.stringify(cond) + '  prefix: ' + prefix)
//console.dir(rec, {depth: null})
			var arrflds = _.pick(rec, function(value, key) {return _.isArray(value)})
				, values = _.values(arrflds)
				, flds = _.keys(arrflds)
			field(0)

			function field(n) {
				if (n < values.length) {
					var ar = values[n]
						, f = flds[n]
						, cf = current[f]
					row(0)

					function row(i) {
						if (i < ar.length) {
							var set = {}
								, rc = ar[i]
							oid(rc)
//console.log(rc)

							if (rc._id) { // update
								if (!cf) {
									console.log('arrayUpdate: current field not found: '+f)
									return field(n+1)
								}
								var idx = cf.findIndex(o => o._id+'' === rc._id+'')
								if (idx < 0) {
									console.log('arrayUpdate: current record not found: '+rc._id)
									return row(i+1)
								}
								var pref = prefix + f + '.' + idx + '.'
								arrayUpdate(rc, cond, pref, cf[idx], function() {
									delete rc._idx
									delete rc._id
									for (var p in rc) {
										var v = rc[p]
										if (p == '$inc') {
											var inc = {}
											for (var k in v) inc[pref + k] = v[k]
											set['$inc'] = inc
										} else set[pref + p] = v
									}
									set = $set(set)
									if (set.$set) {
//console.log( 'arrayUpdate: update')
//console.log(cond)
//console.log(set)
										coll.update(cond, set, function(err, res) {
											if (err) console.log(err)
											row(i + 1)
										})
									} else {
										row(i + 1)
									}
								})

							} else { // insert
								rc._id = new ObjectID()
								delete rc._idx
								arrayID(rc)
								set[prefix + f] = rc
//console.log( 'arrayUpdate: insert')
//console.dir(set, {depth: null})
								coll.update(cond, {
									$push: set
								}, function(err, res) {
									if (err) console.log(err)
									row(i + 1)
								})
							}
						} else field(n + 1)
					}

				} else {
					for (k in arrflds) delete rec[k]
					callback()
				}
			}
		}

		function $set(rec) {
			var uns = {}
			for (var k in rec) {
				if (rec[k] == null) { // delete null field
					uns[k] = ''
					delete rec[k]
				}
			}
			var set = {
				$set: rec
			}
			if (rec['$inc']) set = rec
			if (!_.isEmpty(uns)) set.$unset = uns
			if (_.isEmpty(set.$set)) delete set.$set
//console.log('$set: '+JSON.stringify(set))
			return set
		}

		function before(callback) {
			var ids
			if (_.isObject(datc)) ids = [new ObjectID(datc._id)]
			else ids = _.reduce(datc, function(memo, rec) {
				if (rec._id) memo.push(new ObjectID(rec._id))
				return memo
			}, [])
			if (ids[0]) {
				get({
					db: par.db,
					coll: par.coll,
					where: {
						_id: {
							$in: ids
						}
					}
				}, function(res) {
					if (!res.err) par.before = res
					callback()
				})
			} else callback()
		}

		function arrayID(rec) {
			for (var f in rec) {
				if (_.isArray(rec[f])) {
					var ar = rec[f]
					for (var i = 0; i < ar.length; i++) {
						var rc = ar[i]
						if (rc._idx >= 0) {
							rc._id = new ObjectID()
							delete rc._idx
						}
						arrayID(rc)
					}
				}
			}
		}

	})
}




/* Database triggers
 *	beforeSave, afterSave, beforeDelete, afterDelete 
 */
function trigger(name, par, callback) {
	if (!par.app) return callback({})
//console.log('trigger: ' + name + ' ' + par.coll)
	par.script = 'triggers.' + par.coll + '_' + name
	S.script(par, function(res) {
		if (res.err == U.err.script) callback({})
		else callback(res)
	})
}




/* Delete
 par = { db, coll, where }
*/
function del(par, callback) {
	delete par.httpRes
	if (par && par.db && par.coll && par.where && !_.isEmpty(par.where)) {
		coll(par.db, par.coll, function(coll, db) {
			if (coll.err) callback(coll)
			else {
				trigger('beforeDelete', par, function(res) {
					if (res.err) callback(res)
					else _del(coll)
				})
			}
		})

		function _del(coll) {
			var where = U.cloneJSON(par.where)
			oid(where)

			if (par.field) {
				// Delete embeded array element
				var s = par.field + '._id',
					cnd = {},
					pull = {},
					sp = par.field.split('.')
				cnd[s] = where._id
				s = ''
				for (var i = 0; i < sp.length; i++) {
					if (i > 0) s += '.$.'
					s += sp[i]
				}
				pull[s] = {
					_id: where._id
				}
				coll.update(cnd, {
					$pull: pull
				}, function(err, res) {
					if (err) callback({
						err: U.err.del
					})
					else {
						var r = res
						trigger('afterDelete', par, function(res) {
							if (res.err) callback(res)
							else callback(r)
						}, null, r)
					}
				})

			} else {
				// Delete record

				var p = U.cloneJSON(par)
				p.db = p.app
				p.coll = 'references'
				delete p.where
				get(p, function(res) {
					if (res.dbret) callback(res)
					else {
						var rel = res
						check(rel.length - 1)

						function check(i) {
							if (i < 0) return remove()
							if (rel[i].toColl != par.coll) check(i - 1)
							else {
								var p = {
										db: par.db,
										coll: rel[i].fromColl,
										where: {
											$or: []
										},
										result: 'count'
									},
									w = {}
								if (rel[i].fromField.substr(-3) == '_id') w[rel[i].fromField] = where._id
								else w[rel[i].fromField] = par.where._id
								p.where.$or.push(w)
								w = {}
								w[rel[i].fromField + '.val'] = where._id
								p.where.$or.push(w)
								get(p, function(res) {
									if (res.count == 0) check(i - 1)
									else callback({
										err: U.err.del,
										msg: res.count + ' related records found in ' + p.coll
									})
								})
							}
						}
					}
				})

				function remove() {
					//return callback({err: U.err.del})
					coll.remove(where, {
						safe: true
					}, function(err) {
						if (err) callback({
							err: U.err.del
						})
						else {
							trigger('afterDelete', par, function(res) {
								if (res.err) callback(res)
								else callback({})
							})
						}
					})
				}
			}
		}

	} else {
		console.log('del: Wrong parameters: ' + JSON.stringify(par))
		callback({
			err: U.err.param
		})
	}
}




/* GridStore file read/write

 par = { db, _id, filename, mode, path, filetype, options }
 mode: w/wf/r/rf (write / write file / read / read file)
 path: full file path
 options: GridStore options
*/
function file(par, data, callback) {
	if (!par.db) return callback({
		err: U.err.param
	})
	oid(par)

	var mode = 'r',
		filename = par._id,
		imgFormat
	if (par.mode[0] == 'w') {
		mode = 'w'
		filename = par.filename
	}

	dbOpen(par.db, function(db) {
		if (db.err) return callback(db)
		new GridStore(db, filename, mode, par.options).open(function(err, gs) {
			if (err) {
				console.log('Database ' + par.db + ':  Cannot open GridStore for: ' + par.filename)
				console.log(err)
				callback({
					err: U.err.file
				})

				// Read stream
			} else if (par.mode == 'r') {
				imgFormat = gs.contentType.substr(gs.contentType.indexOf('/') + 1)
				if (par.w && _.contains(['jpeg', 'png', 'gif'], imgFormat)) thumbnail(gs)
				else send(gs)

				// Write stream
			} else if (par.mode == 'w') {
				if (!data) return callback({
					err: U.err.data
				})
				var len = data.length
				write(0)

				function write(i) {
					gs.write(data[i], function(err, gs) {
						if (err) {
							console.log('Database ' + par.db + ':  Cannot write file: ' + par.filename)
							callback({
								err: U.err.file
							})
						} else if (i < len - 1) {
							write(i + 1)
						} else {
							gs.close(function(err, result) {
								callback({
									newid: result._id
								})
							})
						}
					})
				}

				// Read file
			} else if (par.mode == 'rf') {
				gs.seek(0, function() {
					gs.read(function(err, data) {
						if (err) {
							console.log('Database ' + par.db + ':  Cannot read file: ' + par.filename)
							callback({
								err: U.err.file
							})
						} else {
							callback(data)
						}
					})
				})

				// Write file
			} else if (par.mode == 'wf') {
				gs.writeFile(par.path, function(err, g) {
					gs.close(function(err, res) {
						if (err) {
							console.log('Database ' + par.db + ':  Cannot write file: ' + par.path)
							callback({
								err: U.err.file
							})
						} else {
							callback({
								newid: res._id
							})
						}
					})
				})

			} else {
				console.log('Database ' + par.db + ':  File ' + par.filename + ':  Mode error, must be w/r/s')
			}
		})
	})

	function send(gs) {
		var http = data
		http.writeHead(200, {
			'Content-Type': gs.contentType
		})
		var stream = gs.stream()
		stream.on('data', function(chunk) {
				http.write(chunk)
			})
			.on('end', function() {
				http.end()
			})
	}

	function thumbnail(gs) {
		const coll = '_thumbnails'
		get({
			db: par.db,
			coll: coll,
			where: {
				img_id: par._id,
				width: par.w
			}
		}, function(res) {
			if (res.err) return callback(res)
			if (res[0]) sendThumb(res[0].bin)
			else {
				file({
					db: par.db,
					mode: 'rf',
					_id: par._id
				}, null, function(res) {
					if (res.err) return callback(res)
					im.resize({
							srcData: res,
							width: par.w
						},
						function(err, stdout, stderr) {
							if (err) return callback({
								err: U.file,
								msg: 'imagemagick err: ' + err
							})
							sendThumb(stdout)
							post({
								db: par.db,
								coll: coll
							}, {
								img_id: par._id,
								width: par.w,
								bin: stdout
							}, function(res) {})
						})
				})
			}
		})

		function sendThumb(buffer) {
			var http = data
			if (buffer instanceof Binary) buffer = buffer.read(0, buffer.length)
			http.writeHead(200, {
				'Content-Type': gs.contentType
			})
			http.write(buffer)
			http.end()
		}
	}
}



/* Convert to ObjectID
 */
function oid(rec) {
	if (rec) {
//console.log('oid: '+JSON.stringify(rec))
		for (var p in rec) {
			if (p == '_id') {
				var val = rec[p]
				if (_.isArray(val)) {
					for (var i=0; i < val.length; i+=1) oid(val[i])
				} else if (typeof val == 'string' && hex24.test(val)) {
					rec[p] = new ObjectID(val)
				} else if (typeof val == 'object' && val.$in) {
					var ids = []
						, a = val.$in
					for (var i=0; i < a.length; i+=1) {
						var v = a[i]
						if (typeof v == 'string' && hex24.test(v)) ids.push(new ObjectID(a[i]))
						else ids.push(v)
					}
					val.$in = ids
				}
			}
			//if ( (p.substr(-3) == '_id' && typeof rec[p] == 'string' && hex24.test(rec[p])) ||
			//(p.substr(-4) == '.val' && typeof rec[p] == 'string' && hex24.test(rec[p])) )
		}
	}
}



/* Returns one field array
 */
function subQuery(par, callback) {
	if (par.field) {
		var p = par.field.lastIndexOf('.'),
			f, ar
		if (p > 0) {
			f = par.field.substr(p + 1)
			ar = par.field.substr(0, p)
		} else f = par.field
		if (ar) par.concat = ar
		get(par, function(res) {
			if (res.err) return callback(res)
			var ret = []
			for (var i = 0, len = res.length; i < len; i++) {
				var r = res[i],
					v = r[f]
				if (r[f]) {
					if (typeof v == 'string' && hex24.test(v)) v = new ObjectID(v)
					ret.push(v)
				}
			}
			callback(ret)
		})
	} else callback([])
}








exports.setURL = setURL
exports.dbOpen = dbOpen
exports.coll = coll
exports.cursor = cursor
exports.get = get
exports.post = post
exports.del = del
exports.file = file
exports.ObjectID = ObjectID
exports.subQuery = subQuery