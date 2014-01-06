/*
 * Brumba
 *
 * © 2012-2013 Dan Parnete
 * Dual licensed under the MIT and GPL licenses.
*/

const
	selectSign = $('<div class="br-select-sign">^</div>'),	// used for select fields
	cssFields = 'left,top,width,height,background-color,color,text-align'

	
var propElem = null			// element you see properties of
	, forms = null						// forms list of application
	, reports = null					// reports list of application
	, ws = null							// workspace
	, onProp = false				// focus is on Properties dialog
	, page = null



/* Main object
*/
var main = {
	app: localStorage.getItem( 'br.app' ),
	db: localStorage.getItem( 'br.app' ),
	lang: localStorage.getItem( 'br.lang' ),
	usercode: localStorage.getItem( 'br.usercode' ) || 'ide',
	userid: localStorage.getItem( 'br.userid' ),
	username: localStorage.getItem( 'br.username' ),
	useradm: localStorage.getItem( 'br.useradm' )
}
	


$(function() {
	// Menu
	accordionMenu( function(item) {
		//console.log( item )
	})
	
	$('button').button()
	
	// Workspace
	ws = $('#workspace')
	ws.drag('start', function(ev, dd) {
		return $('<div class="selector" />').css('opacity', .65)
				.appendTo( document.body )
	}).drag( function(ev, dd) {
		$( dd.proxy ).css({
			top: Math.min( ev.pageY, dd.startY ),
			left: Math.min( ev.pageX, dd.startX ),
			height: Math.abs( ev.pageY - dd.startY ),
			width: Math.abs( ev.pageX - dd.startX )
		})
	}).drag('end', function(ev, dd){
		$( dd.proxy ).remove()
	})
   
	$.drop({ multi: true })
   
	ws.mousedown( function() {
		onProp = false
		$('.selected').removeClass('selected')
	})
	
	$('#menubar').click( function(ev) {
		$('.selected').removeClass('selected')
	})
	
	// Key mapping
	$( document ).keypress( function(ev) {
		if ( onProp )  return
		var sel = $('.selected'),
			k = ev.keyCode
		if ( sel.length == 0 )  return
		
		// Arrow keys:  move selected elements, or change size if shiftKey is pressed
		if ( k >= 37 && k <= 40 ) {
			if ( sel.length > 0 ) {
				//$('.br-select').removeClass("selected")
				sel.each( function() {
					var el = $(this),
						v = 0,
						s = ''
					if ( k == 37 || k == 39 ) {
						if ( ev.shiftKey )  s = el.css('width')
						else  s = el.css('left')
						v = Math.round( parseFloat(s) )
						if ( k == 37 )  v--
						else  v++
						if ( ev.shiftKey )  el.css('width', v + 'px')
						else  el.css('left', v + 'px')
					} else {
						if ( ev.shiftKey )  s = el.css('height')
						else  s = el.css('top')
						v = Math.round( parseFloat(s) )
						if ( k == 38 )  v--
						else  v++
						if ( ev.shiftKey )  el.css('height', v + 'px')
						else  el.css('top', v + 'px')
					}
				})
				ev.preventDefault()
			}
		
		// Del key
		} else if ( k == 46 ) {
			var sel = $('.selected')
			if ( sel[0] ) {
				sel.remove()
				ev.preventDefault()
			}
		}
	})
	
	// properties dialog
	$( "div#properties" ).dialog({
			autoOpen: false,
	}).click( function() {
		onProp = true
	})
	bindProp( $('.br-prop') )

	// Color picker
	var cp = $('div#color-picker')
		, code = cp.find('input#color-code')
	cp.dialog({
			autoOpen: false,
			modal: true,
			buttons: {
				Ok: function() {
					$(cp.dialog('option', 'target')).val( code.val() ).trigger('change')
					cp.dialog( "close" )
				},
				Cancel: function() {
					cp.dialog( "close" )
				}
			}
	})
	cp.find('td').click( function() {
		code.val( $(this).attr('bgcolor') ).trigger('change')
	})
	code.change( function() {
		cp.find('div#color-sample').css( 'background-color', $(this).val() )
	})
	$('div#properties input.color-field').each( function() {
		var $this = $(this)
			, self = this
			, img = $this.next()
		img.click( function() {
			cp.dialog('option', 'target', self)
			cp.dialog('open')
		})
		$this.parent().append( img )
	})
	.change( function() {
		$(this).css( 'background-color', $(this).val() )
		onChangeProperty( this )
	})
	
})





