/*
 * Brumba
 *
 * � 2012-2016 Dan Parnete
 * Dual licensed under the MIT and GPL licenses.
 */


function extend(obj, props) {
	for (p in props)
		if (props.hasOwnProperty(p)) obj.prototype[p] = props[p]
}

/*********************************************
 * 				Page object
 *********************************************/
function Page() {}

Page.prototype = {
	name: null, // page name
	tag: null, // html tag
	list: null, // list
	listCols: null, // list columns
	recid: null, // current record id selected from list
	forms: [], // forms list
	tabs: [], // tab list
	srcmode: false, // search mode
	srcond: null, // search condition
	seltab: 0, // selected tab
	insave: false, // page in save operation
	prm: null,
	tickers: [],


	// Call command
	command: function (cmd, i) {
		var self = this
		if (i < this.forms.length && (cmd != 'S' || this.tag.attr('readonly') != 'readonly')) {
			this.forms[i].command(cmd, function (err) {
				if (err) exit()
				else self.command(cmd, i + 1)
			})
		} else {
			if (cmd == 'S') {
				this.command('N', 0)
				this.command('R', 0)
			}
			exit()
		}

		function exit() {
			if (cmd == 'S') self.retrieveList()
		}
	},


	// Find form by name
	findForm: function (name) {
		for (var i = 0, l = this.forms.length; i < l; i++)
			if (this.forms[i].name == name) return this.forms[i]
		return null
	},


	// Find form position by obj or by name
	formPos: function (form, name) {
		for (var i = 0; i < this.forms.length; i++) {
			if (form) {
				if (this.forms[i] == form) return i
			} else {
				if (this.forms[i].name == name) return i
			}
		}
		return -1
	},


	// Retrieve list
	retrieveList: function () {
		if (this.list) {
			if (this.insave) this.list.flexReload()
			else this.list.flexReload(true)
		}
		this.insave = false
	},


	// Search
	search: function () {
		if (this.srcmode) {
			this.srcmode = false
			$('.br-form').css('background', '')
			//console.log( this.forms[0].dataset[0] )
			if (this.forms[0] instanceof Tabular) {
				this.srcond = this.forms[0].dataset[0]
				if (this.srcond) delete this.srcond._idx
				this.forms[0].recs = 0
			} else this.srcond = this.forms[0].modif
			var op = [
					['>=', '$gte'],
					['>', '$gt'],
					['<=', '$lte'],
					['<', '$lt']
				],
				reg = function (val) {
					return {
						'$regex': val,
						'$options': 'i'
					}
				}
			for (var k in this.srcond) {
				var val = this.srcond[k]
				if (typeof val == 'string') {
					var fc = val.charAt(0),
						lc = val.charAt(val.length - 1)
					if (fc == '>' || fc == '<') {
						for (var i = 0; i < op.length; i++) {
							if (val.startWith(op[i][0])) {
								var v = {}
								v[op[i][1]] = parseFloat(val.substr(op[i][0].length))
								this.srcond[k] = v
								i = op.length
							}
						}
					} else if (fc == '*') {
						if (lc == '*') this.srcond[k] = reg(val.substr(1, val.length - 2))
						else this.srcond[k] = reg(val.substr(1) + '$')
					} else if (lc == '*') this.srcond[k] = reg('^' + val.substr(0, val.length - 1))
					else this.srcond[k] = val
				} else this.srcond[k] = val
			}
			this.recid = null
			this.retrieveList()

		} else {
			this.srcmode = true
			$('.br-form').css('background', '#D55')
			this.command('C', 0)
			if (this.forms[0] instanceof Tabular) {
				this.forms[0].dataset = []
				this.forms[0].recs = 1
			}
			if (this.list) this.list.flexAddData({})
		}
	},


	// Delete
	delete: function () {
		if (this.recid) {
			var self = this,
				f = self.forms[0],
				err = $(f).triggerHandler('delete')
			if (!err) {
				deleteDialog(function delFunc() {
						remote(f.querySet('DEL'), function (res) {
							if (res.err < 0) alert('Delete error')
							else {
								self.recid = null
								self.retrieveList()
								self.command('C', 0)
							}
						})
				})
			}
		}
	},


	newrec: function () {
		this.recid = null
		this.command('C', 0)
		this.command('N', 0)
		var self = this
		onNew(0)

		function onNew(i) {
			if (i < self.forms.length) {
				var err = $(self.forms[i]).triggerHandler('new')
				if (!err) onNew(i + 1)
			}
		}
	}
}
/*************** END Page object *************/









