/*
 * Brumba
 *
 * © 2012-2013 Dan Parnete
 * Dual licensed under the MIT and GPL licenses.
*/


/* Main object
*/
var main = {
	app: localStorage.getItem( 'br.app' ),
	db: localStorage.getItem( 'br.db' ),
	lang: localStorage.getItem( 'br.lang' ),
	usercode: localStorage.getItem( 'br.usercode' ),
	userid: localStorage.getItem( 'br.userid' ),
	username: localStorage.getItem( 'br.username' ),
	useradm: localStorage.getItem( 'br.useradm' ),
	menupg: null,
	menuid: null
}

var loadingIndicator = null
	, page

/* Main function
*/
$(function() {
	// Page instance
	page = new Page()
	
	//$(document).tooltip()
	$.ajaxSetup( {cache: true} )

	// Loading indicator
	loadingIndicator = $('<span class="loading-indicator"><label>Loading...</label></span>').appendTo(document.body)
		.css( 'position', 'absolute' )
		.css( 'top', $(window).height() / 2 )
		.css( 'left', $(window).width() / 2 )
	loadingIndicator.fadeOut()
	
	$('div#leftbar').resizable({
		handles: 'e',
		reverseResize: $('div#workspace')
	})

	// Menu
	var menu = $(localStorage.getItem('br.menu'))
	$('div#menubar').append(menu)
	$('ul#menu').addClass('accordion')
	accordionMenu( function(pg, prm) {
		page.prm = prm
		pageLoad( pg )
	})

	// Translate
	if ( main.lang ) {
		var par = {cmd: 'GET', db: main.app, coll: 'translate',
							fields: {default: 1}, 
							where: {}, usercode: main.usercode}
		par.fields[main.lang] = 1
		par.where[main.lang] = {$exists: true}
		remote(par, function(res) {
			if ( res.err || !res[0] ) main.hasLang = false
			else {
				main.hasLang = true
				main.langData = res
				menu.find('a').each( function() {
					$(this).text(translate($(this).text(), main.lang))
				})
				$('button').each( function() {
					$(this).text(translate($(this).text(), main.lang))
				})
			} 
			$('button').button()
		})
	} else $('button').button()

})



/* Load page
*/
function pageLoad( pgname ) {
	if ( !pgname )  return
	
	var p = pgname.indexOf( ':' )
	if ( p > 0 ) {
		main.menupg = pgname.substr( 0, p )
		main.menuid = pgname.substr( p+1  )
	} else {
		main.menupg = pgname
	}
	
	var sp = main.menupg.split( '.' )
	remote( {cmd: 'GET', db: main.app, coll: sp[0], where: {name: sp[1]}, usercode: main.usercode}, function(res) {
		if ( res.err || !res[0] )  return
		
		var $pg = $('div#page')
		$pg.empty()
		page.tag = $(res[0].html)
		var pans = page.tag.find('.br-panel')
		if ( pans.length == 0 && res[0].events )  page.tag.data('events', res[0].events)
		page.tag.find('span.ui-icon-close').remove()
		page.tag.find('.watermark').remove()
		
		page.tag.find( 'input[type="filelink"]' ).each( function() {						// filelink
			var $this = $(this)
				, img = $( '<span class="ui-icon ui-icon-folder-open" style="position: absolute"></span>' )
				, l = parseInt($this.css('left'), 10) + parseInt($this.css('width'), 10) - parseInt(img.css('width'), 10) + 2
			img.css( 'top', $this.css('top') )
			img.css( 'left', l )
			img.click( function() {
				fileUpload( main.db, function(res) {
					$this.data( 'id', res.newid )
					$this.val( res.filename )
					$this.trigger( 'change' )
				})
			})
			$this.click( function() {
				fileShow( main.db, $this.data('id') )	
			})
			$this.prop( 'readonly', true )
			page.tag.append( img )
		})
		
		$pg.append( page.tag )
		if ( pans.length == 0 ) {
			pageInit()
		} else {
			var n = pans.length
			pans.each( function() {
				var p = $(this)
					, fname = p.attr('data-form')
				if ( fname ) {
					remote( {cmd: 'GET',	db: main.app, coll: 'forms', where: {name:fname}, usercode: main.usercode}, function(res) {
						if ( res.err )  alert( res.err )
						else {
							var frm = $(res[0].html)
							p.append( frm )
							if ( res[0].events )  frm.data('events', res[0].events)
						}							
						if ( --n == 0 )  pageInit()
					})
				} else {
					n--
				}
			})
		}
	})
}


