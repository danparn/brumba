/*
 * Brumba
 *
 * © 2012-2016 Dan Parnete
 * Dual licensed under the MIT and GPL licenses.
*/


var httpErr = {
		404: 'Not Found',
		500: 'Internal Server Error',
		501: 'Not Implemented',
		502: 'Bad Gateway',
		503: 'Service Unavailable',
		504: 'Gateway Time-out',
		505: 'HTTP Version not supported'
	}

	, decimalSeparator = (1.1).toLocaleString().substring(1, 2)




/* Remote ajax request
*/
function remote( param, callback, dat ) {
//console.time('remote')
	var to = setTimeout( function () {	
		if ( window.loadingIndicator )  loadingIndicator.show()
	}, 500)
	
	if ( typeof br !== 'undefined' ) {
		if ( !param.usercode ) param.usercode = br.usercode
		if ( !param.app ) param.app = br.app
		if ( !param.db ) param.db = br.db
	}
	if ( !param.cmd && param.script ) param.cmd = 'SRV'
	
	var ajax = {
		url: '/brumba?' + JSON.stringify(param),
		timeout: 60000,
		success: function(res) {
			clearTimeout(to)
			if ( window.loadingIndicator )  loadingIndicator.fadeOut()
//console.timeEnd('remote')
			if ( res.err ) remoteError(res)
			callback(res)
		},
		error: function(jqXHR, textStatus, errorThrown) {
			clearTimeout(to)
			if ( window.loadingIndicator )  loadingIndicator.fadeOut()
			var msg = 'Remote error:  '
			if ( jqXHR.status )  msg += httpErr[jqXHR.status]
			alert(msg)
			callback({err: msg})
		}
	}
	if ( dat ) {
		ajax.data = (param.filename) ? dat : JSON.stringify(dat)
		ajax.contentType = (param.filename) ? param.options.content_type : 'application/json'
		ajax.processData = false
		ajax.type = 'POST'
	} else {
		ajax.type = 'GET'
	}
	
	$.ajax(ajax)
}



/* Remote error
*/
function remoteError( res ) {
	if ( res.err ) {
		var msg
		switch ( res.err ) {
		  case -1: msg = 'database not found'; break
		  case -2: msg = 'collection not found'; break
		  case -3: msg = 'not unique field'; break
		  case -4: msg = 'count error'; break
		  case -5: msg = 'cursor error'; break
		  case -6: msg = 'insert error'; break
		  case -7: msg = 'update error'; break
		  case -8: msg = 'delete error'; break
		  case -9: msg = 'file error'; break
		  case -10: msg = 'duplicate record'; break
		  case -11: msg = 'wrong parameters'; break
		  case -12: msg = 'wrong data'; break
		  case -13: msg = 'generic error'; break
		  case -14: msg = 'server error'; break
		  case -15: msg = 'script not found'; break
		  case -16: msg = 'user not authenticated'; break
		  case -17: msg = 'trigger error'; break
		  case -18: msg = 'socket error'; break
		  default: msg = 'unknown error'
		}
		var s = 'Error: ' + msg
		if ( res.msg ) s += '\n\n' + res.msg
		alert(s)
	}
}



/* Accodion menu
*/
function accordionMenu( callback ) {
	$('.accordion ul li[data-item]').addClass('menu-item')
	
	var submenu = $('.accordion > li > ul')
		, head = $('.accordion > li > a')
		, inter = $('.accordion ul li ul')
		, interhead = inter.parent().find('> a').addClass('inter-menu')
	
	head.on('click', function(ev) {
		ev.preventDefault()
		if ( !$(this).hasClass('active') ) {
			submenu.slideUp(0)
			$(this).next().stop(true,true).slideToggle(0)
			head.removeClass('active')
			$(this).addClass('active')
		}
	})
	
	interhead.on('click', function(ev) {
		ev.preventDefault()
		if ( !$(this).hasClass('active') ) {
			inter.slideUp(0)
			$(this).next().stop(true,true).slideToggle(0)
			interhead.removeClass('active')
			$(this).addClass('active')
		}
	})

	$('.accordion li[data-item]').click( function() {
		$('.accordion li.selected-menu').removeClass('selected-menu')
		$(this).addClass('selected-menu')
		callback($(this).attr('data-item'), $(this).attr('data-prm'))
	})
}





/*********************************************
 * 				File
 *********************************************/
