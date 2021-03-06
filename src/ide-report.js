/*
 * Brumba
 * Copyright (c) 2012-2020 Dan Parnete
 *
 * This source code is licensed under the MIT license.
*/

import { $, $$, br, modified, unselect, createElement } from './util'
import { itemEvents, imgContext } from './ide-form'
import { properties } from './ide-props'
import { show } from './basiccontext/basicContext'



/* 
 *  New report
 */
export const newReport = () => {
  const ws = br.ws
  const wo = br.wo
  wo.value = new Date().toLocaleString()
  wo.name = 'reports'
  
  ws.innerHTML = 
`<form class="br-report br-form" style="font:11px arial;">
  <div name="header" class="br-band br-header" style="height: 20px;"><label class="watermark">header</label></div>
  <div name="detail" class="br-band br-detail" style="height: 20px;"><label class="watermark">detail</label></div>
  <div name="total" class="br-band br-total" style="height: 20px;"><label class="watermark">total</label></div>
  <div name="footer" class="br-band br-footer" style="height: 40px;"><label class="watermark">footer</label><label class="br-label" for="_date" style="top:10px;left:5px;" draggable="true">Date:</label><input class="br-field" name="_date" style="top:10px;left:50px;" type="text" draggable="true" readonly="true" value="_date"><label class="br-label" for="_page" style="top: 10px; left: 495px;" draggable="true">Page:</label><input class="br-field" name="_page" style="top: 10px; left: 545px; width: 30px;" type="text" readonly="true" value="_page"></div>
</form>`
  
  $$('.br-band').forEach(bandEvents)
  reportEvents()
  modified(true)
}



/* 
 *  New report
 */
export const openReport = rec => {
//console.log(rec)
  const ws = br.ws
  const wo = br.wo
  ws.innerHTML = rec.html
  reportEvents()
  $$('.br-band').forEach(bandEvents)
  $$('.br-label,.br-field').forEach(setElement)
}




/* 
 *  Report events
 */
const reportEvents = () => {
	const report = $('.br-report')
	
	// click
	report.addEventListener('click', e => {
		if ($('.br-props')) {
			properties()
		}
	})

	// context menu
	report.addEventListener('contextmenu', e => {
    e.preventDefault()
    
    const group = () => {
			const detail = $('.br-detail')
			const band = createElement(
				'<div class="br-band br-group" name="group" style="height:20px;"><label class="watermark">group</label></div>'
			)
			detail.before(band)
			bandEvents(band)
    }

    const copy = () => {
			confirmModal('A copy of this report will be create', e => {
		    const par = {coll: 'reports', where: {name: br.wo.value}}
		    remote(par).then(res => {
					if (res.err) return
					if (!res[0]) return alert('Report not found')
					const data = res[0]
					delete data._id
					data.name += '_COPY'
					par.cmd = 'POST'
					delete par.where
					remote(par, data)
					.then(res => {
						if (res.err) return
						reloadList()
					})
					.catch(console.error)
				})
			})			
    }

    show([
      {title: 'Add group', fn: group},
      {},
      {title: 'Copy', fn: copy},
    ], e)
  })

	// workspace events
	let move = false
	br.ws.addEventListener('mousedown', e => {
    e.stopPropagation()
		e.preventDefault()
		move = true
	})
	br.ws.addEventListener('mouseover', e => {
    e.stopPropagation()
		e.preventDefault()
		if (move && e.ctrlKey && isSelectable(e.target)) {
			e.target.classList.add('br-selected')
		}
	})
	br.ws.addEventListener('mouseup', e => {
    e.stopPropagation()
		e.preventDefault()
		move = false
	})
  br.ws.addEventListener('dblclick', unselect)
}




/* 
 *  Set report
 */
const setElement = el => {
	el.setAttribute('draggable', 'true')
	if (el.classList.contains('br-field')) {
		el.setAttribute('readonly', 'true')
		if (el.tagName === 'TEXTAREA') {
			el.textContent = el.name
		} else {
			el.setAttribute('value', el.name)
		}
	}
	if (el.tagName === 'IMG') {
		imgContext(el)
	}
	itemEvents(el)
}





/* 
 *  Drag and drop
 */
let dragged, startX, startY

document.addEventListener("dragstart", e => {
  e.stopPropagation()
  if (isSelectable(e.target)) {
    dragged = e.target
    startX = e.pageX
    startY = e.pageY
	} else {
		//e.preventDefault()
	}
}, false)

document.addEventListener("dragend", e => {
	if (dragged) {										// in case of no drop
		dragged.style.opacity = ""
    dragged = null
	}
}, false)


/* 
 *  Set band events
 */
const bandEvents = bandE => {
  // unselect
	bandE.addEventListener('click', e => {
		e.stopPropagation()
		e.preventDefault()
		if ($('.br-props')) {
			properties(bandE)
		}
	})
  // select
	bandE.addEventListener('dblclick', e => {
		e.stopPropagation()
		e.preventDefault()
		unselect()
		bandE.classList.add('br-selected')
	})
  // drop
  bandE.addEventListener('drop', e => {
    e.stopPropagation()
    e.preventDefault()
    if (dragged) {
			dragged.style.opacity = ""
			if (bandE === dragged.parentElement) {
				const deltaX = e.pageX - startX
				const deltaY = e.pageY - startY
				if (dragged.classList.contains('br-selected')) {
					$$('.br-selected').forEach(el => {
						el.style.left = el.offsetLeft + deltaX + 'px'
						el.style.top = el.offsetTop + deltaY + 'px'
					})
				} else {
					dragged.style.left = dragged.offsetLeft + (e.pageX-startX) + 'px'
					dragged.style.top = dragged.offsetTop + (e.pageY-startY) + 'px'
				}
			} else {				 
				if (dragged.classList.contains('br-selected')) {
					$$('.br-selected').forEach(el => bandE.appendChild(el))
				} else {
					bandE.appendChild(dragged)
				}
			}
      dragged = null
      modified(true)
    }
  })
  // context menu
  bandE.addEventListener('contextmenu', e => {
    e.preventDefault()
    const left = e.offsetX
    const top = e.offsetY
    
    const add = el => {
      bandE.append(el)
      setElement(el)
      modified(true)
		}

    const label = () => {
      add(createElement(
				`<label class="br-label" style="left:${left}px; top:${top}px">Label</label>`
			))
    }

    const field = () => {
      add(createElement(
				`<input class="br-field" name="field" style="left:${left}px; top:${top}px" value="field" />`
			))
    }

    const image = () => {
      const el = createElement(
				`<img src="https://bulma.io/images/placeholders/128x128.png" style="left:${left}px; top:${top}px">`
			)
			add(el)
      imgContext(el)
    }

    show([
      {title: 'Add label', fn: label},
      {title: 'Add field', fn: field},
      {title: 'Add image', fn: image},
    ], e)
  })
}



/* 
 *  Is selectable element
 */
const isSelectable = elem => 'LABEL,INPUT,SELECT,TEXTAREA,IMG'.includes(elem.tagName) &&
				!elem.classList.contains('message-header')