/*********************************************
 * 				PROPERTIES
 *********************************************/

function bindProp( prop ) {
	prop.addClass('ui-widget-content ui-corner-all')
		.bind('change', function() {
			onChangeProperty( this )
			return false
		})
}



/* Open properties dialog
*/
function openProperties() {
	$('#properties').dialog('open')
	resetForm( $('#properties') )
}



/* Show element's properties
*/
function showProperties( elem ) {
	var p = $('#properties')
		, ty = p.find('select[name="type"]')
		, tx = p.find('input[name="text"]')
		, id = p.find('input[name="id"]')
	
	resetForm( p )
	if ( !p.dialog('isOpen') || !elem )  return
	propElem = $(elem)
	
	p.find('input.color-field').removeAttr('style')
	
	// Enable type for inputs, disable for others
	if ( propElem.hasClass('br-field') ) {
		ty.removeProp('disabled')
		ty.val( propElem.attr('type') )
		tx.prop('disabled', true)
	} else { 
		ty.prop('disabled', true)
		if ( propElem.hasClass('br-page') )  ty.val( 'PAGE' )
		else if ( propElem.hasClass('br-report') )  ty.val( 'REPORT' )
		else if ( propElem.hasClass('br-band') )  ty.val( 'BAND' )
		else if ( propElem.hasClass('br-nested') )  ty.val( 'NESTED' )
		else if ( propElem.hasClass('br-button') )  ty.val( 'button' )
		else  ty.val( elem.tagName )
		tx.removeProp('disabled')
	}
	
	id.val( propElem.attr('id') )
	if ( propElem.hasClass('br-label') || propElem.hasClass('br-button') )  p.find('input[name="text"]').val( propElem.text() )
	if ( propElem.hasClass('br-hidden') )  p.find('input[name="hidden"]').attr('checked', 'checked')
	
	// non standard data-* attributes
	var typ = ty.val()
	// delete last element data-* attributes
	p.find('tr.remove').remove()
	
	// set element data-* attributes
	var dataElem = function(tag, name, type) {
		var s = '<tr class="remove"><td><label>' + name + ':</label></td><td>' + '<' + tag + ' name="data-' + name + '"'
		if ( type )  s += ' type="' + type + '"'
		s += ' class="br-prop"/></td></tr>'
		var tr = $( s )
			el = tr.find( tag )
		if ( tag == 'textarea' ) {
			var h = (type > 0) ? ''+type : "50"
			el.attr('style', 'width:100%;height:'+h+'px')
		}
		bindProp( el )
		p.find('table').append( tr )
		el.val( propElem.attr('data-' + name) )
		return el
	}
	
	// Form
	if ( typ == 'FORM' ) {
		dataElem('textarea', 'query')
		dataElem('textarea', 'fields')
	}
	// Report
	else if ( typ == 'REPORT' ) {
		dataElem('input', 'landscape', 'checkbox')
	}
	// Nested
	else if ( typ == 'NESTED' ) {
		tx.prop('disabled', true)
		id.prop('disabled', true)
		id.val(propElem.attr('data-nested'))
	}
	// Band
	else if ( typ == 'BAND' ) {
		tx.prop('disabled', true)
		dataElem('textarea', 'query')
	}
	// Select
	else if ( typ == 'select' ) {
		dataElem('textarea', 'query')
		dataElem('textarea', 'fields')
	}
	// Autocomplete
	else if ( typ == 'autocomplete' ) {
		dataElem('textarea', 'query')
	}
	// text-align
	else if ( typ != 'textarea' && typ != 'checkbox' && typ != 'NESTED' ) {
		var sel = dataElem('select', 'text-align')
		sel.attr('name', 'text-align')
		sel.append( '<option value=""></option>' + 
										'<option value="right">right</option>' +
										'<option value="center">center</option>' )
	}
	
	// css
	var style = propElem.attr('style')
		, sp = cssFields.split(',')
	for ( var i=sp.length-1; i >= 0; i-- ) {
		var color = sp[i].indexOf('color') >= 0			
		if ( !(color && style && style.indexOf(sp[i]) < 0) )
			p.find('[name="'+sp[i]+'"]').val( propElem.css(sp[i]) )
		if ( color && style && style.indexOf(sp[i]) >= 0 ) {
			p.find('input[name="'+sp[i]+'"]').css('background-color', propElem.css(sp[i]) )
		}
	}

	// border
	if ( $('.br-report')[0] ) {
		var bor = dataElem('input', 'border', 'checkbox')
		if ( propElem[0].style.border ) bor.prop('checked', true)
	}

	// font
	var pos
	if ( style && (pos=style.indexOf('font:')) >= 0 )
		p.find('input[name="font"]').val( style.substring(pos+5, style.indexOf(';',pos)) )

	// checkboxes
	p.find('input[type="checkbox"]').each( function() {
		var name = $(this).attr('name')
		if ( propElem.attr(name) )  p.find('input[name="'+name+'"]').prop('checked', true)
	})
	
}