/* Initialize page
*/
function pageInit() {
	// Translate
	$('.br-label').each( function() {
		$(this).text(translate($(this).text(), main.lang))
	})

	// Tabs
	var tabs = $( '.br-tabs' )
	if ( tabs ) {
		tabs.tabs().tabs({ active: 0 })
		tabs.removeClass( 'ui-widget' )			// hack for font override
		tabs.data('height', parseInt(tabs.css('height'), 10) / 5 * 4 )
	}
	
	// Add Forms	page.recid = null
	page.forms = []
	$('.br-form').each( function(i) {
		var f,  $this = $(this),  name = $this.attr( 'id' )
		if ( $this.hasClass('br-tabular') )  f = new Tabular( name, $this )
		else  f = new Form( name, $this )
		page.forms.push( f )
	})
	if ( page.forms.length == 0 ) {
		alert( 'No forms found' )
		return
	}
	
	// Set form master
	for ( var i=0; i < page.forms.length; i++ ) {
		var form = page.forms[i]
		if ( form.query ) {
			var mas
				, field =  form.query.field || form.query.concat
			if ( field && !form.query.coll ) {
				var p = field.lastIndexOf( '.' )
				if ( p > 0 )  {
					mas = field.substr( 0, p )
					form.field = field.substr( p+1 )
				} else {
					form.field = field
				}
			}
			for ( var j=page.formPos(form); j >= 0; j-- ) {
				var f = page.forms[j]
				if ( mas ) {
					if ( f.query.field == mas ) {
						form.master = f
						break
					}
				} else if ( f.query.coll ) {
					form.master = f
					break
				}
			}
			if ( !form.master )  alert( 'No master found for query.field:  ' + form.query.field )
		} else {
			form.master = form
		}
	}
//for ( var i=0; i < page.forms.length; i++ )  console.log( 'form %s   mas %s', page.forms[i].name, page.forms[i].master.name )

	// Select
	var select = $( 'select' )
	sel( 0 )
	
	function sel( n ) {
		if ( n < select.length ) {
			var $select = $( select[n] )
				, query = $select.attr('data-query')
				, fields = $select.attr('data-fields')
			if ( query ) {
				var q = readJson( query )
				if ( Array.isArray(q) ) {			// array of data
					for ( var i=0, len=q.length; i < len; i++ ) {
						var s = q[i].lab || q[i].val
						$select.append( '<option value="' + q[i].val + '">'+ s + '</option>' )
					}
					sel( n+1 )
				} else if (  fields ) {
					if ( !q.cmd )  q.cmd = 'GET'
					q.db = main.db
					q.app = main.app
					q.usercode = main.usercode
					if ( q.fields ) {
						var sp = strSplit(q.fields, ',')
						q.fields = {}
						for ( var i=0; i < sp.length; i++ )  q.fields[sp[i]] = 1
					}
					remote( q, function(res) {
						if ( res.err )  return
						var fld = strSplit(fields, ',' )
							, txt = ''
						$select.append( '<option></option>' )
						for ( var i=0, len=res.length; i < len; i++ ) {
							var r = res[i]
							txt = ''
							for ( var j=1; j < fld.length; j++ ) {
								var fl = fld[j]
								if ( j > 1 ) { 
									if ( fld[j].charAt(0) == '+' ) {
										fl = fld[j].substr(1)
										txt += ' '
									} else {
										txt += ' - '
									}
								}
								if ( fl.charAt(0) == '\'' )  txt += fl.substring( 1, fl.length-2 )
								else  txt += r[fl]
							}
							$select.append( '<option value="' + r[fld[0]] + '">'+ txt + '</option>' )
						}
						sel( n+1 )
					})
				} else if (  q.cmd == 'SRV' ) {		// olready formated from server script 
					q.db = main.db
					q.app = main.app
					q.usercode = main.usercode
					remote( q, function(res) {
						if ( res.err )  return
						$select.append( res.html )
						sel( n+1 )
					})
				} else {
					sel( n+1 )
				}
			}
		} else {
			onOpen( 0 )
		}
	}

	// Form open event
	function onOpen( n ) {
		if ( n < page.forms.length ) {
//console.log( 'onOpen ' + page.forms[i].name )
			var form = page.forms[n]
				, err = $(form).triggerHandler('open')
			if ( form instanceof Tabular )  form.addRows()
			form.setChangeField()
			if ( !err )  onOpen( n+1 )
		} else {
			fieldsFunc()
			list()
		}
	}

	function fieldsFunc() {
		
		// Date		$( 'input[type*="date"]' ).each( function() {
			var fld = $(this)
			fld.data('fld', fld)
			fld.datepicker({
				showWeek: true ,
				dateFormat: dateFormat,
				constrainInput: false,
				onSelect: function(date, inst) { 
					fld.data('fld').val( date )
				}
			})

			fld.attr( 'title', 'format: dd/mm/yyyy shortcuts: + (today) d (day of current month) d.m  (day and month)' )
		})
	
		// Autocomplete
		$( 'input[type="autocomplete"]' ).each( function() {
			Autocomplete( $(this) )
		})
		
		//Buttons
		$('.br-button').button()
		
	}

	// List
	function list() {
		var mas = page.forms[0]
		$('#listbar').empty()
		if ( mas.tag.hasClass('br-tabular') ) {
			page.command( 'R', 0 )
		} else {
			
			var fields = mas.tag.attr( 'data-fields' )
				, query = mas.query
				
			// Columns	
			if ( fields &&  query ) {
				var fld = strSplit(fields, ',')
				page.listCols = []
				for ( var i=0; i < fld.length; i++ ) {
					var sp = fld[i].split( /\s*:\s*/ )
						, c = { name: sp[0] }
					
					if ( sp[1] )  c.width = parseInt( sp[1], 10 )
					else  c.width = 50
					if ( sp[2] )  c.display = sp[2]
					else {
						var s = strRep( strRep(c.name, '_', ' '), '-', ' ' )
						c.display = strCapitalize( s )
					}
					c.process = function( cell, id ) {
						$(cell).click( function(ev) {
							page.recid = ( typeof page.recid == 'number' ) ? parseInt(id, 10) : id
							page.command( 'N', 0 )
							page.command( 'R', 0 )
						})
					}
					page.listCols.push( c )
				}
	
				//  Flexigrid
				page.list = $('<table id="list"></table>')
				$('#listbar').append( page.list )
					
				var options = {
					url: '/brumba',
					dataType: 'json',
					colModel: page.listCols,
					singleSelect: true,
					usepager: true,
					useRp: false,
					rp: 12,
					height: 300,
					
					onSubmit: function() {
						var q = mas.querySet('SRV', true, true)
						if ( page.srcond ) {
							if ( q.where )  $.extend( q.where, page.srcond )
							else  q.where = page.srcond
						}
						q.script = 'flexigridData'
						q.limit = this.rp
						q.page = this.newp || 1
						this.url = '/brumba?' + JSON.stringify( q )
						return true
					},
					
					preProcess: function(data) {
						if ( data.rows[0] )  page.recid = data.rows[0]._id		// for _id type in rowClick
						for ( var i=0, len=data.rows.length; i < len; i++ ) {
							var rec = data.rows[i]
								, row = { id: rec._id, cell: [] }
							for ( var j=0; j < page.listCols.length; j++ ) {
								var name = page.listCols[j].name
									, val = rec[name]
								if ( !val )  val = ''
								else {
									if ( val.lab )  val = val.lab
									else {
										var fld = mas.tag.find('#'+name)
										if ( fld.is('select') )  val = fld.find('option[value="'+val+'"]').text()
										else {
											switch ( fld.attr('type') ) {
												case 'date':  val = strDate(new Date(val));  break
												case 'datetime':  val = strDate(new Date(val), true);  break
											}
										}
									}
								}
								row.cell.push( val )
							}
							data.rows[i] = row
						}
						return data
					}
				}
					
				page.list.flexigrid( options )
			}
		}
	}
}

	


/* Toolbar handlers
*/
function butSearch() {
	page.search()
}

function butSave() {
	if ( page.prm.indexOf('w') >= 0 ) {
		if ( !page.insave ) {
			page.insave = true
			page.command( 'S', 0 )
		}
	} else {
		alert('Permission denied')
	}
}

function butDelete() {
	if ( page.prm.indexOf('d') >= 0 )  page.delete()
	else  alert('Permission denied')
}

function butNew() {
	page.newrec()
}
