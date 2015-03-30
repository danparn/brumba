/*
 * Brumba
 *
 * © 2012-2014 Dan Parnete
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
	
	if ( !param.usercode ) param.usercode = br.usercode
	
	var ajax = {
		url: '/brumba?' + JSON.stringify(param),
		timeout: 30000,
		success: function(res) {
			clearTimeout(to)
			if ( window.loadingIndicator )  loadingIndicator.fadeOut()
//console.timeEnd('remote')
			if ( res.err ) alert(JSON.stringify(res))
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



/* Replace main arguments
*/
function mainArgs ( str ) {
	if ( str ) {
		var qs = strRep(str, '$username', br.username)
			, uid = ( isNaN(br.userid) ) ? '"'+br.userid+'"' : br.userid
		qs = strRep(qs, '$userid', uid)
		if ( br.menuid )  qs = strRep(qs, '$menuid', br.menuid)
		qs = strRep(qs, '$menulink', br.menulink)
		return qs
	}
}



/* Substitutes retrieve arguments
*/
function substArgs ( where ) {
	if ( where ) {
		var dat = page.forms[0].dataset[0]
		if ( dat ) {
			for ( k in where ) {
				if ( typeof where[k] == 'string' && where[k].charAt(0) == '#' ) {
					var v = dat[where[k].substr(1)]
					if ( v ) where[k] = v
					else delete where[k]
				}
			}
		}
	}
}



/* Check fields
 * 
 * form: form object
 * fields: string, comma sep field list
 * cmd: string, (E)mpty
*/
function checkFields( form, fields, cmd ) {
	if ( form && fields && cmd ) {
		var fld = strSplit(fields, ',')
		for ( var i=0; i < fld.length; i++ ) {
			if ( cmd.charAt(0) == 'E' && !form.tag.find('#'+fld[i]).val() ) {
				alert('Required field: ' + fld[i])
				return false
			}
		}
		return true
	} else alert('checkFields: wrong parameters')
	return false
}


/* Set field
*/
function setField( form, fldname, val ) {
	var fld = form.htm.find('#' + fldname)
	if ( fld ) fld.val(val)
}



/* Translate string
*/
function translate( str, lang ) {
	if ( br.langData ) {
		for ( var i=br.langData.length-1; i >= 0; i-- ) {
			if ( br.langData[i].default == str ) {
				var r = br.langData[i]
				return r[lang]
			} 
		}
	}
	return str
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




/*********************************************
 * 				File
 *********************************************/
/* File upload
*/
function fileUpload( db, callback ) {
	if ( !db )  { callback({dbret: dbErr.param});  return }
	var f = $('<input type="file" style="display: none" />')
	
	$('body').append(f)
	
	f.change( function() {
		var file = f[0].files[0]
		f.remove()
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
			callback(res)
		}, file)
	})
	.click()
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
function fileOpenIco( $this ) {
	var ico = $('<span class="ui-icon ui-icon-folder-open" style="position: absolute"></span>')
		, l = parseInt($this.css('left'), 10) + parseInt($this.css('width'), 10) - parseInt(ico.css('width'), 10) + 2
	ico.css('top', $this.css('top'))
	ico.css('left', l)
	ico.css('z-index', 2)
	$this.parent().append(ico)
	ico.click( function() {
		fileUpload(br.db, function(res) {
			$this.data('id', res.newid)
			$this.val(res.filename)
			$this.trigger('change')
		})
	})
	return ico
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
*/function inputDate ( str ) {
	if ( str ) {
		if ( str.charAt(0) == '+' )  return new Date()
		
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
		
		if ( t ) {
			var th, tm, ts
			sp = pars(t, '.:')
			th = parseInt(sp[0], 10)
			if ( sp[1] )  tm = parseInt(sp[1], 10)
			if ( sp[2] )  ts = parseInt(sp[2], 10) 
			if ( ts )  dt.setHours(th, tm, ts)
			else if ( tm )  dt.setHours(th, tm, 0)
			else  dt.setHours(th, 0, 0)
		} else {
			dt.setHours(0, 0, 0)
		}
		return dt.getTime()
	}
	return -1
}




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
		p1.height(el.height() / 2)
		p2.height(el.height() - p1.height() - 5)
	} else if ( type == 'V' ) {
		var style = {
				float: 'left',
				height: '100%'
			}
		cl = 'split-e'
		h = 'e'
		p1.css(style)
		p1.width(el.width() / 2)
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
	form.find('input,select,textarea').val("")
	form.find('input:checkbox').removeProp('checked')
	form.find('input[type="autocomplete"]').removeData('id')
	form.find('input[type="filelink"]').removeData('id')
	form.find('input[type="image"]').removeData('id').removeAttr('src')
	form.find('input[type="color"]').css('background', '')
	form.find('.br-number').removeData('val')
}