/*********************************************
 * 				Form object
 *********************************************/
function Form(name, html) {
	this.name = name // form name
	this.tag = html // html tag

	this.master = null // master of this form
	this.query = null // query 
	this.srcond = null // search condition
	this.dataset = null // recordset, form's data
	this.rec = null // active record
	this.modif = null // modified fields

	this.init()
}

Form.prototype = {

	init: function () {
		this.dataset = []
		var s = this.tag.attr('data-query')
		if (s) this.query = toJSON(mainArgs(s))
		this.load_events()
	},

	// Load events
	load_events: function () {
		$(this).off()
		this.tag.find('button').off()
		var s = this.tag.data('events')
		if (s) eval(s)
	},


	// Form commands
	command: function (cmd, callback) {
		switch (cmd) {
			case 'R':
				this.retrieve(callback);
				break
			case 'S':
				this.save(callback);
				break
			case 'C':
				this.clear();
				callback();
				break
			case 'N':
				this.clear()
				this.dataset = []
				if (this instanceof Tabular) {
					this.recs = 0
					this.disableRows()
				}
				callback()
				break
		}
	},


	// Clear
	clear: function () {
		clearFields(this.tag)
		this.modif = null
		this.rec = null
	},


	// Save record
	save: function (callback) {
		if (this.query && this.query.coll && this.modif && this.tag.attr('readonly') != 'readonly') {
			if (!this.modif._id && this.rec && this.rec._id) this.modif._id = this.rec._id
			if (br.menuid && !this.modif._id) this.modif.type = br.menuid
			if ($(this).triggerHandler('save')) return callback(true)
			else {
				var self = this
				remote(this.querySet('POST'), function (res) {
					if (res.err < 0) return callback(res)
					else {
						if (self == page.forms[0]) {
							if (!page.recid) $('#list').flexReload()
							if (res._id) page.recid = res._id
						}
						callback()
					}
				}, this.modif)
			}
		} else callback()
	},


	// Retrieve
	retrieve: function (callback) {
		var self = this
		if (this.query && (this.query.coll || this.query.script)) {
			var par = self.querySet('GET')
			remote(par, function (res) {
				if (res.err) return ((callback) ? callback(res) : null)
				else {
					self.dataset = res
					self.rec = res[0]
					self.dropdown(function () {
						if ($(self).triggerHandler('retrieve')) self.clear()
						else self.display()
						if (callback) callback()
					})
				}
			})
		} else {
			if (this != page.forms[0]) this.dataset = page.forms[0].dataset
			this.display()
			if (callback) callback()
		}
	},


	// Retrive autocomplete and select data
	dropdown: function (callback) {
		var self = this,
			auto = self.tag.find('input[type="autocomplete"]'),
			sel = self.tag.find('select.br-query-args'),
			n = auto.length + sel.length
		if (n == 0) return end()

		// autocomplete
		auto.each(function () {
			var q = toJSON($(this).attr('data-query')),
				f = $(this).attr('id')
			if (q && q.extra && self.rec && self.rec[f] && self.rec[f].val) { // extra
				var par = {
					cmd: q.cmd || 'GET',
					db: br.db,
					coll: q.coll,
					fields: q.extra,
					where: {
						_id: self.rec[f].val
					}
				}
				remote(par, function (res) {
					if (!res.err && res.length > 0) {
						delete res[0]._id
						_.extend(self.dataset[0], res[0])
					}
					end()
				})
			} else end()
		})

		// select
		sel.each(function () {
			Select(this, end)
		})

		function end() {
			if (--n < 1 && callback) callback()
		}

	},


	// Display data
	display: function () {
		this.clear()
		if (this.dataset.length > 0) {
			this.rec = this.dataset[0]
			displayForm(this.tag, this.rec)
			$(this).triggerHandler('display')
		}
	},


	// Change event for input fields creates modif object
	setChangeField: function () {
		var self = this
		this.tag.find('input,select,textarea').change(function () {
			self.changeField($(this))
		})
	},


	// Set real field value and call modify
	changeField: function (fld) {
		if (typeof fld == 'string') fld = this.tag.find('#' + fld)
		if (!fld[0]) return
		var val = fld.val()

		if (fld.is('input:checkbox')) { // checkbox
			if (fld.is(':checked')) val = true
			else val = false
		} else if (val == '') val = null
		else if (fld.is('select')) {
			var op = fld.find('option[value="' + val + '"]')
			if (op.attr('type') == 'number') val = parseInt(val, 10)
		} else if (fld.is('.br-number')) { // number
			val = fld.data('val')
		} else if (fld.is('.br-date')) {
			val = inputDate(val, true)
			fld.val(strDate(val))
		} else if (fld.is('.br-datetime')) {
			val = inputDate(val)
			fld.val(strDate(val, true))
		} else if (fld.is('input[type="autocomplete"]') || fld.is('input[type="filelink"]') ||
			fld.is('input[type="image"]')) { // autocomplete, filelink, image
			if (val != '') val = {
				txt: val,
				val: fld.data('id')
			}
		} else if (fld.is('input[type="password"]') && fld.attr('id') == 'password') {
			if (validPass(val)) val = sha256_digest(val)
		}

		this.modify(fld, val)
	},


	// Add value in modif
	modify: function (field, value) {
		var m = this.master || this,
			name = $(field).attr('id')

		if (m instanceof Tabular) {
			m.rec[name] = value
			if (!m.rec._idx) m.rec._idx = m.selrow + m.row0
		} else {
			if (!m.modif) m.modif = {} // create modif
			if (m.rec && m.rec._id) m.modif._id = m.rec._id // set _id
			m.modif[name] = value
		}
	},


	// Query string
	querySet: function (cmd, fields, noid) {
		var q = cloneJSON(this.query) || {}
		if (cmd == 'POST') q.cmd = cmd
		else if (q.script) q.cmd = 'SRV'
		else q.cmd = cmd
		q.app = br.app
		if (!q.db) q.db = br.db

		if (!fields) delete q.fields

		for (var k in q.where) {
			if (q.where[k] == '$recid') {
				q.where[k] = page.recid
				noid = true
			}
		}

		if (!noid && page.recid && !(q.where && q.where._id)) {
			q.where = {
				_id: page.recid
			}
		} else if (page.srcond) {
			if (q.where) {
				delete q.where._id
				$.extend(q.where, page.srcond)
			} else q.where = page.srcond
		}

		return q
	},


	// Reset data
	reset: function () {
		this.dataset = null
		this.rec = null
		page.recid = null
		if (this instanceof Tabular) this.recs = 0
	}

}
/*************** END Form object *************/








