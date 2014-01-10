/*
 * Brumba
 *
 * © 2012-2013 Dan Parnete
 * Dual licensed under the MIT and GPL licenses.
*/

/*********************************************
 * 				PAGE
 *********************************************/
/* New Page
*/
function newPage() {
	var pg = $('<div id="' + strRep(strNowDateTime(),' ','_') + '" class="br-page br-panel" type="PAGE" />')
	closeEvents()
	ws.empty()
	ws.append( pg )
	splitter( pg, 'H' )
	setPage( pg )
}


var contextMenuPage = {
	bindings: {
		
		// Split Horizontal
		'split-h': function(el) {
			splitter( $(el), 'H' )
		},
	
		// Split Vertical
		'split-v': function(el) {
			splitter( $(el), 'V' )
		},
		  
		  
		// Set Form
		'set-form': function(el) {
			getForm( function(res) {
				if ( res ) {
					var frm = $( res[0].html )
					$(el).find('.br-form').remove()
					$(el).append( frm )
					frm.click( function() {
						showProperties( this )
					})
				}
			})
		},
		
		  
		// Add Tab
		 'add-tab': function(el) {
			var tabs = $( '.br-tabs' ).get(0)
			if ( !tabs ) {
				tabs = $( '<div class="br-tabs" style="height:100%;">' + 
							'<ul></ul>' +
						'</div>' )
				$(el).append( tabs )
				tabs.tabs()
				tabs.find( '.ui-tabs-nav' ).contextMenu( 'contextMenuPage', {} )
			} else  tabs = $( tabs )
			
			var dlg = $('<div><form><fieldset>' +
							'<label for="tabname">Tab name:</label>' + 
							'<input id="tabname"/>' +
						'</fieldset></form></div>')
					, tn = $( dlg.find('input#tabname').get(0) )
					, tab = "<li><a href='#{href}'>#{label}</a> <span class='ui-icon ui-icon-close' role='presentation'>Remove Tab</span></li>"
			dlg.dialog({
				buttons: {
					Ok: function() {
						dlg.dialog( "close" )
					}
				},
				close: function() {
					$(this).remove()
				}
			})
			
			tn.change( function() {
				var s = $(this).val()
						, p = addPanel( tabs )
						, tabn = tabCounter()
						, label = s || 'Tab ' + tabn
						, id = 'tabs-' + tabn
						, lis = tab.replace( /#\{href\}/g, "#" + id ).replace( /#\{label\}/g, label )
						, li = $( tab.replace( /#\{href\}/g, "#" + id ).replace( /#\{label\}/g, label ) )
				setPanel( p )
				p.attr('id', id)//.css('height','100%')
				tabs.find( '.ui-tabs-nav' ).append( li )
				dlg.dialog('close')
				tabs.tabs( 'refresh' )
				onRemove( li )
			})
		},
		
		  
		// Copy to App
		'copy-to-app': copyToApp
	}
}


function setPage( page ) {
	page.contextMenu( 'contextMenuPage', contextMenuPage )
	$('.selected').removeClass('selected')
	onRemove( $('.br-tabs') )
}


/* Remove tab icon handler
*/
function onRemove( tab ) {
	tab.delegate( 'span.ui-icon-close', 'click', function() {
		var panelId = $( this ).closest( 'li' ).remove().attr( 'aria-controls' )
		$( '#' + panelId ).remove()
		$('.br-tabs').tabs( 'refresh' )
	})
}



/* Create 2 panes with splitter
*/
function splitter( el, type ) {
	var p = createSplitter( el, type )
	setPanel( p[0] )
	setPanel( p[1] )
}


/* Set br-panel properties
*/
function setPanel( pane ) {
	pane.dblclick( function() { showProperties(ws.children().get(0)) })
		.contextMenu( 'contextMenuPage', contextMenuPage )
}		


function loadPage( id ) {
	closeEvents()
	remote( {cmd: 'GET', db: appName(), coll: 'pages', where: {_id: id}, usercode: 'ide'}, function(res) {
		if ( ! res.dbret ) {
			ws.empty()
			ws.removeAttr('style')
			ws.append( res[0].html )
			var pg = $( ws.children() )
pg.removeAttr( '_id' )
$('.br-pane').removeClass('br-pane').addClass('br-panel')
			pg.data('_id', id )
			pg.find('.br-panel').each( function() {
				var p = $(this),
					fname = p.attr('data-form')
				setPanel( p )
				if ( fname ) {
					remote( {cmd:'GET',	db:appName(), coll:'forms', where:{name:fname}, usercode: 'ide'}, function(res) {
						if ( res.dbret )
							alert( res.dbret )
						else {
							var frm = $( res[0].html )
							p.append( frm )
							frm.click( function() {
								showProperties( this )
							})
						}
					})
				}
			})
			setSplitter( $('div.split-s,div.split-e') )
			$('div.br-tabs').tabs().tabs( {active: 0} )
			setPage( pg )
			showProperties( pg.get(0) )
		}
	})
}



function tabCounter() {
	var max = -1
	$( '.ui-tabs-panel' ).each( function() {
		var n = parseInt( $(this).attr('id').substr(5), 10 )
		if ( n > max )  max = n
	})
	return max+1
}


/* Copy current component to other application
*/
function copyToApp() {
	var el = ws.children()
		, _id = el.data('_id')
		, coll
console.log( el.get(0) )
	if ( !_id )  return
	if ( el.hasClass('br-form') )  coll = 'forms'
	else if ( el.hasClass('br-page') )  coll = 'pages'
	else return alert('Cannot identify component')
	
	var dlg = $('<div><label>Host:Port/App:</label><input /></div>')
	dlg.dialog({
		modal: true,
		buttons: {
			Save: function() {
				var url = dlg.find('input').val()
				if ( !url || url == '' )  return alert('Valid url needed!')
				remote( {cmd: 'SRV', script: 'ideSaveTo', url: url, db: appName(), coll: coll, where: {_id: _id}, usercode: 'ide'}, function(res) {
					if ( res.err )  dlg.append('<p style="color:red;">Save ERROR!</p>')
					else  dlg.append('<p>Saved</p>')
				})
			},
			Close: function() { dlg.dialog( "close" ) }
		},
		close: function() { dlg.dialog('destroy') }
	})
}



function getForm( callback, isReport ) {
	if ( isReport && reports || forms ) {
		var dat = []
			, len = (isReport) ? reports.length : forms.length
		for ( var i=0; i < len; i++ )  dat.push( {text: (isReport)?reports[i].name:forms[i].name} )
		listBox( (isReport)?'Reports':'Forms', dat, function(ui) {
			remote( {cmd:'GET',	db:appName(), coll:(isReport)?'reports':'forms', where:{name:ui.item.text()}, usercode: 'ide'}, function(res) {
				if ( res.dbret )  alert( res.dbret )
				else  callback(res)
			})
		})
	} else {
		alert('Forms list not found, check application')
		callback()
	}
}