/* File upload
*/
function fileUpload( db, callback ) {
	if ( !db )  return callback({dbret: dbErr.param})
	var f = $('<input type="file" style="display: none" />')
	
	$('body').append(f)
	
	f.change( function() {
		var file = f[0].files[0]
		var par = {cmd: 'FILE', mode: 'w', db: db, filename: file.name,
				options: {
					content_type: file.type,
					metadata: {
						lastModified: file.lastModifiedDate
					}
				}
			}
		remote(par, function(res) {
			if ( res.newid )  res.filename = file.name
			//f.remove()
			callback(res)
		}, file)
	})
	
	f.click()
}


/* File Download
*/
function fileDownload( db, id, callback ) {
	if ( !db || !id )  return callback({dbret: dbErr.param})
	var par = {cmd: 'GET', db: db, coll: 'fs.files', where: {_id: id}}
	remote(par, function(res) {
		if ( res.dbret )  callback(res)	// returns error
		else {
			var desc = res
			, par = {cmd: 'FILE', mode: 'r', db: db, _id: id}
			remote(par, function(res) {
				if ( res.dbret )  callback(res)	// returns error
				else  callback(desc, res)
			})
		}
	})
}


/* File show
*/
function fileShow( id ) {
	if ( id ) {
		var par = {cmd: 'FILE', mode: 'r', db: br.db, _id: id, usercode: br.usercode}
		window.open('/brumba?' + JSON.stringify(par))
	}
}



/* Image load
*/
function imgLoad( db, img ) {
	if ( db && img ) {
		var id = img.attr('data-id')
		if ( id ) {
			var par = {cmd: 'FILE',	mode: 'r', db: db, _id: id, usercode: br.usercode}
			img.attr('src', '/brumba?' + JSON.stringify(par))
		}
	}
}



/* File Open dialog icon
*/
function fileOpenIco( elem, img ) {
	var ico = $('<span class="ui-icon ui-icon-folder-open" style="position: absolute"></span>')
		, l = parseInt(elem.css('left'), 10) + 2
	if ( !img ) l += parseInt(elem.css('width'), 10) - parseInt(ico.css('width'), 10)
	ico.css({top: elem.css('top'), left: l, 'z-index': 2})
	if ( elem.prop('disabled') ) ico.hide() 
	elem.parent().append(ico)
	ico.click( function() {
		fileUpload(br.db, function(res) {
			elem.data('id', res.newid)
			elem.val(res.filename)
			elem.trigger('change')
			var q = {cmd: 'FILE',	mode: 'r', db: br.db, _id: res.newid, usercode: br.usercode}
			elem.attr('src', '/brumba?' + JSON.stringify(q))
		})
	})
	return ico
}



/* File from db
*/
function fileFromDb( par, callback ) {
	var q = {cmd: 'GET', db: par.db || br.db, coll: 'fs.files'}
	if ( par.type ) q.where = {contentType: {$regex:'^'+par.type}}
	remote(q, function(res) {
		if ( res.dbret ) alert(res)
		else {
			var dat = [],
				len = res.length
			for ( var i=0; i < len; i++ )  dat.push({id:res[i]._id, text:res[i].filename})
			listBox('Files', dat, function(ui) {
				callback({id: ui.item[0].id, filename: ui.item[0].textContent})
			})
		}
	})
}
/*************** END File *************/









/*********************************************
 * 				ListBox
 *********************************************/
function listBox( title, dat, handler ) {
	if ( dat && dat.length > 0 && handler ) {
		var ul = $('<ul></ul>')
			, len = dat.length
			, dlg = $('<div/>')
		for ( var i=0; i < len; i++ ) {
			ul.append('<li id="' + dat[i].id + '"><a href="#">' + dat[i].text + '</a></li>')
		}
		dlg.append(ul)
		dlg.attr('title', title)
		dlg.dialog({
			close: function() {
					$(this).remove()
				}
		})
		ul.menu({
			select: function(ev, ui) {
				handler(ui)
				dlg.dialog('close')
				dlg.remove()
			}
		})
	}
}
/*************** END ListBox *************/







/*****************************************************
 *										Form
 *****************************************************/

/* Replace main arguments
*/
function mainArgs ( str ) {
	if ( str ) {
		var qs = strRep(str, '$username', br.username)
			, uid = ( isNaN(br.userid) ) ? '"'+br.userid+'"' : br.userid
		qs = strRep(qs, '$userid', uid)
		if ( br.menuid )  qs = strRep(qs, '$menuid', br.menuid)
		qs = strRep(qs, '$menusort', br.menusort)
		return qs
	}
}