/*********************************************
 * 				Tabular object
 *********************************************/
function Tabular(name, html) {
	this.rows = null
	this.row0 = 0
	this.selrow = 0
	this.iconDel = null
	this.field = null
	this.scroll = null
	this.scrollval = -1
	this.scrollDisabled = false
	this.wheelStep = 0
	this.res = null
	this.recs = 0
	this.noRetrieve = false
	this.canDelete = false
	this.totalBand = null

	Form.call(this, name, html)
}

Tabular.prototype = Object.create(Form.prototype)

extend(Tabular, {

	init: function () {
		Form.prototype.init.apply(this) // call super

		var self = this,
			frm = this.tag
		if (this.query) {
			var field = this.query.field || this.query.concat
			if (field && !this.query.coll) {
				var p = field.lastIndexOf('.')
				if (p > 0) this.field = field.substr(p + 1)
				else this.field = field
			}
		}

		this.totalBand = this.tag.find('.br-total')

		// Scrollbar
		this.scroll = $('<div class="br-scrollbar" />').slider({
			orientation: "vertical",
			min: 0,
			max: 0,
			value: 0,
			change: function (ev, ui) {
				scrolled(ui.value)
			}//,
			//slide : function(ev, ui)  {scrolled(ui.value)}
		})
		frm.append(this.scroll)

		function scrolled(value) {
			self.scrollval = value
			if (!self.scrollDisabled && !self.noRetrieve && self.scrollval > -1) {
				self.scrollDisabled = true
				self.row0 = (self.recs > 0) ? self.recs - self.scrollval - 1 : 0
				self.scrollval = -1
				if (self.query && self.query.coll) {
					var b = self.row0
						, e = b + self.rows.length - 1
						, d = self.dataset
					if (e >= self.recs) e = self.recs - 1
					if (!d[b] || !d[e]) {
						if (d[b]) {
							while (!d[e - 1]) e--
							self.query.skip = e
						} else if (d[e]) {
							while (!d[b]) b++
								self.query.skip = b - self.query.limit
						} else self.query.skip = b
						if (self.query.skip < 0) self.query.skip = 0
						self.retrieve(function(res) {self.display()})
					} else self.display()
				} else self.display()
				setTimeout(function () {
					self.scrollDisabled = false
				}, 150)
			}
		}

		// Mouse wheel
		frm.mousewheel(function (ev, step) {
			self.wheelStep += step
			setTimeout(function () {
				if (self.wheelStep) {
					self.scroll.slider('value', self.scroll.slider('value') + self.wheelStep)
					self.wheelStep = 0
				}
			}, 150)
			return false
		})

		// Delete icon
		this.iconDel = $('<span class="ui-icon ui-icon-trash" style="position: absolute; left: -10px; top: 2px"></span>').click(function () {
			deleteDialog(function () {
				var q = self.querySet('DEL')
				q.where = {
					_id: self.rec._id
				}
				if (self.query.field) {
					var mas = self.master
					while (!mas.query.coll) mas = mas.master
					q.coll = mas.query.coll
				}
				remote(q, function (res) {
					if (res.err < 0) alert('Delete error')
					else {
						self.dataset.splice(self.selrow + self.row0, 1)
						self.recs--
							self.display()
					}
				})
			})
		})

		this.canDelete = !this.tag.attr('readonly') && !this.tag.attr('disabled') && page.prm.indexOf('d') >= 0
	},


	// Set scrollbar
	scrollbarInit: function () {
		var max = this.recs - 1
		this.scroll.slider('option', {
			'max': max,
			'value': max
		})
	},


	// Add rows
	addRows: function (n) {
		var frm = this.tag
		this.rows = []
		this.rows[0] = this.tag.find('.br-detail')
		this.rows[0].data('row', 0)
		this.rows[0].find('input,select,textarea').each(function () {
			if ($(this).prop('disabled')) $(this).attr('br-disabled', 'true')
		})
		if (!n || n < 1) {
			var fh = parseInt(frm.css('height'), 10) - 20,
				hh = parseInt(frm.find('.br-header').css('height'), 10),
				dh = parseInt(this.rows[0].css('height'), 10),
				th = parseInt(frm.find('.br-total').css('height'), 10)
			if (fh <= 100) {
				p = frm.parent()
				while (!p.hasClass('br-tabs')) p = p.parent()
				if (p.hasClass('br-tabs')) fh = p.data('height')
			}
			var n = Math.floor((fh - hh - th) / dh) - 1
			//console.log( '%s    fh=%d  hh=%d  dh=%d  th=%d  n=%d', this.name, fh, hh, dh, th, n )
		}
		for (var i = 1; i <= n; i++) {
			this.rows[i] = this.rows[0].clone()
			$(this.tag).append(this.rows[i])
			this.rows[i].data('row', i)
		}

		// Scrollbar position
		var rm = 0 // rigth margin
		frm.find('.br-field').each(function () {
			var $this = $(this),
				r = parseInt($this.css('left'), 10) + parseInt($this.css('width'), 10)
			if (r > rm) rm = r
		})
		this.scroll.css('left', rm + 10).css('top', hh).height(fh - hh - th)

		// Active row
		var self = this
		this.tag.find('input,select,textarea').focus(function () {
			self.selectRow($(this).parent().data('row'))
		})

		this.disableRows()
	},


	// Clear
	clear: function () {
		//console.log( 'clear ' + this.name )
		for (var i = 0; i < this.rows.length; i++) clearFields(this.rows[i])
		this.modif = null
		this.rec = null
		this.selectRow(-1)
	},


	// Select row
	selectRow: function (row) {
		this.selrow = row
		for (var i = 0; i < this.rows.length; i++)
			if (this.rows[i].hasClass('br-selected-row'))
				this.rows[i].removeClass('br-selected-row')
		if (this.selrow > -1) {
			this.rows[this.selrow].addClass('br-selected-row')
			if (this.canDelete) this.rows[this.selrow].append(this.iconDel)
			if (this.dataset) this.rec = this.dataset[this.row0 + this.selrow]
			$(this).triggerHandler('rowselected')
		} else {
			this.iconDel.detach()
		}
		cascade(this)

		function cascade(form) {
			for (var i = page.formPos(form) + 1; i < page.forms.length; i++) {
				if (page.forms[i].master == form) {
					page.forms[i].retrieve(function () {
						cascade(page.forms[i])
					})
				}
			}
		}
	},


	// Retrieve
	retrieve: function (callback) {
		//console.log('retrieve ' + this.name)
		if (!this.query) return ((callback) ? callback() : null)
		var self = this

		if (this.query.coll || this.query.script) { // query
			this.noRetrieve = true
			var par = this.querySet('GET')
			if (this.recs == 0) par.result = 'count'
			remote(par, function (res) {
				if (res.err) return ((callback) ? callback(res) : null)
				if (self.recs == 0) { // count
					self.recs = res.count
					self.dataset = new Array(self.recs)
					self.query.skip = 0
					if (!self.query.limit) self.query.limit = 50
					self.scrollbarInit()
					if (self.recs > 0) self.retrieve(callback)
					else {
						self.clear()
						if (callback) callback()
					}
				} else {
					self.res = res
					if (self.res.length > 0) {
						// Set data
						for (var i = self.query.skip, j = 0; j < self.res.length; i++, j++) {
							self.dataset[i] = self.res[j]
						}
					}
					trig()
				}
			})

		} else if (this.query.field) { // field
			if (this.master.rec && this.master.rec[this.field])
				this.dataset = this.master.rec[this.field]
			else this.dataset = []
			this.recs = this.dataset.length
			self.scrollbarInit()
			trig()

		} else if (this.query.concat) { // concat
			this.dataset = []
			if (this.master.rec) {
				for (var i = 0; i < this.master.recs; i++) {
					var rec = this.master.dataset[i],
						arr = rec[this.field]
					if (arr) {
						if (this.query.add) { // add
							var sp = strSplit(this.query.add, ',')
							for (var j = arr.length - 1; j >= 0; j--) {
								var rc = arr[j]
								for (var k = 0; k < sp.length; k++) rc[sp[k]] = rec[sp[k]]
							}
						}
						this.dataset = this.dataset.concat(arr)
					}
				}
			}
			this.recs = this.dataset.length
			self.scrollbarInit()
			trig()
		}

		function trig() {
			if ($(self).triggerHandler('retrieve')) {
				self.clear()
				if (callback) callback()
			} else {
				if (self.query.reorder) self.reorder()
				self.dropdown(function () {
					self.display()
					self.noRetrieve = false
					if (callback) callback()
				})
			}
		}
	},


	// Display
	display: function () {
		this.clear()
		for (var i = this.row0, j = 0; i < this.recs && j < this.rows.length; i++, j++) {
			displayForm(this.rows[j], this.dataset[i])
		}
		this.disableRows()
		this.totals()
		$(this).triggerHandler('display')
		//this.selectRow(this.selrow)
	},


	// Save
	save: function (callback) {
		if (this.query && this.query.coll && this.modif) {
			if (br.menuid) {
				for (var i = 0; i < this.modif.length; i++) {
					this.modif[i].type = br.menuid
				}
			}
			if ($(this).triggerHandler('save', this.modif)) return callback()
			else {
				remote(this.querySet('POST'), function (res) {
					if (res.err < 0) return callback(res)
					else callback()
				}, this.modif)
			}
		} else callback()
	},


	// Modified field
	modify: function (field, value) {
		var i = $(field).parent().data('row') + this.row0 // record index in data
			,
			name = $(field).attr('id')

		// data
		if (!this.dataset[i]) {
			this.dataset[i] = {}
			this.recs = this.dataset.length
			this.disableRows()
		}
		var r = this.dataset[i],
			modif
		r[name] = value
		modif = {_idx: i} // _idx is the index of the modified row
		if (r._id) modif._id = r._id
		modif[name] = value

		// master
		if (this.master && this.master != this) addToMaster(this.master, this.query.field)
		else set(this)
		// total
		this.checkTotal(field)

		function addToMaster(mas, qfield) {
			var isTabular = mas instanceof Tabular,
				p = (qfield) ? qfield.lastIndexOf('.') : 0,
				qf = (p > 0) ? qfield.substr(p + 1) : qfield,
				mo = {}
			if (isTabular) mo._idx = mas.selrow + mas.row0
			if (mas.rec && mas.rec._id) mo._id = mas.rec._id
			mo[qf] = [modif]
			modif = mo

			if (mas.master && mas.master != mas) addToMaster(mas.master, mas.query.field)
			else set(mas)
		}

		function set(form) {
			var isTabular = form instanceof Tabular,
				rec
			if (!form.modif) {
				rec = modif
				form.modif = (isTabular) ? [rec] : rec
			} else {
				if (isTabular) {
					rec = _.find(form.modif, function (r) {return r._idx == modif._idx})
					if (rec) objExtend(rec, modif)
					else form.modif.push(modif)
				} else objExtend(form.modif, modif)
			}
//console.log(form.modif)
		}

		function objExtend(target, source) {
			if (!target || !source) return
//console.log('target: ' + JSON.stringify(target))
//console.log('source: ' + JSON.stringify(source))

			for (var k in source) {
				var s = source[k]
				if (!target[k]) target[k] = s
				else if (Array.isArray(s)) {
					var t = target[k]
					for (var i = 0; i < s.length; i++) {
						var r = _.find(t, function (r) {	return r._idx == s[i]._idx})
//console.log('r: '  + JSON.stringify(r))
						if (r) objExtend(r, s[i])
						else t.push(s[i])
					}
				} else target[k] = s
			}
//console.log('result: ' + JSON.stringify(target))
		}
	},


	// Disable empty rows
	disableRows: function () {
		var n = this.recs - this.row0 + ((this.tag.attr('readonly') != 'readonly') ? 1 : 0)
		for (var i = 0; i < this.rows.length; i++) {
			var r = this.rows[i]
			if (i < n) r.show()
			else r.hide()
		}
		if (this.totalBand) {
			this.totalBand.css('top', parseInt(this.tag.find('.br-header').css('height'), 10) +
				n * parseInt(this.rows[0].css('height'), 10) + 3)
		}
	},


	// Reorder dataset
	reorder: function () {
		var ord = []
		for (var k in this.query.reorder) {
			var o = {
					field: k,
					ord: this.query.reorder[k]
				},
				f = this.rows[0].find('select#' + k)
			if (f[0]) o.select = f
			ord.push(o)
		}
		this.dataset.sort(function (a, b) {
			for (var i = 0; i < ord.length; i++) {
				var f = ord[i].field,
					va = a[f],
					vb = b[f]
				if (ord[i].select) {
					va = ord[i].select.find('option[value=' + va + ']').text()
					vb = ord[i].select.find('option[value=' + vb + ']').text()
				}
				if (va > vb) return 1 * ord[i].ord
				else if (va < vb) return -1 * ord[i].ord
			}
			return 0
		})
	},


	// totals
	totals: function () {
		if (this.totalBand) {
			var self = this
			this.totalBand.find('input').each(function () {
				self.total($(this), $(this).attr('data-formula'))
			})
		}
	},


	// field total
	total: function (tfld, formula) {
		var v = 0
		if (formula) {
			v = _.reduce(this.dataset, function (memo, r) {
				if (r) {
					var expr = formulaValues(r, formula)
					if (expr) {
						try {
							var ex = eval(expr)
							if (ex || ex == 0) return memo += ex
						} catch (e) {
							console.log(e)
						}
					}
				}
				return memo
			}, 0)
		} else {
			v = _.reduce(this.dataset, function (memo, r) {
				if (r) memo += r[tfld.attr('id')]
				return memo
			}, 0)
		}
		if (tfld.is('.br-number')) {
			tfld.data('val', v)
			numberField(tfld)
		} else if (tfld.is('.br-time')) {
			tfld.val(strTime(v))
		} else tfld.val(v)
	},


	// check field for total
	checkTotal: function (field, formula) {
		var self = this,
			id = field.attr('id')
		if (field.is('.br-number, .br-time')) {
			var tfld = this.totalBand.find('#' + id)
			if (tfld.length > 0) this.total(tfld, formula)
			// related computed fields
			var par = field.parent(),
				computed = par.find('input[data-formula]')
			computed.each(function () {
				var formula = $(this).attr('data-formula')
				if (formula.indexOf('#' + id) > -1) self.checkTotal($(this), formula)
			})
		}
	},

	handFill: function (data) {
		if (Array.isArray(data) && data.length > 0) {
			this.dataset = data
			this.recs = data.length
			this.display()
			this.scrollbar()
		}
	}
})
/*************** END Tabular object *************/









