/*
 * Brumba
 *
 * © 2012-2014 Dan Parnete
 * Dual licensed under the MIT and GPL licenses.
*/

/*********************************************
 * 				FORM
 *********************************************/
// New form
function newForm() {
	var form = $('<form id="' + strRep(strNowDateTime(),' ','_') + '" class="br-form" />')
	$('.br-events').dialog('close')
	ws.empty()
	addFlds(form, 5, 5)
	ws.append(form)
	setForm(form)
}


/* Set form
*/
function setForm( elem ) {
	var cm
	if ( elem.hasClass('br-band') ) {
		elem.resizable({
			handles: 's'
		})
		if ( elem.parent().hasClass('br-report') )  cm = 'contextMenuBandReport'
		else  cm = 'contextMenuBand'
	}
	else if ( elem.hasClass('br-tabular') )  cm = 'contextMenuTabular'
	else if ( elem.hasClass('br-report') )  cm = 'contextMenuReport'
	else  cm = 'contextMenuForm'
	
	if ( !(elem.hasClass('br-band') && elem.parent().hasClass('br-tabular')) ) {
		elem.click( function(ev) {
			ev.stopImmediatePropagation()
			showProperties(this)
		})
	}

	var contextMenuForm = {
		bindings: {
		  
			// Label
			'label': function(el) {
				var pos = $(el).data('relativePos')
				$(el).append(newLabel('label', pos.top, pos.left))
			},
			
			// Field
			'field': function(el) {
				var pos = $(el).data('relativePos')
				$(el).append(newField('field', pos.top, pos.left))
			},
			
			// Button
			'button': function(el) {
				var pos = $(el).data('relativePos'),
					but = $('<label id="button" class="br-button" type="button" style="top:' + pos.top +
						'px;left:' + pos.left + 'px;">button</label>')
				setElement(but)
				$(el).append(but)
			},
			
			// Image
			'img': function(el) {
				var pos = $(el).data('relativePos'),
					img = $('<img src="#" style="top:' + pos.top + 'px;left:' + pos.left + 'px;"/>')
				setElement(img)
				$(el).append(img)
				img.contextMenu('contextMenuImg', contextMenuImg)
			},
			
			// Copy
			'copy': function(el) {
				var $el = $(el)
				while ( !$el.hasClass('br-form') )  $el = $el.parent()
				$el.attr('id', $el.attr('id') + '_COPY')
				$el.removeData('_id')
				onSave()
			},
			
			// Copy to App
			'copy-to-app':  copyToApp,
			
			// Move
			'move': function(el) {
				var pos = $(el).data('relativePos'),
					last
				$('.selected').each( function() {
					var cur = $(this).position()
					if ( last ) {
						pos.left += cur.left - last.left
						pos.top += cur.top - last.top
					}
					$(el).append(this)
					$(this).css({
						left: pos.left,
						top: pos.top
					})
					last = cur
				})
			},
			
			'import-form':  function(el) {
				getForm( function(res) {
					if ( res ) {
						var frm = $(toLabel(res[0].html))
						if ( frm.hasClass('br-tabular') ) {
							var prnt = $(el).parent()
								, band = 'header,detail,total'.split(',')
								, top = 0
							for ( var i=0; i < band.length; i++ ) {
								if ( $(el).hasClass('br-detail') ) {
									var b
									if ( band[i] == 'header' ) b = $(el).prev()
									else b = prnt.find('.br-'+band[i])
									append(b , frm.find('.br-'+band[i]).html())
								} else {
									var b = frm.find('.br-'+band[i])
									insertBand(top, b)
									top += parseInt(b.css('height'), 10)
								}
							}
						} else {
							append($(el), frm.html())
						}
					}
				})

				function append( band, html ) {
					band.append(html)
					band.children().each( function() {
						var $this = $(this)
						if ( !$this.hasClass('watermark') && !$this.hasClass('ui-resizable-handle') )  setElement($this)
					})
				}

				function insertBand( top, band ) {
					band.children().each( function() {
						var $this = $(this)
						$this.css('top', parseInt($this.css('top'), 10) + top)
						$(el).append(this)
						if ( !$this.hasClass('watermark') && !$this.hasClass('ui-resizable-handle') )  setElement($this)
					})
				}
			},
			
			'nested':  function(el) {
				getForm( function(res) {
					if ( res ) {
						var pos = $(el).data('relativePos')
							, ns = $('<div class="br-nested" data-nested="' + res[0].name + '" style="top:' + pos.top + 'px; left:' +
												pos.left + 'px;"/>')
						ns.append(toLabel(res[0].html))
						setElement(ns)
						$(el).append(ns)
					}
				}, true)
			},
			
			'group':  function(el) {
				var detail = $('.br-detail')
					, band = $('<div class="br-band br-group split-s" name="group" style="width:'+detail.css('width')+'; height:20px;" />')
				watermark(band, 'group')
				detail.before(band)
				setForm(band)
			},

			'rectangle':  function(el) {
				var pos = $(el).data('relativePos')
					, rect = newLabel('', pos.top, pos.left)
				rect.css('border', '1px solid')
				rect.css('height', 20)
				$(el).append(rect)
			}
			
		},
		
		onContextMenu: function(ev) {
			var el = $(ev.target)
			if ( el.is('.br-form, .br-band') ) {
				setPos(el, ev)
				return true
			} else
				return false
		}
	},
	
	contextMenuImg = {
		bindings: {
			'file': function(el) {
				fileUpload(br.app, function(res) {
					if ( res.dbret ) alert(translate('Cannot upload file'))
					else {
						$(el).attr('data-id', res.newid)
						imgLoad(br.app, $(el))
					}
				})
			},
			'database': function(el) {
				var where = 
				remote({cmd: 'GET', db: br.app, coll: 'fs.files', where: {contentType: {$regex:'^image/'}}}, function(res) {
					if ( res.dbret )
						alert(res.dbret)
					else {
						var dat = [],
							len = res.length
						for ( var i=0; i < len; i++ )  dat.push({id:res[i]._id, text:res[i].filename})
						listBox('Files', dat, function(ui) {
							$(el).attr('data-id', ui.item[0].id)
							imgLoad(br.app, $(el))
						})
					}
				})
			}
		}
	}

	elem.contextMenu(cm, contextMenuForm)
	if ( elem.hasClass('br-form') )  elem.find('img').contextMenu('contextMenuImg', contextMenuImg)
}