/* Substitutes retrieve arguments
*/
function substArgs ( where, elem ) {
	if ( where ) {
		var dat = page.forms[0].dataset[0]
			, ok = true
		for ( k in where ) {
			if ( typeof where[k] == 'string' && where[k].charAt(0) == '#' ) {
				var v = null
				if ( elem ) v = fieldVal(elem.parent().find(where[k]))
				if ( !v && dat ) v = dat[where[k].substr(1)]
				if ( v ) where[k] = v
				else {
					delete where[k]
					ok = false
				}
			}
		}
		return ok
	}
	return false
}



/* Field value
*/
function fieldVal( fld ) {
	if ( fld ) {
		if ( fld.is('input:checkbox') ) {		// checkbox
			if ( fld.is(':checked') ) return true
			else return false
		} else if ( fld.is('.br-number') ) {
			return fld.data('val') || 0
		} else if ( fld.is('input[type="autocomplete"]') ) {
			return fld.data('id')
		} else if ( fld.is('.br-time') ) {
			return inputTime(fld.val())
		} else return fld.val()
	}
	return null
}



/* Set textarea for use of TAB char
*/
function textareaInsTab( elem ) {
	elem.keypress( function(ev) {
		var keyCode = e.keyCode || e.which

		if ( keyCode == 9 ) {
			e.preventDefault()
			var start = $(this).get(0).selectionStart
				end = $(this).get(0).selectionEnd

			$(this).val($(this).val().substring(0, start) + "\t"	+ $(this).val().substring(end))

			$(this).get(0).selectionStart =
			$(this).get(0).selectionEnd = start + 1;
		}
	})
}



function outerHtml( elem ) {
	return $('<div>').append(elem.clone()).html()
}


function delClassMatch( elem, pat ) {
	var cls = elem.attr('class'),
		spc = cls.split(/\s*/),
		sp = strSplit(pat, ','),
		cls = ''
	for ( var i=0; i < spc.length; i++ ) {
		var found = false
		for ( var j=0; j < sp.length; j++ )
			if ( spc[i].indexOf(sp[j]) >= 0 )  found = true
		if ( !found ) {
			if ( cls.length > 0 )  cls += ' '
			cls += spc[i]
		}
	}
	elem.attr('class', cls)
}


/* Convert input string to datetime
	accepted format:
	+ : today
 	d : day d of current month
 	d.m :  day d of month m current year
 	d h : day and hour
 	d.m h.n : day/month hour:minute 
*/function inputDate( str, xml ) {
	if ( str ) {
		if ( str.charAt(0) == '+' )  {
			var d  = Date.now()
			if (str == '+') return d
			else {
				var n = parseInt(str.substring(1), 10)
				return d + n * 24 * 3600000
			}
		}
		
		var pars = function(s, pat) {
				var i = -1,  j = 0,  sp = []
				while ( i < s.length ) {
					i = strFindAny(s, pat, i+1)
					if ( i > 0 ) {
						sp.push(s.substring(j, i))
						j = i+1
					} else {
						i = s.length
						sp.push(s.substring(j, i))
					}
				}
				return sp
			}
		
		var d,  t,  p = str.indexOf(' ')
		if ( p > 0 ) {
			d = str.substr(0, p)
			t = str.substr(p+1)
		} else {
			d = str
		}
		
		var dt = new Date(),  sp = pars(d, '.-/'),  dd,  dm
		if ( sp[1] ) {
			if ( dateFormat.charAt(0) == 'd' ) {
				dd = parseInt(sp[0], 10)
				dm = parseInt(sp[1], 10) - 1
			} else {
				dd = parseInt(sp[1], 10)
				dm = parseInt(sp[0], 10) - 1
			}
		} else {
				dd = parseInt(sp[0], 10)
		}
		if ( sp[2] ) {
			var dy = parseInt(sp[2], 10)
			if ( dy < 100 )  dy += 2000
			dt.setFullYear(dy, dm, dd)
		} else if ( sp[1] )  dt.setMonth(dm, dd)
		else  dt.setDate(dd)
		
		if ( xml ) return strDateXml(dt)
		else {
			if ( t ) {
				var th, tm, ts
				sp = pars(t, '.:')
				th = parseInt(sp[0], 10)
				if ( sp[1] )  tm = parseInt(sp[1], 10)
				if ( sp[2] )  ts = parseInt(sp[2], 10) 
				if ( ts )  dt.setHours(th, tm, ts)
				else if ( tm )  dt.setHours(th, tm, 0)
				else  dt.setHours(th, 0, 0)
			} else dt.setHours(0, 0, 0)
			return dt.getTime()
		}
	}
	return false
}



