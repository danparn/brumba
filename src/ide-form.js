/*
 * Brumba
 * Copyright (c) 2012-2020 Dan Parnete
 *
 * This source code is licensed under the MIT license.
*/

import { render } from 'web/inferno'
import { FieldColumn, Label, Button } from './inferno-bulma'
import { strSplit, strCap, translate } from './common'
import { br, $, $$, e$, e$$, remote, unselect, modified, createElement } from './util'
import { renderToString, fileFromDb, fileUpload, imgLoad, confirmModal } from './components'
import { properties, addRadio, toolsText } from './ide-props'
import { pageWrapper } from './page'
import { show } from './basiccontext/basicContext'
import { reloadList } from './ide'

/* 
 *  New form
 */
export const newForm = () => {
  const ws = br.ws
  const wo = br.wo
  wo.value = new Date().toLocaleString()
  wo.name = 'forms'
  render(null, ws)
  const frm = renderToString(
    <form class="container is-fluid" name={wo.value}>
      <div class="columns">
        <div class="container column is-7" />
        <div class="container column" />
      </div>
      <div class="columns">
        <div class="container column is-7">
          {newFields(toolsText())}
        </div>
        <div class="container column" />
      </div>
    </form>
  )
  ws.innerHTML = pageWrapper(frm)
  e$$(ws, '.container').forEach(c => c.classList.add('br-borders'))
  
  $$('.field').forEach(el => fieldEvents(el))
  $$('.container').forEach(el => containerEvents(el))
  modified(true)
}



/* 
 *  New fields
 */
export const newFields = (names) => {
  const flds = strSplit(names, ',') || []
  let fields = []
  flds.forEach(name => {
    const n = name.indexOf(':')
    if (n > 0) name = name.substring(0, n)
    fields.push(
      <FieldColumn fieldAttr={{draggable: 'true'}} 
                  labelAttr={{class: 'is-one-quarter'}} 
                  inputAttr={{name: name, value: name, readonly: true}}>
        {strCap(name).replace(/_/gi, ' ')}
      </FieldColumn>
    )
  })
  return fields
}



/* 
 *  Add fields
 */
export const addFields = () => {
  const container = $('form')
  if (container) {
    const fields = newFields(toolsText())
    fields.forEach(fld => {
      const el = createElement(renderToString(fld).replace('draggable', 'draggable="true"'))
      container.append(el)
      fieldEvents(el)
    })
  } else {
    alert('Form not found')
  }
}


/* 
 *  Set container events
 */
export const containerEvents = cont => {
  // select
  if (cont !== br.ws) {
		cont.addEventListener('click', e => {
			e.stopPropagation()
			e.preventDefault()
			unselect()
			cont.classList.add('br-selected')
			if ($('.br-props')) {
				properties()
			}
		})
	}
  // drop
  cont.addEventListener('drop', (e) => {
    e.stopPropagation()
    e.preventDefault()
    if (dragged) {
			dragged.style.opacity = ""
      if (dragged.tagName === 'BUTTON') {
				e.target.appendChild(dragged.parentElement)
			} else {				 
				e.target.appendChild(dragged)
			}
      dragged = null
      modified(true)
    }
  })
  // context menu
  cont.addEventListener('contextmenu', (e) => {
    e.preventDefault()

    const label = () => {
      const el = createElement(renderToString(<Label class={'br-label'}>Label</Label>))
      cont.append(el)
      itemEvents(el)
      modified(true)
    }

    const button = () => {
      const el = createElement(renderToString(<Button class="is-primary">Button</Button>))
      cont.append(el)
      itemEvents(el)
      modified(true)
    }

    const field = () => {
      const el = createElement(renderToString(newFields('field')[0]))
      cont.append(el)
      fieldEvents(el)
      modified(true)
    }

    const image = () => {
      const el = createElement(
				`<figure class="image is-128x128">
					<img src="https://bulma.io/images/placeholders/128x128.png">
				</figure>`
			)
      cont.append(el)
      itemEvents(el)
      modified(true)
    }

    const column = () => {
      const el = createElement(renderToString(
        <div class="container column br-borders" />
      ))
      cont.parentElement.append(el)
      containerEvents(el)
    }

    const row = () => {
      const el = createElement(renderToString(
        <div class="columns">
          <div class="container column is-7 br-borders" />
          <div class="container column br-borders" />
        </div>
      ))
      cont.append(el)
      el.querySelectorAll('.container').forEach(co => containerEvents(co))
    }

    show([
      {title: 'Add label', fn: label},
      {title: 'Add button', fn: button},
      {title: 'Add field', fn: field},
      {title: 'Add image', fn: image},
      {},
      {title: 'Add column', fn: column},
      {title: 'Add row', fn: row},
      {},
      {title: 'Copy', fn: copy},
    ], e)
  })
}