/*********************************************
 * 				Autocomplete
 *********************************************/
function Autocomplete(input) {
	var query = input.attr("data-query")
	if (query) {
		var q = toJSON(query)
			, fld = strSplit(q.fields, ',')
			, p = fld.indexOf(',')
			, data

		if (q.script) q.cmd = 'SRV'
		else q.cmd = 'GET'
		_.extend(q, _.pick(br, ['db', 'app', 'usercode']))
		if (!q.where) q.where = {}

		input.autocomplete({
			minLength: 3,
			delay: 0,

			source: function (request, response) {
				q.where[fld[0]] = {
					'$regex': request.term,
					'$options': 'i'
				}
				remote(q, function (res) {
					if (!res.err) {
						data = res
						response(_.map(res, function (item) {
							return {
								id: item._id,
								label: _.reduce(fld, function (memo, f) {
									var txt = false
									if (f.substr(-4) == '.txt') {
										txt = true
										f = f.substr(0, f.length - 4)
									}
									if (item[f]) {
										if (memo.length > 0) memo += ' - '
										if (txt) memo += item[f]['txt']
										else memo += item[f]
									}
									return memo
								}, '')
							}
						}))
					}
				})
			},

			select: function (ev, ui) {
				if (ui.item) {
					input.data("id", ui.item.id)
					var form = input.parent()
						, rec = _.find(data, function (r) {return r._id == ui.item.id})
					input.data('record', rec)
					displayForm(form, rec)	// for extra fields
					input.trigger('change')
				} else {
					input.removeData("id")
					input.removeData('record')
				}
			},

			/*change: function (ev, ui) {
				if (ui.item) input.trigger('change')
			},*/

			response: function (ev, ui) {
				if (ui.content.length == 0) {
					alert(translate('Not found') + ': ' + input.val())
					input.val('')
				}
			}
		})
	}
}
/*************** END Autocomplete *************/