/* Input time
*/
function inputTime( str ) {
	if ( str ) {
		var sp = strSplit(str, ':')
		if ( sp[0] && sp[1] ) {
			var t = parseInt(sp[0], 10) * 3600000 + parseInt(sp[1], 10) * 60000
			if ( sp[2] ) t += parseInt(sp[2], 10)
			return t
		}
	}
}




/* Check fields
 * 
 * form: form object
 * fields: string, comma sep field list
*/
function checkFields( form, fields ) {
	if ( form && fields ) {
		var fld = strSplit(fields, ',')
		for ( var i=0; i < fld.length; i++ ) {
			if ( !form.tag.find('#'+fld[i]).val() ) {
				alert('Required field: ' + fld[i])
				return false
			}
		}
		return true
	} else alert('checkFields: wrong parameters')
	return false
}



/* Clear field
*/
function clearField( fld ) {
	if ( fld.prop('checked') )  fld.removeProp('checked')
	else if ( fld.val() ) {
		fld.val('')
		fld.removeData('id')
	}
}



/* Clear form fields
*/
function clearFields( form ) { 
	form.find('input,select,textarea').val('')
	form.find('input:checkbox').prop('checked',false)
	form.find('input[type="autocomplete"]').removeData('id')
	form.find('input[type="filelink"]').removeData('id')
	form.find('input[type="image"]').removeData('id').removeAttr('src')
		.each( function() {
			var el = $(this)
			el.css({width: el.css('max-width'), height: el.css('max-height')})
		})
	form.find('input[type="color"]').val('#E3E4E5')
	form.find('.br-number').removeData('val')
}




/* Find the form of a field
*/
function formOfField( field ) {
	var par = $(field).parent()
	while ( !par.hasClass('br-form') && !par.hasClass('br-page') ) par = par.parent()
	if ( par.hasClass('br-form') ) return par
	else return null
}




/* Display data in form
*/
function displayForm( form, rec ) {
	if ( form && rec ) {
		form.find('.br-field').each( function() {
			displayField($(this), rec)
		})
		computedFields(form)
		form.triggerHandler('display')
	}
}



/* Display field
*/
function displayField( fld, rec ) {
	if ( !fld || !rec ) return
	var id = fld.attr('id')
		, value = rec[id]
	if ( value || value == 0 ) {
		if ( fld.is('input:checkbox') && value )
			fld.prop('checked', true)
		else if ( fld.is('.br-datetime') )
			fld.val(strDate(new Date(value), true))
		else if ( fld.is('.br-date') )
			fld.val(strDate(new Date(value)))
		else if ( fld.is('.br-time') ) {
			fld.val(strTime(value))
		} else if ( fld.is('.br-number') ) { 
			if ( typeof value == 'string' && !isNaN(value) ) {
				if ( value.indexOf('.') > -1 ) value = parseFloat(value)
				else value = parseInt(value, 10)
			}
			fld.data('val', value)
			numberField(fld)
		} else if ( fld.is('input[type="image"]') ) {
			var par = {cmd: 'FILE',	mode: 'r', db: br.db, _id: value.val, 
								w: fld.width(), h: fld.height(), usercode: br.usercode}
			fld.attr('src', '/brumba?' + JSON.stringify(par))
			fld.data('id', value.val)
			fld.css({width: 'auto', height: 'auto'})
		} else if ( value.txt ) {
			fld.val(value.txt)
			fld.data('id', value.val)
		} else {
			fld.val(value)
		}
	}
}



/* Number field format
*/
function numberField( fld ) {
	fld.val(numberFormat(fld.data('val'), fld.attr('data-decimals')))
}



/* Number field format
*/
function numberFormat( num, dec ) {
	if (num == null) return ''
	if ( !isNaN(num) ) {
		var v = parseFloat(num).toLocaleString('default', {maximumFractionDigits: 6})
		if ( dec ) {
			dec = parseInt(dec, 10)
			var p = v.indexOf(decimalSeparator)
			if ( p > 0 ) {
				if ( dec == 0 ) v = v.substr(0, p)
				else {
					var n = v.length - p - 1
					if ( n > dec ) v = v.substr(0, p + 1 + dec)
					else for ( var i=n; i < dec; i++ ) v += '0'
				}
			} else if ( dec > 0 ) {
				v += decimalSeparator
				for ( var i=0; i < dec; i++ ) v += '0'
			}
		}
		return v
	}
	return ''
}
	