/* Change element propertie
*/
function onChangeProperty( property ) {
	if ( !propElem )  return
	
	var prop = $( property )
		pn = prop.attr('name'),
		val = prop.val(),
		last = propElem.attr('type'),
		isCSS = function() {
					if ( cssFields.indexOf(pn) >= 0 ) {
						var sp = cssFields.split(',')
						for ( var i=sp.length-1; i >= 0; i-- ) {
							if ( sp[i] == pn )  return true
						}
					}
					return false
				}

	if ( pn == 'id' && propElem.hasClass('br-field') && last != 'checkbox') {
		propElem.text(val)
		if ( last == 'select')  propElem.append( selectSign.clone() )
	}
	
	if ( isCSS() )  $('.selected').css( pn, val )
	else if ( pn == 'text' && !propElem.hasClass('br-field') )  propElem.text( val )
	else if ( prop.attr('type') == 'checkbox') {
		if ( pn == 'hidden') {
			if ( property.checked ) propElem.addClass('br-hidden')
			else  propElem.removeClass('br-hidden')
		} else if ( pn == 'data-border') {
			if ( property.checked ) propElem.css('border', '1px solid')
			else  propElem.css('border', '')
		} else {
			if ( property.checked ) propElem.attr( pn, true )
			else  propElem.removeAttr( pn )
		}
	
	} else if ( pn == 'font') {
		var sel = $('.selected')
			, setfont = function(el) {
					var	s = el.attr('style')
						, pos = s.indexOf('font:')
					if ( pos >= 0 ) {
						s = s.substring(0,pos) + s.substr(s.indexOf(';', pos)+1)
					}  
					el.attr('style', s + ' font:' + val + ';')
				}
		if ( sel[0] ) {
			sel.each( function() {
				setfont($(this))
			})
		} else {
			setfont(propElem)
		}	
	} else { 
		propElem.attr( pn, val )
	}
	
	// style for select and checkbox
	if ( pn == 'type') {
		// Remove last specific style
		if ( last == 'select') {
			propElem.children().remove()
		} else if ( last == 'checkbox') {
			propElem.css('width', '100px')
			propElem.text( propElem.attr('id') )
		}
		setTypeStyle( propElem, val )
	}

	// report landscape
	if ( pn == 'data-landscape') {
		var w, b = propElem.find('.br-band')
		if ( property.checked )  w = 842 
		else  w = 595
		b.css('width', w)
		pageNumPos()
	}
}



/* Set element IDE style
*/
function setTypeStyle( el ) {
	var type = el.attr('type')
	if ( type == 'select') {
		el.append( selectSign.clone() )
	} else if ( type == 'checkbox') {
		el.css('width', '14px')
		el.text('X')
	}
}







/*********************************************
 * 				EVENTS
 *********************************************/