/*********************************************
 * 				Select
 *********************************************/
function Select(elem, callback) {
	var self = $(elem)
		, query = self.attr('data-query')
	if (!callback) callback = function() {return}
	
	if (query) {
		var q = toJSON(query)
		if (!q) return callback()

		if (Array.isArray(q)) { // array of data
			self.append('<option value=""></option>')
			for (var i = 0, len = q.length; i < len; i++) {
				var s = q[i].txt || q[i].val+''
				s = translate(s, br.lang)
				self.append('<option value="' + q[i].val + '">' + s + '</option>')
			}
			return callback()

		} else {
			q.db = br.db
			q.app = br.app
			if (self.hasClass('br-query-args') && !substArgs(q.where, self)) return callback()

			if (q.coll) {
				q.cmd = 'GET'
				remote(q, function (res) {
					if (res.err) return callback()
					self.data('dataset', res)
					populateSelect(self, res)
					callback()
				})

			} else if (q.script) { // already formated from server script 
				q.cmd = 'SRV'
				q.app = br.app
				remote(q, function (res) {
					if (res.err) return callback()
					if (res.html) {
						self.append(res.html)
						callback()
					} else {
						self.data('dataset', res)
						populateSelect(self, res)
						callback()
					}
				})
			} else callback()
		}
	} else callback()

}