/* Clean all form fields
*/
function resetForm( form ) {
    form.find('input:text, input:password, input:file, select, textarea')
    	.val('')
    	.removeProp('disabled')
    form.find('input:radio, input:checkbox')
    	.removeAttr('checked')
    	.removeAttr('selected')
    	.removeProp('disabled')
}



/* Add fields to form
*/
function addFields() {
	var form = ws.children()
	if ( form.hasClass('br-form') ) {
		
		// Tabular
		if ( form.hasClass('br-tabular') ) {
			var detail = form.find('div.br-detail'),
				left = 0,
				fld = detail.find('.br-field')
			for ( var i=fld.length-1; i>=0; i--) {
				var el = $(fld[i]),
					l = parseInt(el.css('left'), 10),
					w = parseInt(el.css('width'), 10)
				if ( left < l+w )  left = l + w
			}
			addFlds(form, 2, left+3, true)

		// Form
		} else { 
			var pos = form.data('relativePos')
			addFlds(form, pos.top, pos.left)
		}
	}
}

function addFlds( form, top, left, tabular ) {
	var header = form.find('div.br-header'),
		detail = form.find('div.br-detail'),
		sp = strSplit($('textarea#text').val(), /\s*,\s*/)
	for ( var i in sp ) {
		var lb = sp[i],
			pre = lb.substr(0, 1).toUpperCase(),
			x = 0
		lb = pre + lb.substr(1).replace('_',' ')
		if ( !tabular )  lb += ':'
		var el = newLabel(lb, top, left, sp[i])
		if ( tabular ) {
			header.append(el)
			x = left
		} else {
			form.append(el)
			x = left + 100
		}
		el = newField(sp[i], top, x)
		if ( tabular ) {
			detail.append(el)
			left += 103
		} else {
			form.append(el)
			top += 20
		}
	}
}


/* Create new Label
*/
function newLabel( text, top, left, input ) {
	var el = $('<label class="br-label" for="' + input + '" style="top:' + top + 'px;left:' + left + 
			'px;">' + text + '</label>')
	setElement(el)
	return el
}


/* Create new Field
*/
function newField( id, top, left ) {
	el = $('<label class="br-field" id="' + id + '" type="text" style="top:' + top + 'px;left:' + 
			left + 'px;">' + id + '</label>')
	setElement(el)
	return el
}


/* Set field
*/
function setElement( el ) {
	if ( el.hasClass('watermark') ) return
	
	var w = 0, h = 0
	el.click( function(ev) {
		ev.stopImmediatePropagation()
		if ( ev.ctrlKey )
			$(this).toggleClass('selected')
		else if ( !$(this).hasClass('selected') ) {
			$('.selected').removeClass('selected')
			$(this).addClass('selected')
		}
		if ( $(this).is('td') )  showGridColumnProperties(this)
		else  showProperties(this)
	}).drag('init', function(ev) {
		w = parseInt($(this).css('width'), 10)
		h = parseInt($(this).css('height'), 10)
		if ( $(this).is('.selected') && !ev.shiftKey )  return $('.selected')
	}).drag( function(ev, dd) {
		if ( ev.shiftKey ) {
			$(this).css({
				width: w + dd.deltaX,
				height: h + dd.deltaY
			})
		} else {
			$(this).css({
				top: dd.offsetY,
				left: dd.offsetX
			})
		}
	},
	{ 
		relative: true,
		drop: false,
		distance: 10 
	}).drop('start', function() {
		//$(this).addClass('active')
	}).drop( function(ev, dd){
		$(this).addClass('selected')
	}).drop( 'end', function() {
		//$(this).removeClass('active')
	})
}