/* Replace the normal jQuery getScript function with one that supports
	debugging and which references the script files as external resources
	rather than inline.
*/
function dynamicScript(url, callback){			   
	var head = document.getElementsByTagName("head")[0];
	var script = document.createElement("script");
	script.src = url;
	
	// Handle Script loading				
	var done = false;
		
	// Attach handlers for all browsers
	script.onload = script.onreadystatechange = function(){
		if (!done && (!this.readyState || this.readyState == "loaded" || this.readyState == "complete")) {
		   done = true;
		   if (callback){
		      callback();
		   }				
		   // Handle memory leak in IE
		   script.onload = script.onreadystatechange = null;
		}
	};				
	head.appendChild(script);
		
	// We handle everything using the script element injection
	return undefined;			   
};



function appScript( name, callback ) {
	var par = {
			cmd: 'GET',
			db: br.app,
			app: br.app,
			coll: 'scripts',
			where: {name: name},
			result: 'count',
			usercode: br.usercode
		}
	remote(par, function(res) {
		if ( res.count > 0 ) {
			par.result = 'code'
			dynamicScript('/brumba?' + JSON.stringify(par), function() {
				if ( callback ) callback()
			})
remote({cmd:'SRV', db:br.app, app:br.app, script:name+'.test'}, function(res) {})
		}
	})


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
function report( form, report ) {
	if ( form ) { 
    var par = {
      cmd: 'REP',
      app: br.app,
      db: br.db,
      args: {report: report},
      usercode: br.usercode
    }
    $.extend(par.args, form.modif)
    window.open('/brumba?' + JSON.stringify(par))
    /*remote(par, function(res) {
      window.open(res)
    })*/
  }
}



/* Excel export call
*/
function excel( form, script ) {
	if ( form ) { 
    var par = {
      cmd: 'SRV',
      script: 'excel',
      app: br.app,
      db: br.db,
      args: form.modif,
      usercode: br.usercode
    }
 		par.args.datascript = script
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



/* Display data in form
*/
function displayForm(form, rec) {
	if ( form && rec ) {
		form.find('.br-field').each( function() {
			var fld = $(this)
				, id = fld.attr('id')
			if ( id in rec && rec[id] ) {
				var value = rec[id]
				if ( fld.is('input:checkbox') && value )
					fld.prop('checked', true)
				else if ( fld.is('input[type="datetime"]') )
					fld.val(strDate(new Date(value), true))
				else if ( fld.is('input[type="date"]') )
					fld.val(strDate(new Date(value)))
				else if ( fld.is('.br-number') ) { 
					fld.data('val', value)
					numberField(fld)
				} else if ( fld.is('input[type="image"]') ) {
					var par = {cmd: 'FILE',	mode: 'r', db: br.db, _id: value.val, usercode: br.usercode}
					fld.attr('src', '/brumba?' + JSON.stringify(par))
					fld.data('id', value.val)
				} else if ( value.txt ) {
					fld.val(value.txt)
					fld.data('id', value.val)
				} else
					fld.val(value)
			}
		})

		computedFields(form)
	}
}



/* Number field format
*/
function numberField( fld ) {
	var v = fld.data('val')
	if ( v ) fld.val(numberFormat(v, fld.attr('data-decimals')))
	else fld.val('')
}



/* Number field format
*/
function numberFormat( num, dec ) {
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
			, expr = formulaValues(fld.attr('data-formula'))
		if ( expr ) {
			var value = eval(expr)
			fld.data('val', value)
			numberField(fld)
		} else fld.val('')
	})

	function formulaValues( formula ) {
		var op = '*+/-()'
			, p = 0, b = 0, res = ''
		do {
			p = strFindAny(formula, op, p)
			if ( p < 0 ) p = formula.length
			var f = form.find('#'+formula.substring(b,p).trim())
				, v = (f.hasClass('br-number')) ? f.data('val') : f.val()
			if ( !v ) v = 0
			res += parseFloat(v) + formula.charAt(p)
			p++
			b = p
		} while ( p < formula.length )
		return res
	}
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



/* Form size
*/
function formSetSize( form ) {
	var w = 0, h = 0
	form.children().each( function() {
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
	title: 'Test form'
}
*/
function formDialog( par, callback ) {
	remote({cmd: 'GET', db: br.app, coll: 'forms', where: {name: par.formName}}, function(res) {
		if ( res.err ) return callback(res)	
		var dlg = $('<div class="form-dialog" style="background: #E3E4E5;" />')
		dlg.append(res[0].html)
		var fm = $(dlg.find('form')[0])
		dlg.attr('title', par.title)
		dlg.dialog({
			close: function() {
			  dlg.remove()
			}
		})
		var sz = formSetSize(fm)
		dlg.dialog('option', 'width', sz.width + 50)
		callback({})
	})
}



