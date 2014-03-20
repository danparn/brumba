/*
 * Brumba
 *
 * © 2012-2013 Dan Parnete
 * Dual licensed under the MIT and GPL licenses.
*/


/* Main brumba object
*/
var br = {
	app: sessionStorage.getItem('br.app'),
	db: sessionStorage.getItem('br.db'),
	lang: sessionStorage.getItem('br.lang'),
	usercode: sessionStorage.getItem('br.usercode'),
	userid: sessionStorage.getItem('br.userid'),
	username: sessionStorage.getItem('br.username'),
	useradm: sessionStorage.getItem('br.useradm')
}

var loadingIndicator = null
	, page

$(function() {
	// Page instance
	page = new Page()
	
	//$(document).tooltip()
	$.ajaxSetup({cache: true})

	// Loading indicator
	loadingIndicator = $('<span class="loading-indicator"><label>Loading...</label></span>').appendTo(document.body)
		.css('position', 'absolute')
		.css('top', $(window).height() / 2)
		.css('left', $(window).width() / 2)
	loadingIndicator.fadeOut()
	
	$('div#leftbar').resizable({
		handles: 'e',
		reverseResize: $('div#workspace')
	})

	// Menu
	var menu = $(sessionStorage.getItem('br.menu'))
	$('div#menubar').append(menu)
	$('ul#menu').addClass('accordion')
	accordionMenu( function(pg, prm) {
		page.prm = prm
		var sp = strSplit(pg, ' ')
		br.menuid = sp[1]
		pageLoad(sp[0])
	})

	// Languages
	if ( br.lang ) {
		var par = {cmd: 'GET', db: br.app, coll: 'languages',
							fields: {default: 1}, 
							where: {}}
		par.fields[br.lang] = 1
		par.where[br.lang] = {$exists: true}
		remote(par, function(res) {
			if ( res.err || !res[0] ) br.hasLang = false
			else {
				br.hasLang = true
				br.langData = res
				menu.find('a').each( function() {
					$(this).text(translate($(this).text(), br.lang))
				})
				$('button').each( function() {
					$(this).text(translate($(this).text(), br.lang))
				})
			} 
			about()
		})
	} else about()
	
	function about() {
		$('button').button()
		appScript(br.app + 'Cli')
		pageLoad('forms.About')
	}

})