/* Load form
*/
function loadForm( id, isReport ) {
	remote({cmd: 'GET', db: br.app, coll: (isReport)?'reports':'forms', where: {_id: id}}, function(res) {
		if ( !res.dbret ) {
			ws.empty()
			ws.removeAttr('style')
			var setElem = function(elems) {
					for ( var i=elems.length-1; i >= 0; i-- ) {
						setElement($(elems[i]))
					}
				}
			ws.append(toLabel(res[0].html))
			var form = $(ws.children())
				, events = res[0].events
				, eventsDlg = $('.br-events')
			if ( events ) form.data('events', res[0].events)
			else events = ''
			if ( eventsDlg.length > 0 )  eventsDlg.data('editor').setValue(events)
			if ( form.hasClass('br-tabular') || isReport ) {
				form.children().each( function() {
					var b = $(this)
					setElem(b.children())
					setForm(b)
					//if ( isReport ) watermark(b, b.attr('name'))
				})
			} else {
				setElem(form.children())
			}
			form.find('img').each( function() {						// image
				imgLoad(br.app, $(this))
			})
			setForm(form)
			form.find('.br-nested').each( function() {
				var par = {
						cmd: 'GET',
						db: br.app,
						coll: (isReport) ? 'reports' : 'forms',
						where: {name: $(this).attr('data-nested')}
					}
					, self = this
				remote(par, function(res) {
					if ( !res.dbret ) {
						$(self).append(toLabel(res[0].html))
					}
				})
			})
			form.data( '_id', id)
			showProperties(form.get(0))
		}
	})
}



/* Convert br-fields to ide labels
*/
function toLabel( html ) {
	var frm = $(html)
	frm.find('.br-field').each( function() {
		var l = $('<label/>'),
			$this = $(this),
			type = $this.attr('type')
		copyAttr(this, l)
		if ( $this.is('select') )  l.attr('type', 'select')
		else if ( $this.is('textarea') )  l.attr('type', 'textarea')
		else if ( type )  l.attr('type', type)
		l.text($this.attr('id') )
		setTypeStyle(l)
		$this.replaceWith(l)
	})
	frm.find('.br-button').each( function() {
		var $this = $(this),
			l = $('<label type="button">' + $this.text() + '</label>')
		copyAttr(this, l)
		$this.replaceWith(l)
	})
	return frm
}



/* Delete form
*/
function deleteForm() {
	var id = $('.br-form').data('_id')
	if ( id ) {
		remote({cmd: 'DEL',	db: br.app, coll: 'forms', where: {_id: id}}, function(res) {
			if ( res.dbret ) {
				alert(res.dbret)
			} else {
				ws.empty()
				onLoad()
			}
		})
	}
}			







/*********************************************
 * 				TABULAR
 *********************************************/
/* New Tabular
*/
function newTabular() {
	multiband('br-tabular', 'br-header,br-detail,br-total')
}


function multiband( cls, bands, report ) {
	var form = $('<form id="' + strRep(strNowDateTime(),' ','_') + '" class="' + cls + ' br-form" />')
		, band = $('<div class="br-band split-s" style="width:100%; height:20px;" />')
		, sp = strSplit(bands, ',')
	$('.br-events').dialog('close')
	ws.empty()
	ws.append(form)
	setForm(form)
	for ( var i=0; i < sp.length; i++ ) {
		var b = band.clone().addClass(sp[i])
			, name = sp[i].substr(3)
		watermark(b, name)
		if ( report ) b.attr('name', name)
		form.append(b)
		setForm(b)
	}
	addFlds(form, 2, 5, 'T')
	form.click( function(ev) {
		showProperties(this)
	})
}


function watermark( elem, text ) {
	var wm = ('<label class="watermark">' + text + '</label>')
	elem.append(wm)
}







/*********************************************
 * 				REPORT
 *********************************************/
/* New Report
*/
function newReport() {
	multiband('br-report', 'br-header,br-detail,br-total,br-footer' , true)
	var rep = $('.br-report')
	rep.attr('style', 'font:' + rep.css('font-size') + ' ' + rep.css('font-family') + ';')
	$('.br-band').css('width', 595)		// 595 X 842 72dpi     2480 X 3508  300dpi
	.click( function(ev) {
		ev.stopImmediatePropagation()
		showProperties(this)
	})
	var foo = $('.br-footer')
	foo.css('height', 40)
	foo.append(newLabel('Date:', 10, 5, '_date'))
	foo.append(newField('_date', 10, 50))
	foo.append(newLabel('Page:', 10, 0, '_page'))
	foo.append(newField('_page', 10, 0))
	pageNumPos()
}


function pageNumPos() {
	var foo = $('.br-footer')
		, w = parseInt(foo.css('width'), 10)
	foo.find('label[for="_page"]').css('left', w - 100)
	foo.find('label#_page').css('left', w - 50).css('width', 30)
}