function populateSelect(elem, dataset) {
	var fields = elem.attr('data-fields')
		, fld = strSplit(fields, ',')
		, q = toJSON(elem.attr('data-query'))
		, txt = ''
	if (!fields || !q) return
	
	elem.empty()
	elem.append('<option></option>')
	for (var i = 0, len = dataset.length; i < len; i++) {
		var r = dataset[i]
		txt = ''
		for (var j = 1; j < fld.length; j++) {
			var fl = fld[j],
				sep = ''
			if (j > 1) {
				if (fld[j].charAt(0) == '+') {
					fl = fld[j].substr(1)
					sep = ' '
				} else {
					sep = ' - '
				}
			}
			if (r[fl]) {
				txt += sep
				txt += r[fl]
			}
		}
		var val = r[fld[0]],
			typ = (typeof val == 'number') ? 'type="number" ' : '',
			opt = $('<option ' + typ + 'value="' + val + '">' + txt + '</option>')
		if (q.group || q.groupsel) {
			if (_.find(dataset, function (el) {
					return el[fld[0]].indexOf(val + '.') == 0
				})) {
				opt.addClass('br-optgroup')
				if (!q.groupsel) opt.prop('disabled', true)
			}
			var p = val.match(new RegExp('.', 'g'))
			if (p) {
				opt.css('padding-left', p.length * 5 + 'px')
			}
		}
		elem.append(opt)
	}
}
/*************** END Select *************/