/* Computed fields
*/
function computedFields( form ) {
	form.find('input[data-formula]').each( function() {
		var fld = $(this)
			, formula = fld.attr('data-formula')
		if ( !formula || formula.length == 0 ) return
		
		var expr = formulaValues(form, formula)
		if ( expr ) {
//console.log(expr)
			try {
				var v = eval(expr)
				if ( v || v == 0 ) {
//console.log(v)
					if ( fld.is('.br-time') ) {
						fld.val(strTime(v))
					} else {
						fld.data('val', v)
						numberField(fld)
					}
				} else fld.val('')
			} catch (e) {
				console.log(e)
			}
		} else fld.val('')
	})
}




/* Form size
*/
function formSetSize( form ) {
	var w = 0, h = 0
	form.find('.br-field, .br-label').each( function() {
		var b = bounds($(this))
		if ( b.left + b.width > w ) w = b.left + b.width
		if ( b.top + b.height > h ) h = b.top + b.height
	})
	var sz = {width: w+5, height: h+5}
	form.css(sz)
	return sz
}



/* Form dialog
par = {
	formName: 'TestForm',
	title: 'Test form',
	height: 200
}
*/
function formDialog( par, callback ) {
	remote({cmd: 'GET', db: br.app, coll: 'forms', where: {name: par.formName}}, function(res) {
		if ( res.err ) return callback(res)	
		var dlg = $('<div class="br-form-dialog" style="background: #E3E4E5;" />')
		dlg.append(res[0].html)
		dlg.find('input[type=number]').removeAttr('type').addClass('br-number')
		dlg.find('input[type=date]').removeAttr('type').addClass('br-date')
		dlg.find('input[type=time]').removeAttr('type').addClass('br-time')
		dlg.find('input[type=datetime]').removeAttr('type').addClass('br-datetime')
		var fm = $(dlg.find('form')[0])
		if ( res[0].events ) fm.data('events', res[0].events)
		fm.attr('readonly', 'readonly')
		dlg.attr('title', par.title)
		dlg.find('button').button()
		dlg.dialog({
			close: function() {
			  dlg.remove()
			}
		})
		var sz = formSetSize(fm)
		dlg.dialog('option', 'width', sz.width + 50)
		if ( par.height ) dlg.dialog('option', 'height', par.height)
		callback({})
	})
}



/* Photo gallery using jquery.poptrox
*/
function photoGallery( dat, field, width ) {
	var dlg = $('<div class="br-photo-gallery" title="'+ translate('Photo Gallery') 
				+'" style="background: #E3E4E5;" />')
	dlg.dialog({
		close: function() {
		  dlg.remove()
		},
		width: width || 480
	})
	
	if ( dat && dat[0] ) {
		var path = '/brumba?' +
					JSON.stringify({cmd: 'FILE',	mode: 'r', db: br.db, _id: '#id', w: 100, usercode: br.usercode})
		for ( var i=0; i < dat.length; i++ ) {
			var rec = dat[i]
				, img = rec[field]
			if ( img ) {
				var p = path.replace('#id', img.val)
					, im = $('<img />').attr('src', p)
					, a = $('<a target="_blank" />').attr('href', p.replace('"w":100,', ''))
				a.append(im)
				dlg.append(a)
			}
		}
	}
}



/* Create dynamic form fields
 * orientation = 'V' for vertical or 'H' for horizontal
*/
function dynamicFields( form, attributes, point, orientation ) {
	if ( form && attributes ) {
		if ( typeof form == 'string' ) form = page.findForm(form)
		if ( !form ) return
		
		var top = point.top || 3
			, left = point.left || 5
			, ftop, fleft
		
		for ( var i=0; i < attributes.length; i++ ) {
			var at = attributes[i]
				, w = at.width || 100
				, el
			if ( at.label ) {
				el = addLabel(form.tag, at.label, top, left, at.name)
				setDyn(el, w, at.align)
				setFunc(el)
			}
			if ( orientation == 'V' ) {
				ftop = top
				fleft = left + 100
			} else {
				ftop = top + 18
				fleft = left
			}
			el = addField(form.tag, at.name, at.type, ftop, fleft)
			setDyn(el, w, at.align)
			setFunc(el)
			el.change( function() {
				form.setVal($(this))
			})
			if ( orientation == 'V' ) top += 23
			else left += w + 3
		}
	}
}