/* Load page
*/
function pageLoad( pgname ) {
	if ( !pgname )  return
	if ( pgname == 'IDE' ) {
		window.open(window.location.origin + '/IDE.html')
		return
	}
	
	var p = pgname.indexOf(':')
	if ( p > 0 ) {
		br.menupg = pgname.substr(0, p)
		br.menuid = pgname.substr(p+1 )
	} else {
		br.menupg = pgname
	}
	
	var sp = br.menupg.split('.')
	remote({cmd:'GET', db:br.app, coll:sp[0], where:{name: sp[1]}}, function(res) {
		if ( res.err || !res[0] )  return
		
		var $pg = $('div#page')
		$pg.empty()
		page.tag = $(res[0].html)
		var pans = page.tag.find('.br-panel')
		if ( pans.length == 0 && res[0].events )  page.tag.data('events', res[0].events)
		page.tag.find('span.ui-icon-close').remove()
		page.tag.find('.watermark').remove()
		
		$pg.append(page.tag)
		if ( pans.length == 0 ) {
			pageInit()
		} else {
			var n = pans.length
			pans.each( function() {
				var p = $(this)
					, fname = p.attr('data-form')
				if ( fname ) {
					remote({cmd:'GET', db:br.app, coll:'forms', where:{name:fname}}, function(res) {
						if ( res.err )  alert(res.err)
						else {
							var frm = $(res[0].html)
							p.append(frm)
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
	setSplitter($('div.split-s,div.split-e'))

	// Tabs
	var tabs = $('.br-tabs')
	if ( tabs ) {
		tabs.tabs().tabs({active: 0})
		tabs.removeClass('ui-widget')			// hack for font override
		tabs.data('height', parseInt(tabs.css('height'), 10) / 5 * 4)
	}
	
	// Add Forms	page.recid = null
	page.forms = []
	$('.br-form').each( function(i) {
		var f,  $this = $(this),  name = $this.attr('id')
		if ( $this.hasClass('br-tabular') )  f = new Tabular(name, $this)
		else  f = new Form(name, $this)
		page.forms.push(f)
	})
	if ( page.forms.length == 0 ) {
		alert('No forms found')
		return
	}
	
	// Set form master
	for ( var i=0; i < page.forms.length; i++ ) {
		var form = page.forms[i]
		if ( form.query ) {
			var mas = null
				, field =  form.query.field || form.query.concat
			if ( field && !form.query.coll ) {
				var p = field.lastIndexOf('.')
				if ( p > 0 )  {
					mas = field.substr(0, p)
					form.field = field.substr(p+1)
				} else {
					form.field = field
				}
			}
			for ( var j=i; j >= 0; j-- ) {
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
			if ( !form.master )  alert('No master found for query.field:  ' + form.query.field)
		} else {
			form.master = form
		}
	}
//for ( var i=0; i < page.forms.length; i++ )  console.log( 'form %s   mas %s', page.forms[i].name, page.forms[i].master.name )

	// Select
	var select = $('select')
	sel(0)
	
	function sel( n ) {
		if ( n < select.length ) {
			var $select = $(select[n])
				, query = $select.attr('data-query')
			if ( query ) {
				if ( query.indexOf('#') > 0 ) {
					$select.addClass('br-query-args')
					sel(n+1)
				} else {
					Select(select[n], function(res) {
						sel(n+1)
					})
				}
			} else sel(n+1)
		} else onOpen(0)
	}

	// Form open event
	function onOpen( n ) {
		if ( n < page.forms.length ) {
//console.log( 'onOpen ' + page.forms[n].name )
			var form = page.forms[n]
				, err = $(form).triggerHandler('open')
			if ( form instanceof Tabular )  form.addRows()
			form.setChangeField()
			if ( !err )  onOpen(n+1)
		} else {
			fieldsFunc()
			list()
		}
	}

	function fieldsFunc() {
		
		// Date		$('input[type*="date"]').each( function() {
			var fld = $(this)
			fld.data('fld', fld)
			fld.datepicker({
				showWeek: true ,
				dateFormat: dateFormat,
				constrainInput: false,
				onSelect: function(date, inst) { 
					fld.data('fld').val(date)
				}
			})

			fld.attr('title', 'format: dd/mm/yyyy shortcuts: + (today) d (day of current month) d.m  (day and month)')
		})
	
		// Autocomplete
		$('input[type="autocomplete"]').each( function() {
			Autocomplete($(this))
		})
		
		//Buttons
		$('.br-button').button()
		
		// Images
		page.tag.find('img').each( function() {
			imgLoad(br.app, $(this))
		})
		
		// File link
		page.tag.find('input[type="filelink"]').each( function() {
			var $this = $(this)
				, ico = $('<span class="ui-icon ui-icon-folder-open" style="position: absolute"></span>')
				, l = parseInt($this.css('left'), 10) + parseInt($this.css('width'), 10) - parseInt(ico.css('width'), 10) + 2
			ico.css('top', $this.css('top'))
			ico.css('left', l)
			ico.css('z-index', 2)
			ico.click( function() {
				fileUpload(br.db, function(res) {
					$this.data('id', res.newid)
					$this.val(res.filename)
					$this.trigger('change')
				})
			})
			$this.click( function() {
				fileShow($this.data('id'))	
			})
			$this.prop('readonly', true)
			$this.parent().append(ico)
		})
			
		// Translate
		$('.br-label').each( function() {
			$(this).text(translate($(this).text(), br.lang))
		})
	}

	// List
	function list() {
		var mas = page.forms[0]
		$('#listbar').empty()
		if ( mas.tag.hasClass('br-tabular') ) {
			page.command('R', 0)
		} else {
			
			var fields = mas.tag.attr('data-fields')
				, query = mas.query
				
			// Columns	
			if ( fields &&  query ) {
				var fld = strSplit(fields, ',')
				page.listCols = []
				for ( var i=0; i < fld.length; i++ ) {
					var sp = fld[i].split(/\s*:\s*/)
						, c = { name: sp[0] }
					
					if ( sp[1] )  c.width = parseInt(sp[1], 10)
					else  c.width = 50
					if ( sp[2] )  c.display = sp[2]
					else {
						var s = strRep(strRep(c.name, '_', ' '), '-', ' ')
						c.display = strCapitalize(s)
					}
					c.process = function( cell, id ) {
						$(cell).click( function(ev) {
							page.recid = (typeof page.recid == 'number') ? parseInt(id, 10) : id
							page.command('N', 0)
							page.command('R', 0)
						})
					}
					page.listCols.push(c)
				}
	
				//  Flexigrid
				page.list = $('<table id="list"></table>')
				$('#listbar').append(page.list)
					
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
							if ( q.where )  $.extend(q.where, page.srcond)
							else  q.where = page.srcond
						}
						q.script = 'flexigridData'
						q.usercode = br.usercode
						q.limit = this.rp
						q.page = this.newp || 1
						this.url = '/brumba?' + JSON.stringify(q)
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
									if ( val.txt )  val = val.txt
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
								row.cell.push(val)
							}
							data.rows[i] = row
						}
						return data
					}
				}
					
				page.list.flexigrid(options)
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
			page.command('S', 0)
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
