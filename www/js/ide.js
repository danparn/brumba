/*
 * Brumba
 *
 * © 2012-2016 Dan Parnete
 * Dual licensed under the MIT and GPL licenses.
*/

const
	selectSign = $('<div class="br-select-sign">^</div>'),	// used for select fields
	cssFields = 'left,top,width,height,background-color,color,text-align'

	
var propElem = null				// element you see properties of
	, forms = null					// forms list of application
	, reports = null				// reports list of application
	, ws = null							// workspace
	, onProp = false				// focus is on Properties dialog
	, page = null



/* Main brumba object
*/
var br = {
	lang: sessionStorage.getItem( 'br.lang' ),
	usercode: sessionStorage.getItem( 'br.usercode' ),
	userid: sessionStorage.getItem( 'br.userid' ),
	username: sessionStorage.getItem( 'br.username' ),
	useradm: sessionStorage.getItem( 'br.useradm' )
}
if ( !br.usercode ) window.location.href = window.location.origin + '/idelogin.html'
	


$(function() {
	// Menu
	accordionMenu( function(item) {
		//console.log( item )
	})
	
	$('button').button()
	
	// Workspace
	var selector
	ws = $('#workspace')
	ws.drag('start', function(ev, dd) {
		if ( ! ws.children().hasClass('br-page') ) {
			selector = true
			return $('<div class="selector" />').css('opacity', .65).appendTo( document.body )
		} else selector = false
	}).drag( function(ev, dd) {
		if ( selector )
			$(dd.proxy).css({
				top: Math.min(ev.pageY, dd.startY),
				left: Math.min(ev.pageX, dd.startX),
				height: Math.abs(ev.pageY - dd.startY),
				width: Math.abs(ev.pageX - dd.startX)
			})
	}).drag('end', function(ev, dd){
		if ( selector ) $(dd.proxy).remove()
	})
   
	$.drop({multi: true})
   
	ws.mousedown( function(ev) {
		onProp = false
		$('.selected').removeClass('selected')
		$('.br-contextMenu').remove()
	})
	
	$('#menubar').click( function(ev) {
		$('.selected').removeClass('selected')
	})
	
	// Key mapping
	$( document ).keydown( function(ev) {
		var k = ev.which

		// CTRL+S
		if ( k == 83 && ev.ctrlKey ) {
			var hbut = $('.br-html-editor button')
			if ( hbut[0] ) hbut.trigger('click')
			else onSave()
			ev.preventDefault()
 
		// SHIFT+CTRL+V
		} else if ( k == 86 && ev.shiftKey && ev.ctrlKey ) {
			var htm = $(localStorage.getItem('br.clipboard'))
			htm.each( function() { setElement($(this)) })
			var p = ws.children()
			if ( p.hasClass('br-form') ) {
				if ( p.hasClass('br-tabular') ) p = p.find('.br-detail')
				p.append(htm)
			}
			ev.preventDefault()
		}

		// Below valid only for selected objects
		if ( onProp )  return
		var sel = $('.selected')
		if ( sel.length == 0 )  return

		// Arrow keys:  move selected elements, or change size if shiftKey is pressed
		if ( k >= 37 && k <= 40 ) {
			if ( sel.length > 0 ) {
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
			sel.remove()
			ev.preventDefault()
		
		// SHIFT+CTRL+C
		} else if ( k == 67 && ev.shiftKey && ev.ctrlKey ) {
			localStorage.setItem('br.clipboard', outerHtml(sel))
			ev.preventDefault()
		}
	})
	
	// properties dialog
	$( "div#properties" ).dialog({
			autoOpen: false,
	}).click( function() {
		onProp = true
	})
	bindProp($('.br-prop'))

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
	
	}).change( function() {
		$(this).css( 'background-color', $(this).val() )
		onChangeProperty( this )
	})
	
	onLoad()
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
	resetForm($('#properties'))
}