function setDyn( elem, w, align ) {
	elem.addClass('br-dynamic')
	elem.css('width', w)
	if ( align ) elem.css('text-align', align)
}




/* Create dynamic tabular fields
*/
function dynamicFieldsTabular( form, attributes, left ) {
	if ( form && attributes ) {
		if ( typeof form == 'string' ) form = page.findForm(form)
		if ( !form ) return
		
		var header = form.tag.find('.br-header')
			, detail = form.tag.find('.br-detail')
			, topH, topD
			, l = header.find('.br-label')
			, topH = parseInt(l.css('top'), 10)
			, f = detail.find('.br-field')
			, topD = parseInt(f.css('top'), 10)
		if ( !left ) left = parseInt(f.css('left'), 10)
		
		for ( var i=0; i < attributes.length; i++ ) {
			var at = attributes[i]
				, w = at.width || 100
				, el
			if ( at.label ) {
				el = addLabel(header, at.label, topH, left, at.name)
				setDyn(el, w, at.align)
				setFunc(el)
			}
			for ( var j=0; j < form.rows.length; j++ ) {
				el = addField(form.rows[j], at.name, at.type, topD, left)
				setDyn(el, w, at.align)
				setFunc(el)
				el.change( function() {
					form.setVal($(this))
				}).focus(function() {
					form.selectRow($(this).parent().data('row'))
				})
			}
			left += w + 3
			
		}
		form.disableRows()
	}
}




/* Add Label
*/
function addLabel( parent, text, top, left, input ) {
	var el = $('<label class="br-label"'+
					((input) ? ' for="'+input+'"' : '')+
					' style="top:'+top+'px;left:'+left+'px;">'+text+'</label>')
	parent.append(el)
	return el
}



/* Add Field
*/
function addField( parent, id, type, top, left ) {
	var tag = (_.contains(['select','textarea'], type)) ? type : 'input'
		, el = $('<'+tag+' class="br-field" id="'+id+'" style="top:'+top+'px;left:'+left+'px;" />')
	if ( type ) {
		if ( type == 'number' ) el.addClass('br-number')
		else el.attr('type', type)
	}
	parent.append(el)
	return el
}



/* Elements functionality
*/
function elemFunc( parent ) {
	parent.find('*').each(function() { setFunc($(this)) })
}



/* Element functionality
*/
function setFunc( elem ) {
	if ( !elem ) return
	
	// Label
	if ( elem.hasClass('br-label') ) {
		elem.text(translate(elem.text(), br.lang))
	
	// Number
	} else if ( elem.hasClass('br-number') ) {
		elem.focusin( function() {
			var ed = $('<input id="number-editor" class="br-field" type="number" />')
				, self = $(this)
				, org = self.data('val')
			ed.css('left', self.css('left'))
			ed.css('top', self.css('top'))
			ed.css('width', self.css('width'))
			ed.css('height', self.css('height'))
			self.after(ed)
			ed.focus()
			ed.val(org)
			ed.focusout( function() {
				var v = (ed.val()) ? parseFloat(ed.val()) : null
				ed.remove()
				if ( v != org ) {
					self.data('val', v)
					numberField(self)
					self.trigger('change')
					computedFields(self.parent())
				}
			})
		})
	
		// Date	} else if ( elem.is('.br-date, .br-datetime') ) {
		if ( !elem.prop('disabled') ) addDatepicker(elem)
	
	} else if ( elem.hasClass('br-field') ) {
		var type = elem.attr('type')
		if ( !type ) return
	
		// Autocomplete
		if ( type == 'autocomplete' ) {
			Autocomplete(elem)
	
		// Input image
		} else if ( type == 'image' ) {
			elem.each( function() {
				fileOpenIco(elem, true)
				elem.css({
					'max-width': elem.css('width'),
					'max-height': elem.css('height')
				})
			}).click( function(ev) {
				ev.preventDefault()
				if ( ev.ctrlKey && ev.shiftKey ) {
					fileFromDb({type: 'image'}, function(res) {
						elem.data('id', res.id)
						elem.val(res.filename)
						elem.trigger('change')
						var q = {cmd: 'FILE',	mode: 'r', db: br.db, _id: res.id, usercode: br.usercode}
						elem.attr('src', '/brumba?' + JSON.stringify(q))
					})
				} else fileShow(elem.data('id'))
			})

		// File link
		} else if ( type == 'filelink' ) {
			if ( !elem.hasClass('br-no-icon') ) fileOpenIco(elem)
			elem.click( function() {
				fileShow(elem.data('id'))	
			})
			elem.prop('readonly', true)

		// Color
		} else if ( type == 'color' ) {
			elem.val('#E3E4E5')
		}
		
	// Button
	} else if ( elem.hasClass('br-button') ) {
		elem.button()
		elem.text(translate(elem.text(), br.lang))
	
	// Images
	} else if ( elem.is('img') ) {
		imgLoad(br.app, elem)
	}
}