/* Open events
*/
function openEvents() {
	var events = $('.br-events')
		, editor = null
	if ( events.length > 0 )  editor = events.data('editor')
	else {
		events = $('<div class="br-events" title="Events" />')
		var ed = $('<div class="br-editor" />')
			, but = $('<button>Save</button>').button().click( function() {
				$('.br-form').data('events', editor.getValue())
				onSave()
			})
		events.append( but )
		events.append( ed )
		events.dialog({
			width: 700,
			height: 600, 
			close: function() { events.dialog('destroy') }
		})	
		editor = CodeMirror( ed.get(0), {
			mode: 'javascript',
			lineNumbers: true,
			autoCloseBrackets: true		
		})
		editor.on("gutterClick", CodeMirror.newFoldFunction(CodeMirror.braceRangeFinder))
		events.data('editor', editor)
		events.find('.CodeMirror-scroll').css( 'height', ed.css('height') )
	}
	var txt = $('.br-form').data('events')
	if ( txt )  editor.setValue( txt )
}


/* Close events
*/function closeEvents() {
	var events = $('.br-events')
	if ( events )  events.dialog('destroy')
}









/*********************************************
 * 				Server script
 *********************************************/
/* Open script
*/
function openScript() {
	var script = $('<div class="br-script">' +
										'<h3>Script name:</h3><input id="name" />' +
										'<div class="br-editor" />' +
								'</div>')
	closeEvents()
	ws.empty()
	ws.removeAttr('style')
	ws.append( script )
	var editor = CodeMirror( script.find('.br-editor').get(0), {
			mode: 'javascript',
			lineNumbers: true,
			indentWithTabs: true,
			tabSize: 2,
			autoCloseBrackets: true		
		})
	script.data( 'editor', editor )
}


/* Load script
*/function loadScript( id ) {
	var par = {
			cmd: 'GET',
			db: appName(),
			coll: 'scripts',
			where: { _id: id },
			usercode: 'ide'
		}
	remote( par, function(res) {
		if ( !res.dbret ) {
			var script = $('.br-script')
			if ( script ) {
				script.find('input#name').val( res[0].name )
				script.data('editor').setValue( res[0].code )
				script.data( '_id', res[0]._id )
			}
		}
	})
}







/*********************************************
 * 				REFERENCES
 *********************************************/
/* Open relations
*/
function openReferences() {
	if ( !page ) page = new Page()
	page.tag = $('<div class="br-table"><h3>References</h3>' +
										'<button onclick="generateReferences()">Generate</button><br/><br/>' +
								'</div>')
	page.tag.find('button').button()
	closeEvents()
	ws.empty()
	ws.removeAttr('style')
	ws.append(page.tag)
	
	remote( {cmd: 'GET', db: appName(), coll: 'forms', where: {name: '_references'}, usercode: 'ide'}, function(res) {
		if ( res.err || !res[0] )  return
		
		var htm = $( res[0].html )
		page.tag.append(htm)
		var t = new Tabular('references', htm)
		page.forms[0] = t
		t.addRows()
		t.setChangeField()
		t.retrieve()
	})
}


/* Generate references
*/
function generateReferences() {
	alert('Not implemented')
}





/*********************************************
 * 				MENU
 *********************************************/
/* Menu
*/
function openMenu() {
	var menu = $('<div class="br-menu"><h3>Menu</h3>' +
										'<div class="br-editor" />' +
								'</div>')
	closeEvents()
	ws.empty()
	ws.removeAttr('style')
	ws.append( menu )
	var editor = CodeMirror( menu.find('.br-editor').get(0), {
			indentWithTabs: true		
		})
	menu.data( 'editor', editor )
	//menu.find('.CodeMirror-scroll').css( 'height', ed.css('height') )
	remote( {cmd: 'GET', db: appName(), coll: 'application', where: {section: 'menu'}, usercode: 'ide'}, function(res) {
		if ( ! res.dbret && res[0] ) {
			editor.setValue( res[0].menu )
			menu.data( '_id', res[0]._id )
		} else  editor.setValue( 'write here your menu schema' )
	})
}





/*********************************************
 * 				BUTTON HANDLERS
 *********************************************/
