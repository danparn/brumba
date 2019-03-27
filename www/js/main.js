/*
 * Brumba
 *
 * © 2012-2016 Dan Parnete
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
	// App CSS
	dynamicLink('/apps/'+br.app+'/'+br.app+'.css')
		
	// Title
	$('title').text(br.app)
	
	//Favicon
	$('link[href="images/favicon.ico"]').attr('href', 'apps/'+br.app+'/favicon.ico')
	
	// Toolbar
	$('.toolbar').each( function() {
		var ico
		switch ( $(this).attr('name') ) {
			case 'new': ico = 'ui-icon-document'; break
			case 'save': ico = 'ui-icon-disk'; break
			case 'delete': ico = 'ui-icon-trash'; break
			case 'search': ico = 'ui-icon-search'; break
			case 'help': ico = 'ui-icon-help'; break
		}
		$(this).button({
			text: false,
			icons: {primary: ico}
		})
	})
	
	// Page instance
	page = new Page()
	
	//$(document).tooltip()
	$.ajaxSetup({cache: true})

	// Key mapping
	$( document ).keydown( function(ev) {
		var k = ev.which

		// SHIFT+CTRL+C		- copy elements
		if ( k == 67 && ev.shiftKey && ev.ctrlKey ) {
			var form = formOfField(ev.target)
			if ( form ) {
				var frm = page.findForm(form.attr('id'))
				if ( frm ) localStorage.setItem('br.clipboard', JSON.stringify(frm.rec))
			}
			ev.preventDefault()

		// SHIFT+CTRL+V		- paste elements
		} else if ( k == 86 && ev.shiftKey && ev.ctrlKey ) {
			var rec = JSON.parse(localStorage.getItem('br.clipboard'))
				, par = $(ev.target).parent()
			if ( rec && par ) {
				delete rec._id
				var frm = page.findForm(formOfField(ev.target).attr('id'))
				displayForm(par, rec)
				_.each(rec, function(val, key) { frm.modify(par.find('#'+key), val) })
			}
			ev.preventDefault()
	
		// SHIFT+CTRL+E		- reload modules
		} else if ( k == 69 && ev.shiftKey && ev.ctrlKey ) {
			ev.preventDefault()
			reload_events()
			var mod = ['util', 'client', 'objects']
			mod.forEach( function(elem) {
				var src = 'js/'+elem+'.js'
				$('script[src="' + src + '"]').remove()
        		$('<script>').attr('src', src).appendTo('head')
			})
		}
	})
	
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
		pageLoad(pg)
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
				$('.br-button').each( function() {
					$(this).text(translate($(this).text(), br.lang))
				})
			} 
			about()
		})
	} else about()
	
	function about() {
		$('button').button()
		loadScript(br.app + 'Cli', function() {
			pageLoad('forms.About')
		})
	}

})



/* Load page
*/
function pageLoad( pgname ) {
	if ( !pgname )  return
	page.srcond = null
	$('.br-form-dialog, .br-photo-gallery').remove()
	while ( page.tickers.length > 0 ) {
		var t = page.tickers.pop()
		clearInterval(t)
	}

	if ( pgname == 'IDE' ) {
		if ( br.app == br.db ) window.open(window.location.origin + '/ide.html')
		else window.open(window.location.origin + '/idelogin.html')
		return
	}
	
	var sp = strSplit(pgname, ':')
	br.menupg = sp[0]
	br.menuid = sp[1]
	br.menusort = sp[2] || '_id'
	
	var sp = br.menupg.split('.')
	remote({cmd:'GET', db:br.app, coll:sp[0], where:{name: sp[1]}}, function(res) {
		if ( res.err || !res[0] )  return
		
		var $pg = $('#page')
		$pg.empty()
		page.tag = $(res[0].html)
		var pans = page.tag.find('.br-panel')
		if ( pans.length == 0 && res[0].events )  page.tag.data('events', res[0].events)
		page.tag.find('span.ui-icon-close').remove()
		
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
							//frm.find('input[type=number]').removeAttr('type').addClass('br-number')
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
	//setSplitter($('div.split-s,div.split-e'))
	page.tag.find('.watermark').remove()
	page.tag.find('input[type=number]').removeAttr('type').addClass('br-number')
	page.tag.find('input[type=date]').removeAttr('type').addClass('br-date')
	page.tag.find('input[type=time]').removeAttr('type').addClass('br-time')
	page.tag.find('input[type=datetime]').removeAttr('type').addClass('br-datetime')

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
				if ( p > 0 )  mas = field.substr(0, p)
			}
			for ( var j=i; j >= 0; j-- ) {
				var f = page.forms[j]
				if ( mas ) {
					if ( f.query.field == mas ) {
						form.master = f
						break
					}
				} else if ( f.query && f.query.coll ) {
					form.master = f
					break
				}
			}
			//if ( !form.master ) form.master = page.forms[0]
		} /*else {
			form.master = form
		}*/
	}
//for ( var i=0; i < page.forms.length; i++ )  console.log( 'form %s   mas %s', page.forms[i].name, page.forms[i].master.name )

	// Select
	var select = $('select')
	sel(0)
	
	function sel( n ) {
		if ( n < select.length ) {
			var $select = $(select[n])
				, query = $select.attr('data-query')
			$select.css('width', parseInt($select.css('width'), 10)+4)
			if ( query ) {
				if ( query.indexOf('#') > 0 ) {
					$select.addClass('br-query-args')
					sel(n+1)
				} else {
					Select(select[n], function() {
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
			if ( form instanceof Tabular )  form.addRows()
			form.setChangeField()
			var err = $(form).triggerHandler('open')
			if ( !err )  onOpen(n+1)
		} else {
			elemFunc(page.tag)
			list()
		}
	}

	// List
	function list() {
		var mas = page.forms[0]
		if ( br.menuid ) mas.query.where = _.extend(mas.query.where || {}, {type: br.menuid})
		$('#listbar').empty()
		if ( mas.tag.hasClass('br-tabular') || (mas.query && mas.query.findone) ) {
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
							page.recid = (isNaN(id)) ? id : parseInt(id, 10)
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
										else if ( fld.is('.br-date') ) val = strDate(new Date(val))
										else if ( fld.is('.br-datetime') ) val = strDate(new Date(val), true)
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
	if ( page.prm ) {
		if ( page.prm.indexOf('w') >= 0 ) {
			if ( !page.insave ) {
				page.insave = true
				page.command('S', 0)
			}
		} else alert('Permission denied')
	}
}

function butDelete() {
	if ( page.prm ) {
		if ( page.prm.indexOf('d') >= 0 )  page.delete()
		else  alert('Permission denied')
	}
}

function butNew() {
	page.newrec()
}