/*************** END Form *************/








/*****************************************************
 *		Splitter
 *****************************************************/

/* Add br-panel to element
*/
function addPanel( el ) {
	var pane = $('<div class="br-panel"></div>')
	el.append(pane)
	return pane
}


/* Create splitter
*/
function createSplitter( el, type ) {
	var p1 = addPanel(el),
		p2 = addPanel(el),
		cl = '', h = ''
	if ( type == 'H' ) {
		cl = 'split-s'
		h = 's'
		//p1.height(el.height() / 2)
		p1.height(Math.min(el.height()/2, 300))
		p2.height(el.height() - p1.height() - 5)
	} else if ( type == 'V' ) {
		var style = {
				float: 'left',
				height: '100%'
			}
		cl = 'split-e'
		h = 'e'
		p1.css(style)
		//p1.width(el.width() / 2)
		p1.width(Math.min(el.width()/2, 400))
		p2.css(style)
		p2.width(el.width() - p1.width() - 5)
	}
	p1.addClass(cl).resizable({
		handles: h,
		reverseResize: p2
	})
	var prev = el.prev()
	if ( prev && prev.hasClass(cl) ) {
		prev.resizable({
			reverseResize: prev.data("ui-resizable").options.reverseResize.add(p2 )
		})
	}
	return [p1, p2]
}


/* Set splitter functionality 
*/
function setSplitter( panes ) {
	var _split = function(pane) {
			var cl = '', h = '',
				next = pane.next(),
				prev = pane.parent().prev()
			if ( pane.hasClass('split-s') ) {
				cl = 'split-s'
				h = 's'
			} else if ( pane.hasClass('split-e') ) {
				cl = 'split-e'
				h = 'e'
			}
			pane.resizable({
				handles: h,
				reverseResize: next
			})
			if ( prev && prev.hasClass(cl) ) {
				prev.resizable({
					reverseResize: prev.data("ui-resizable").options.reverseResize.add(next)
				})
			}
		}
		
	if ( panes.length ) {
		panes.each( function() {
			_split($(this))
		})
	} else {
		_split(panes)
	}
}

/********* END Splitter **********/




 
 
/* Load script from database
*/
function loadScript( name, callback ) {
	var scr = $('script[name="'+name+'"]')
	if ( scr[0] ) return (callback) ? callback() : null
	
	var par = {
			cmd: 'GET',
			db: br.app,
			app: br.app,
			coll: 'scripts',
			where: {name: name},
			usercode: br.usercode
		}
	remote(par, function(res) {
		if ( res.err ) return (callback) ? callback(res) : null
		if ( res[0] ) {
			var script = document.createElement("script")
			script.setAttribute('name', name)
			script.appendChild(document.createTextNode(res[0].code))
			script.async = true
			document.head.appendChild(script)
		}
		if ( callback ) callback()
	})
}



/* Dynamic script
*/
function dynamicScript( url, callback ) {
	$('script[src="'+url+'"]').remove()
	
	var script = document.createElement("script")
	script.src = url
	script.type = 'text/javascript'
	script.async = true
	document.head.appendChild(script)
	
	if ( callback ) callback()
}



/* Dynamic link
*/
function dynamicLink( url, callback ) {
	$('link[href="'+url+'"]').remove()
	
	var link = document.createElement("link")
	link.href = url
	link.rel = 'stylesheet'
	link.async = true
	document.head.appendChild(link)
	
	if ( callback ) callback()
}



/* Check if element has any of classes
*/
function hasAnyClass( el, cls ) {
	var sp = U.strSplit(cls, ',')
	for ( var i=0; i < sp.length; i++ ) {
		if ( el.hasClass(sp[i]) ) return true
	}
	return false
}              