/* Load button handler
*/
function onLoad() {
	var app = appName()
	if ( app ) {
		var selmenu = function() {
			$('.accordion li.selected-menu').removeClass('selected-menu')
			$(this).addClass('selected-menu')
		}
		
		// Forms
		var	par = {
				cmd: 'GET',
				db: app,
				coll: 'forms',
				fields: { name: 1 },
				sort: { name: 1 },
				usercode: 'ide'
			}
		remote( par, function(res) {
			var menu = $('li#forms ul').empty()
			if ( res.dbret ) {
				alert( translate('Application not found: ') + app )
			} else {
				forms = res
				$('#application').text('Application: ' + app )
				for ( var i=0; i < res.length; i++ ) {
					var el = $('<li class="menu-item"><a href="#" onclick="loadForm(\'' + res[i]._id + '\')">' + res[i].name + '</a></li>')
					menu.append( el )
					el.click( selmenu )
				}
			}
		})
		
		// Pages
		par.coll = 'pages'
		remote( par, function(res) {
			var menu = $('li#pages ul').empty()
			if ( !res.dbret ) {
				for ( var i=0; i < res.length; i++ ) {
					var el = $('<li class="menu-item"><a href="#" onclick="loadPage(\'' + res[i]._id + '\')">' + res[i].name + '</a></li>')
					menu.append( el )
					el.click( selmenu )
				}
			}
		})

		// Reports
		par.coll = 'reports'
		remote( par, function(res) {
			var menu = $('li#reports ul').empty()
			if ( !res.dbret ) {
				reports = res
				for ( var i=0; i < res.length; i++ ) {
					var el = $('<li class="menu-item"><a href="#" onclick="loadForm(\'' + res[i]._id + '\', true)">' + res[i].name + '</a></li>')
					menu.append( el )
					el.click( selmenu )
				}
			}
		})

		// Scripts
		par.coll = 'scripts'
		remote( par, function(res) {
			var menu = $('li#scripts ul').empty()
			if ( !res.dbret ) {
				for ( var i=0; i < res.length; i++ ) {
					var el = $('<li class="menu-item"><a href="#" onclick="loadScript(\'' + res[i]._id + '\')">' + res[i].name + '</a></li>')
					menu.append( el )
					el.click( selmenu )
				}
			}
		})

	}
}



/* Save button handler
*/
function onSave() {
	var app = appName()
	if ( app ) {
		var el = ws.children()[0]
		if ( el ) {
			var $el = $( el )
			if ( $el.hasClass('br-form') ) {
				
				// Form
				//$('.active').removeClass("active")
				$('.selected').removeClass("selected")
				$('.ui-selectee').removeClass("ui-selectee")
				$('.ui-resizable').removeClass('ui-resizable')
				$('.ui-resizable-handle').remove()
				//$('.watermark').remove()
				$('.br-nested').empty()
				$('img').css('width', 'auto')
				var frm = toInput( el )
					, par = {
						cmd: 'POST',
						db: app,
						coll: 'forms',
						usercode: 'ide'
					}
					, dat = {
						name: frm.attr('id'),
						html: outerHtml( frm )
					}
					, id = frm.data('_id')
					, isrep = $el.hasClass('br-report')
				if ( isrep )  par.coll = 'reports'
				if ( id )  dat._id = id
				dat.events = frm.data('events')
				remote(par, function(res) {
					if ( res.dbret < 0 )  alert( translate('Database error: ') + res.dbret)
					else {
						if ( !id )  onLoad()
						if ( res._id )  id = res._id
						loadForm(id, isrep)											// reaload form
						relations($el)													// realations
					}
				}, dat)
			
			} else if ( $el.hasClass('br-page') ) {
				
				// Page
				var pg = $el.clone()
				pg.find('.br-panel').each( function() {
					var f = $(this).children('.br-form')
					if ( f.length > 0 ) {
						$(this).attr('data-form', $(f[0]).attr('id'))
						f.remove()
					}
				})
				pg.find('div.ui-resizable-handle').remove()
				pg.find('.ui-resizable').removeClass('ui-resizable')
				pg.find('.ui-tabs').removeClass('ui-tabs')
				pg.find('.ui-widget').removeClass('ui-widget')
				pg.find('.ui-widget-content').removeClass('ui-widget-content')
				pg.find('.ui-corner-all').removeClass('ui-corner-all')
				pg.find('.ui-corner-bottom').removeClass('ui-corner-bottom')
				pg.find('.ui-tabs-panel').removeClass('ui-tabs-panel')
				var	par = {
						cmd: 'POST',
						db: app,
						coll: 'pages',
						usercode: 'ide'
					}
					, dat = {
						name: pg.attr('id'),
						html: outerHtml( pg )
					}
					, id = $el.data('_id') 
				if ( id )  dat._id = id
				remote(par, function(res) {
					if ( !id )  onLoad()
					if ( res.newid )  $el.data('_id', res.newid)
				}, dat)
			
			} else if ( $el.hasClass('br-script') ) {
				
				// Script
				var	par = {
							cmd: 'POST',
							db: app,
							coll: 'scripts',
							usercode: 'ide'
						}
					, dat = {
							name: $el.find('input#name').val(),
							code: $el.data('editor').getValue(),
							updated: new Date().getTime()
						}
					, id = $el.data('_id')
				if ( id )  dat._id = id
				remote(par, function(res) {
					if ( !id ) {
						$el.data('_id', res._id)
						onLoad()
					}
				}, dat)
			
			} else if ( $el.hasClass('br-menu') ) {
				
				// Menu
				var	par = {
						cmd: 'POST',
						db: app,
						coll: 'application',
						usercode: 'ide'
					},
					dat = {
						section: 'menu',
						menu: $el.data('editor').getValue()
					},
					id = $el.data('_id')
				if ( id )  dat._id =id
				remote(par, function(res) {
					if ( res.newid )  $el.data('_id', res.newid)
				}, dat)
			
			} else if ( $el.hasClass('br-table') ) {
				
				// Table
				page.forms[0].save(function(res) {
					page.forms[0].retrieve()
				})
				
			}
		} else {
			alert( translate('Nothig to save') )
		}
	}
}