/* 
 *  Copy form
 */
export const copy = () => {
	const msg = translate('A copy of this form will be create')
  const onOk = e => {
    const par = {coll: 'forms', where: {name: br.wo.value}}
    remote(par).then(res => {
			if (res.err) return
			if (!res[0]) return alert(translate('Form not found'))
			const data = res[0]
			delete data._id
			data.name += '_COPY'
			par.cmd = 'POST'
			delete par.where
			remote(par, data).then(res => {
				if (res.err) return
				reloadList()
			})
		})
	}
	
	confirmModal(msg, onOk)
}



/* 
 *  Set field events
 */
export const fieldEvents = field => {
  // drop
  field.addEventListener('drop', e => {
    e.stopPropagation()
    e.preventDefault()
    if (dragged && dragged.classList.contains('field')) {
      const targetField = e.target.closest('.field')
      if (targetField === dragged) {
        dragged = null
        return
      }
      while (dragged.firstChild) {
				targetField.appendChild(dragged.firstChild)
			}
			dragged.remove()
			dragged = null
      /*let divColumns = e$(targetField, '.columns')
      if (!divColumns) {
        divColumns = createElement('<div class="column columns" />')
        e.target.parentElement.replaceWith(divColumns)
        divColumns.append(e.target.parentElement)
      }
      e$(divColumns, '.column.control').classList.remove('column')
      divColumns.append(dragged.firstChild)
      divColumns.append(dragged.firstChild)
      if (dragged.childNodes.length === 0) {
        dragged.parentNode.removeChild(dragged)
      }*/
      modified(true)
    }
  })  
  // select
  field.querySelectorAll('label,input,select,textarea').forEach(el => {
    itemEvents(el)
  })
}



/* 
 *  Set item events
 */
export const itemEvents = item => {
  // selected
  item.addEventListener('click', e => {
    e.stopPropagation()
    e.preventDefault()
    const sel = 'br-selected'
    if (e.ctrlKey) {
			item.classList.toggle(sel)
		} else {
			unselect()
			item.classList.add(sel)
		}
    if ($('.br-props')) {
			properties(e.target)
		}
  })  
  // context menu
  if (item.tagName === 'FIGURE') {
		imgContext(item)
	} else if (item.type === 'radio') {
		item.addEventListener('contextmenu', e => {
			e.preventDefault()
			
			const add = () => {
				addRadio(item.parentElement.parentElement, item.name)
			}
			
			const remove = () => {
				if (item.parentElement.childElementCount > 4) {
					item.parentElement.lastElementChild.remove()
					item.parentElement.lastElementChild.remove()
				}
			}

			show([
				{title: 'Add radio', fn: add},
				{title: 'Remove radio', fn: remove},
			], e)
		})
	}
}




/* 
 *  Set image context menu
 */
export const imgContext = img => {
  img.addEventListener('contextmenu', e => {
		e.preventDefault()

		const file = () => {
			fileUpload(br.app, res => {
				if (res.err) return alert('Cannot upload file')
				img.setAttribute('data-id', res.newid || res._id)
				imgLoad(br.app, img)
			})        
		}

		const database = () => {
			fileFromDb({db: br.app}, res => {
				img.setAttribute('data-id', res.id)
				imgLoad(br.app, img)
			})
		}

		show([
			{title: 'From file', fn: file},
			{title: 'From database', fn: database},
		], e)
  })
}





/* 
 *  Drag and drop from Mozilla example
 */
let dragged


/* events fired on the draggable target */
/*document.addEventListener("drag", function(event) {

}, false);*/

document.addEventListener("dragstart", e => {
  if ('DIV,BUTTON,LABEL'.includes(e.target.tagName) &&
				!e.target.classList.contains('message-header')) {
    dragged = e.target;             // store a ref. on the dragged elem
    if (dragged.classList.contains('br-dialog')) {
      e.target.style.opacity = 0.001;    // make it transparent
    } else {
      e.target.style.opacity = .2;    // make it transparent
    }
  }
}, false);

document.addEventListener("dragend", e => {
  if (e.target.tagName === 'DIV') {
    e.target.style.opacity = "";    // reset the transparency
  }
}, false);



/* events fired on the drop targets */
document.addEventListener("dragover", e => {
  e.preventDefault();   // prevent default to allow drop
}, false);