/* Report call
*/
function report( form, report, args ) {
	if ( form ) { 
    var par = {
      cmd: 'REP',
      app: br.app,
      db: br.db,
      args: {report: report, timezone: timezone()},
      usercode: br.usercode
    }
    $.extend(par.args, form.modif)
    if ( args ) $.extend(par.args, args)
    window.open('/brumba?' + JSON.stringify(par))
  }
}




/* Delete dialog
*/
function deleteDialog( delFunc ) {
	var $d = $('<div id="dialog-form">' +
								'<p>' + translate('Do you want to delete this record?') + '</p>' +
							'</div>')
	$('body').append($d)
	$d.dialog({
		modal: true,
		
		buttons: {
			Delete : function() {
				$d.dialog("close")
				delFunc()
			},
			
			Cancel : function() {
				$d.dialog("close")
			}
		},
		
		close : function() {
			$d.empty()
		}
	})
}



/* Add datepicker to a field
*/
function addDatepicker( field ) {
	var ico = $('<span class="ui-icon ui-icon-calendar" style="position: absolute"></span>')
		, l = parseInt(field.css('left'), 10) + parseInt(field.css('width'), 10) - parseInt(ico.css('width'), 10) + 2
	ico.css('top', field.css('top'))
	ico.css('left', l)
	ico.css('z-index', 2)
	field.parent().append(ico)
	field.data('ico', ico)
	ico.click( function() {
		var gost = $('.br-datepicker')
		if ( !gost[0] ) console.log('No br-datepicker found')
		else {
			gost.attr('id', field.attr('id'))
			field.datepicker({
				showWeek: true,
				firstDay: 1,
				dateFormat: dateFormat,
				constrainInput: false,
				onSelect: function(date, inst) { 
					field.val(date)
					field.trigger("change") 
				},
				onClose: function(date, inst) { 
					field.datepicker('destroy')
				}
			})
			gost.data('datepicker', field.data('datepicker'))
			field.datepicker('show')
		}
	})
}




/* Validate password
*/
function validPass( pass ) {
	return true
}




/* Element bounds
*/
function bounds( elem ) {
	return {
		left: parseInt(elem.css('left'), 10),
		top: parseInt(elem.css('top'), 10),
		width: parseInt(elem.css('width'), 10),
		height: parseInt(elem.css('height'), 10)
	}
}



/* Context menu
	par = {
		elem: elememt,
		items: [ {id: 'file', text: 'From file'},
						...
					],
		pageX: 503,
		pageY: 231
	}
	handler = function(ev, ui) {}
*/
function contextMenu( par, handler ) {
	$('.br-contextMenu').remove()
	var cm = $(
			'<ul class="br-contextMenu" style="top:'+par.pageY+'px; left:'+par.pageX+'px;">' +
				'<li style="background-color: #E3E4E5; text-align: center;">Close</li>' +
			'</ul>')
	for ( var i=0; i < par.items.length; i++ ) {
		cm.append('<li id="' + par.items[i].id + '">' + par.items[i].text + '</li>')
	}		
	cm.menu({
		select: function(ev, ui) {
			handler(ev, ui)
			cm.remove()
		}
	})
	//cm.css('top', par.pageY)
		//.css('left', par.pageX)
	$('body').append(cm)
}




/* Reload Events
*/
function reload_events() {
	page.forms.forEach( function(form) {
		remote({cmd:'GET', db:br.app, coll:'forms', where:{name:form.name}}, function(res) {
			if ( res.err )  alert(res.err)
			else if ( res[0].events )  {
				form.tag.data('events', res[0].events)
				form.load_events()
				$(form).triggerHandler('open')
			}
		})
	})
}





/* Bind handler as the first in the execution chain
*/
// [name] is the name of the event "click", "mouseover", .. 
// same as you'd pass it to bind()
// [fn] is the handler function
$.fn.bindFirst = function(name, fn) {
    // bind as you normally would
    // don't want to miss out on any jQuery magic
    this.on(name, fn);

    // Thanks to a comment by @Martin, adding support for
    // namespaced events too.
    this.each(function() {
        var handlers = $._data(this, 'events')[name.split('.')[0]];
        // take out the handler we just inserted from the end
        var handler = handlers.pop();
        // move it at the beginning
        handlers.splice(0, 0, handler);
    });
};