/* Delete component
*/
function onDelete() {
	var app = appName()
	if ( app ) {
		var el = ws.children()[0]
		if ( el ) {
			var $el = $( el ), coll
				, id = $el.data( '_id' )
			if ( !id )  return alert('No id fund')
			if ( $el.hasClass('br-report') )  coll = 'reports'
			else if ( $el.hasClass('br-form') )  coll = 'forms'
			else if ( $el.hasClass('br-page') )  coll = 'pages'
			else if ( $el.hasClass('br-script') )  coll = 'scripts'
			else  return alert('Unknown component')
				
			var _delete = function() {
				remote( {cmd: 'DEL', db: appName(), app: appName(), coll: coll, where:{_id: id}, usercode: 'ide'}, function(res) {
					if ( res.dbret )  alert( res.dbret )
					else {
						ws.empty()
						onLoad()
					}
				})
			}
		
			var dlg = $('<div>Are you sure you want to delete this '+ coll.substring(0,coll.length-1) +'?</div>')
			dlg.dialog({
				modal: true,
				buttons: {
					Delete:  function() { _delete();  dlg.dialog('close') },
					Cancel: function() {	dlg.dialog('close')	}
				},
				close: function() { dlg.dialog('destroy') }
			})
		}
	}
}



/* Convert br-fields labels to real fields
*/
function toInput( html ) {
	var frm = $( html )
	frm.find('.br-field').each( function() {
		var type = $(this).attr('type'),
			f
		if ( type == 'select' || type == 'textarea')  f = $('<' + type + '/>')
		else  f = $('<input type="' + type + '"/>')
		copyAttr( this, f )
		$(this).replaceWith( f )
	})
	frm.find('.br-button').each( function() {
		var $this = $(this),
			f = $('<button type="button">' + $this.text() + '</button>')
		copyAttr( this, f )
		$this.replaceWith( f )
	})
	return frm
}











/*********************************************
 * 				
 *********************************************/
/* Return application name
*/
function appName() {
	var app = $('#app-name').val()
	if ( app )  return app
	else  alert( translate('Please write application name') )
	return null
}


/* Convert rgb color to hex
*/
function rgb2hex( rgb ) {
	if ( rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/) ) {
		return "#" + ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
				("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
				("0" + parseInt(rgb[3],10).toString(16)).slice(-2)
	} else {
		return ''
	}
}



function copyAttr( from, to ) {
	var len = from.attributes.length,
		$to = $( to )
	for ( var i=0; i < len; i++ ) {
		if ( from.attributes[i].nodeName != 'type' )
			$to.attr( from.attributes[i].nodeName, from.attributes[i].value )
	}
}


function setPos( el, ev ) {
	var off = el.offset(),
		pos = {}
	pos.left = ev.pageX - off.left
	pos.top = ev.pageY - off.top
	el.data('relativePos', pos)
}