/* Show element's properties
*/
function showProperties( elem ) {
	if ( !$('#properties').dialog('isOpen') || !elem )  return
	propElem = $(elem)
	
	var p = $('#properties')
		, ty = p.find('select[name="type"]')
		, tx = p.find('input[name="text"]')
		, id = p.find('input[name="id"]')
		, typ
	
	resetForm(p)
	p.find('input.color-field').removeAttr('style')

	// type	
	if ( propElem.hasClass('br-field') ) {
		typ = propElem.attr('type')
	} else { 
		if ( propElem.hasClass('br-page') )  typ = 'PAGE'
		else if ( propElem.hasClass('br-report') )  typ = 'REPORT'
		else if ( propElem.hasClass('br-band') )  typ = 'BAND'
		else if ( propElem.hasClass('br-nested') )  typ = 'NESTED'
		else if ( propElem.hasClass('br-button') )  typ = 'button'
		else  typ = elem.tagName
	}
	ty.val(typ)
	
	// Enable type for inputs, disable for others
	if ( propElem.hasClass('br-field') ) {
		ty.removeProp('disabled')
		if ( typ != 'radio' ) tx.prop('disabled', true)
	} else { 
		ty.prop('disabled', true)
		tx.removeProp('disabled')
	}
	
	id.val( propElem.attr('id') )
	if ( propElem.hasClass('br-label') || propElem.hasClass('br-button') ) p.find('input[name="text"]').val(propElem.text())
	if ( propElem.hasClass('br-hidden') )  p.find('input[name="hidden"]').prop('checked', true)
	if ( typ == 'IMG' ) p.find('input[name="text"]').val(propElem.attr('alt'))
	
	// delete last element data-* attributes
	p.find('tr.remove').remove()
	
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
	// number
	else if ( typ == 'number' ) {
		dataElem('input', 'decimals', 'number')
		dataElem('textarea', 'formula')
	}
	// time
	else if ( typ == 'time' ) {
		dataElem('textarea', 'formula')
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
	if ( ! _.contains(['textarea','checkbox','radio','NESTED'], typ) ) {
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
	if ( $('.br-report')[0] || propElem.hasClass('br-label') ) {
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
	
	// set element data-* attributes
	function dataElem(tag, name, type) {
		var s = '<tr class="remove"><td><label>' + name + ':</label></td><td>' + '<' + tag + ' name="data-' + name + '"'
		if ( type )  s += ' type="' + type + '"'
		s += ' class="br-prop"/></td></tr>'
		var tr = $(s)
			, el = tr.find(tag)
		if ( tag == 'textarea' ) {
			var h = (type > 0) ? ''+type : "50"
			el.attr('style', 'width:100%;height:'+h+'px')
		}
		bindProp(el)
		p.find('table').append(tr)
		el.val(propElem.attr('data-' + name))
		return el
	}
}



/* Change element propertie
*/
function onChangeProperty( property ) {
	if ( !propElem )  return
	
	var prop = $(property)
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
	else if ( pn == 'text' ) {
		if ( propElem[0].tagName == 'IMG' ) propElem.attr('alt', val)
		else if ( !propElem.hasClass('br-field') )  propElem.text(val)
	} else if ( prop.attr('type') == 'checkbox') {
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
	
	// report landscape
	if ( pn == 'data-landscape') {
		var w, b = propElem.find('.br-band')
		if ( property.checked )  w = 842 
		else  w = 595
		b.css('width', w)
		pageNumPos()
	}
	
	// type style
	if ( pn == 'type') {
		// Remove last specific style
		if ( last == 'select') {
			propElem.children().remove()
		} else if ( _.contains(['checkbox','radio'], last)  ) {
			propElem.css('width', '100px')
			propElem.text(propElem.attr('id'))
		}
		setTypeStyle(propElem, val)
		showProperties(propElem)
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
	} else if ( type == 'radio') {
		el.css('width', '14px')
		el.text('o')
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
			containment: '#workspace',
			close: function() { events.dialog('destroy'); events.remove() }
		})	
		editor = CodeMirror( ed.get(0), {
			mode: 'javascript',
			lineNumbers: true,
			autoCloseBrackets: true		,
			smartIndent: false
		})
		editor.on("gutterClick", CodeMirror.newFoldFunction(CodeMirror.braceRangeFinder))
		events.data('editor', editor)
		events.find('.CodeMirror-scroll').css( 'height', ed.css('height') )
	}
	var txt = $('.br-form').data('events')
	if ( txt )  editor.setValue( txt )
}











/*********************************************
 * 				Server script
 *********************************************/
/* Open script
*/
function openScript() {
	var script = $('<div class="br-script">' +
										'<h3>Script name:</h3><input id="name" />' +
										'<label id="forexternal">external file:</label><input id="external" type="checkbox" />' +
										'<div class="br-editor" />' +
								'</div>')
	$('.br-events').dialog('close')
	ws.empty()
	ws.removeAttr('style')
	ws.append( script )
	var editor = CodeMirror( script.find('.br-editor').get(0), {
			mode: 'javascript',
			lineNumbers: true,
			indentWithTabs: true,
			smartIndent: false,
			tabSize: 2,
			autoCloseBrackets: true		
		})
	editor.on("gutterClick", CodeMirror.newFoldFunction(CodeMirror.braceRangeFinder))
	script.data( 'editor', editor )
}


/* Load script
*/function loadScript( id ) {
	var par = {
			cmd: 'GET',
			db: br.app,
			coll: 'scripts',
			where: { _id: id }
		}
	remote( par, function(res) {
		if ( !res.err ) {
			var script = $('.br-script')
			if ( script ) {
				script.find('#name').val( res[0].name )
				script.data('editor').setValue( res[0].code )
				var ext = script.find('#external')
				if ( res[0].external ) ext.prop('checked', true)
				else ext.removeProp('checked')
				script.data( '_id', res[0]._id )
			}
		}
	})
}







/*********************************************
 * 				REFERENCES
 *********************************************/
/* Open references
*/
function openReferences() {
	if ( !page ) page = new Page()
	page.tag = $('<div class="br-table"><h3>References</h3>' +
										'<button onclick="generateReferences()">Generate</button><br/><br/>' +
								'</div>')
	page.tag.find('button').button()
	$('.br-events').dialog('close')
	ws.empty()
	ws.removeAttr('style')
	ws.append(page.tag)
	
	remote({cmd:'GET', db:br.app, coll:'forms', where:{name:'_references'}}, function(res) {
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
	$('.br-events').dialog('close')
	ws.empty()
	ws.removeAttr('style')
	ws.append( menu )
	var editor = CodeMirror( menu.find('.br-editor').get(0), {
			indentWithTabs: true,		
			smartIndent: false
		})
	menu.data( 'editor', editor )
	//menu.find('.CodeMirror-scroll').css( 'height', ed.css('height') )
	remote({cmd:'GET', db:br.app, coll:'application', where:{section:'menu'}}, function(res) {
		if ( ! res.dbret && res[0] ) {
			editor.setValue( res[0].menu )
			menu.data( '_id', res[0]._id )
		} else  editor.setValue( 'write here your menu schema' )
	})
}





/*********************************************
 * 				BUTTON HANDLERS
 *********************************************/
/* Load handler
*/
function onLoad() {
	var app = localStorage.getItem('br.app')
	if ( app ) {
		br.app = app
		br.db = app
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
				sort: { name: 1 }
			}
		remote( par, function(res) {
			if ( !res.err ) {
				var menu = $('li#forms ul').empty()
				forms = res
				$('#application').text('Application: ' + app )
				for ( var i=0; i < res.length; i++ ) {
					var el = $('<li class="menu-item"><a href="#" onclick="loadForm(\'' + res[i]._id + '\')">' + res[i].name + '</a></li>')
					menu.append( el )
					el.click( selmenu )
				}
				all()
			}
		})
		
		function all() {		
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
}





/* Save button handler
*/
function onSave() {
	var app = br.app
	if ( app ) {
		var el = ws.children()[0]
		if ( el ) {
			var $el = $(el)
			if ( $el.hasClass('br-form') ) {
				
				// Form
				$el.find('.selected').removeClass("selected")
				$el.find('.ui-selectee').removeClass("ui-selectee")
				$el.find('.ui-resizable').removeClass('ui-resizable')
				$el.find('.ui-resizable-handle').remove()
				$el.find('img').each( function() {
					var img = $(this)
					if ( img.attr('src') != '#' ) img.css('width', 'auto')
					img.removeAttr('src')				
				})
				$el.find('.br-contextMenu').remove()
				//$el.find('.watermark').remove()
				$el.find('.br-nested').empty()
				var frm = toInput( el )
				frm.find('[type="image"]').val('')
				var par = {
						cmd: 'POST',
						db: app,
						app: app,
						coll: 'forms'
					}
					, dat = {
						name: frm.attr('id'),
						html: outerHtml( frm )
					}
					, id = frm.data('_id')
					, isrep = $el.hasClass('br-report')
				if ( isrep )  par.coll = 'reports'
				if ( id )  dat._id = id
				var ed = $('.br-events').data('editor')
				if ( ed ) dat.events = ed.getValue()
				else dat.events = frm.data('events')
				remote(par, function(res) {
					if ( res.dbret < 0 )  alert( translate('Database error: ') + res.dbret)
					else {
						if ( !id )  onLoad()
						if ( res._id )  id = res._id
						loadForm(id, isrep)											// reaload form
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
						app: app,
						coll: 'pages'
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
							app: app,
							coll: 'scripts'
						}
					, dat = {
							name: $el.find('input#name').val(),
							code: $el.data('editor').getValue(),
							updated: new Date().getTime(),
							external: null
						}
					, id = $el.data('_id')
							
				if ( id )  dat._id = id
				if ( $el.find('#extern').is(':checked') ) dat.external = true
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
						app: app,
						coll: 'application'
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




/* HTML mode
*/
function onHtml() {
	var form = $(ws.children())
		, id = form.data('_id')
		, coll = 'forms'
		, txt
	if ( form.hasClass('br-report') ) coll = 'reports'
	else if ( form.hasClass('br-page') ) coll = 'pages'
	else if ( !form.hasClass('br-form') ) {
		alert('Only forms/pages/reports could be edited!')
		return
	}
	
	remote({cmd: 'GET', db: br.app, coll: coll, where: {_id: id}}, function(res) {
		if ( res.err || !res[0] ) txt = JSON.stringify(res)
		else txt = style_html(res[0].html)
	
		var htm = $('<div title="HTML editor" class="br-html-editor" />')
			, ed = $('<div class="br-editor" />')
			, editor
			, but = $('<button>Save</button>').button().click( function() {
					remote({cmd: 'POST', db: br.app, coll: coll}, function(res) {
						if ( coll == 'pages' ) loadPage(id)
						else loadForm(id, coll == 'reports')
					}, {
						_id: id,
						html: editor.getValue()
					})
				})
		htm.append( but )
		htm.append( ed )
		htm.dialog({
			width: 1000,
			height: 600,
			containment: '#workspace',
			close: function() { htm.dialog('destroy'); htm.remove() }
		})
		editor = CodeMirror(ed.get(0), {
			mode: 'htmlmixed',
			value: txt,
			lineNumbers: true,
			autoCloseTags: true,
			smartIndent: false
		})
	})
}




/* Run button handler
*/
function onRun() {
	window.open(window.location.origin)
}



/* Delete component
*/
function onDelete() {
	var app = br.app
	if ( app ) {
		var el = ws.children()[0]
		if ( el ) {
			var $el = $(el), coll
				, id = $el.data( '_id' )
			if ( !id )  return alert('No id fund')
			if ( $el.hasClass('br-report') )  coll = 'reports'
			else if ( $el.hasClass('br-form') )  coll = 'forms'
			else if ( $el.hasClass('br-page') )  coll = 'pages'
			else if ( $el.hasClass('br-script') )  coll = 'scripts'
			else  return alert('Unknown component')
				
			var _delete = function() {
				remote({cmd:'DEL', db:br.app, app:br.app, coll:coll, where:{_id: id}}, function(res) {
					if ( res.dbret )  alert( res.dbret )
					else {
						ws.empty()
						onLoad()
						if ( coll == 'scripts' ) openScript()
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

function copyAttr( from, to ) {
	var len = from.attributes.length
		, $to = $( to )
	for ( var i=0; i < len; i++ ) {
		if ( from.attributes[i].nodeName != 'type' )
			$to.attr( from.attributes[i].nodeName, from.attributes[i].value )
	}
}



function setPos( el, ev ) {
	if ( !el[0] ) el = $(el)
	var off = el.offset()
		, pos = {}
	pos.left = ev.pageX - off.left
	pos.top = ev.pageY - off.top
	el.data('relativePos', pos)
}



/* Convert rgb color to hex
*/
function rgb2hex( rgb ) {
	if ( rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/) ) {
		return "#" + ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
				("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
				("0" + parseInt(rgb[3],10).toString(16)).slice(-2)
	} else return ''
}



