/*
 * Brumba
 * Copyright (c) 2012-2020 Dan Parnete
 *
 * This source code is licensed under the MIT license.
*/

import { render } from 'web/inferno';
import { strSplit, objAddProp } from './common'
import { Dialog, posDialog } from './components'
import { $, $$, e$, e$$, br, modified, createElement } from './util'
import { FieldColumn, Label, Input, Select, Textarea } from './inferno-bulma'
import { itemEvents } from './ide-form'
import { gridRender } from './ide-grid'






/* 
 *  Properties
 */
export const properties = (element, grid) => {
  let el = element || $('.br-page') || $('.br-report') || $('form')
  if (!el) {
    return alert('Please open a page or form first')
  }
  if (el.tagName === 'FORM' && el.hasAttribute('data-grid') && !grid) {
		grid = JSON.parse(el.getAttribute('data-grid'))
	}
  if (el.tagName === 'LABEL' && 
			(el.classList.contains('radio') || el.classList.contains('checkbox'))) {
		el = e$(el, 'input')
	}

  const gridCol = grid ? grid.columns.find(c => c.name === el.textContent) : null
  const parent = el.closest('.control')
	const isReport = $('.br-report')
  
  // setText
  const setText = () => {
    if (el.type === 'radio') {
      render(null, parent)
      parent.innerHTML = ''
      render(
        <Input name={el.name} value={el.name} readonly />,
        parent
      )
      el = parent.getElementsByTagName('input')[0]
      itemEvents(el)
    } else {
      el.removeAttribute('type')
      el.className = 'input br-selected'
    }
  }

  
  // handlerChange
  const handlerChange = (e, value) => {
    switch (e.target.name) {
      
      // tagName
      case 'tagName':
        if (value !== el.tagName) {
					if (isReport) {
						const tag = el.tagName.toLowerCase()
						const newtag = value.toLowerCase()
						const newel = createElement(
							el.outerHTML.replace(tag, newtag)
													.replace('type="text"','')
													.replace(`value="${el.name}"`,'')
						)
						el.replaceWith(newel)
						if (value === 'TEXTAREA') {
							newel.textContent = el.name
						} else {
							newel.value = el.name
						}
						itemEvents(newel)
					} else {
						render(null, parent)
						parent.innerHTML = ''
						switch (value) {
							case 'INPUT':
								render(
									<Input name={el.name} value={el.name} readonly />,
									parent
								)
								itemEvents(parent.getElementsByTagName('input')[0])
								break
							case 'SELECT':
								render(
									<Select name={el.name} default={el.name} readonly />,
									parent
								)
								itemEvents(parent.getElementsByTagName('select')[0])
								break
							case 'TEXTAREA':
								render(
									<Textarea name={el.name} value={el.name} readonly />,
									parent
								)
								itemEvents(parent.getElementsByTagName('textarea')[0])
								break
							default:
						}
					}
          properties()
        }
        break
      
      case 'type':
console.log(value)
        if (value !== el.type) {
          if (el.tagName === 'TD') {
            if (gridCol) gridCol.type = value
            properties(el, grid)
          } else {
						if (!isReport) setText()
            switch (value) {
              case '':
                break
              case 'number':
                el.classList.add('br-number')
                properties(el)
                break
              case 'date':
              case 'datetime-local':
              case 'time':
              case 'email':
              case 'file':
              case 'password':
                  el.classList.add('br-'+value)
                break
              case 'checkbox':
                el.type = value
                el.classList.remove('input')
                break
              case 'button':
                el.type = value
                el.classList.remove('input')
                el.classList.add('button')
                el.classList.add('is-primary')
                break
              case 'radio':
                const parent = el.closest('.control')
                render(null, parent)
                parent.innerHTML = ''
                addRadio(parent, el.name)
                addRadio(parent, el.name)
                properties()
                break
              case 'autocomplete':
                el.classList.add('br-autocomplete')
                properties(el)
                break
              case 'image':
								el.setAttribute('onclick', 'return false')
								el.width = 128
              default:
                el.type = value
            }
          }
        }
        break
      
      
      case 'name':
        if (el.tagName === 'TD') {
          if (gridCol) {
            gridCol.name = value
            el.textContent = value  
          }
        } else {
          if (value) {
            el.setAttribute('name', value)
          } else {
            el.removeAttribute('name')
          }
          if (el.type !== 'button') {
            el.value = value
          }  
        }
        break
      case 'text':
        if (el.tagName === 'TD') {
          if (gridCol) {
            gridCol.header = value
          }
        } else if (el.type === 'button') {
					if (el.tagName === 'BUTTON') {
						el.textContent = value
					} else {
						el.value = value
					}
        } else if (el.type === 'radio') {
          el.nextSibling.textContent = value
        } else if (el.classList.contains('tab')) {
          el.firstChild.firstChild.textContent = value
        } else {
          el.textContent = value
        }
        break
      case 'value':
        el.value = value
        break
      case 'id':
        el.id = value
        break
      case 'for':
        el.setAttribute('for', value)
        break
      case 'placeholder':
        el.setAttribute('placeholder', value)
        break
      case 'decimals':
				if (gridCol) {
					gridCol.decimals = value
				} else {
					el.setAttribute('data-decimals', value)
				}
        break
      case 'help':
        if (value.length === 0) {
          el.removeAttribute('help')
          render(null, el.parentElement)
          if (el.nextElementSibling) el.nextElementSibling.remove()
          properties(el)
        } else {
          el.setAttribute('help', value)
          if (!el.nextElementSibling) {
            render(<div><p class="help is-danger" /></div>, el.parentElement)
          }
          el.nextElementSibling.firstChild.textContent = value
        }
        break
      case 'help color':
        const p = el.nextElementSibling.firstChild
        setColor(p, value)
        break
      case 'color':
				setColor(el, value)
        break
      case 'query':
				if (gridCol) {
					gridCol.query = value
				} else {
					el.setAttribute('data-query', value)
				}
        break
      case 'list':
				if (gridCol) {
					gridCol.list = value
				} else {
					el.setAttribute('data-list', value)
				}
        break
      case 'order':
        grid.reorder = value
        break
      case 'style':
        styles.forEach(s => el.classList.remove(s.val))
        if (value) el.classList.add(value)
      break
      case 'size':
        const setSize = elem => {
          sizes.forEach(s => elem.classList.remove(s.val))
          if (value) elem.classList.add(value)
        }
        let els
        if (el.tagName === 'FORM') {
          els = e$$(el, 'label,input,.select,textarea')
          setSize(el)
        } else {
          els = $$('.br-selected')
        }
        els.forEach(elem => {
          setSize(elem)
        })
        break
      case 'edit form':
        grid.form = value
        break
      case 'rows':
        grid.rows = parseInt(value, 10)
        break
      case 'fixed cols':
        grid.fixed = parseInt(value, 10)
        break
      case 'total':
        if (e.target.checked) {
          gridCol.total = true
        } else {
          delete gridCol.total
        }
        break
      case 'width':
        $$('.br-selected').forEach(el => {
          if (el.tagName === 'LABEL' || isReport) {
            el.style.width = value
          } else {
            el.parentElement.style.width = value
          }  
        })  
        break
      case 'height':
        $$('.br-selected').forEach(el => el.style.height = value)  
        break
      case 'hidden':
        if (e.target.checked) {
          el.classList.add('br-hidden')
          if (el.nextElementSibling && el.tagName === 'INPUT') el.nextElementSibling.classList.add('br-hidden')
        } else {
          el.classList.remove('br-hidden')
          if (el.nextElementSibling && el.tagName === 'INPUT') el.nextElementSibling.classList.remove('br-hidden')
        }
        break
      case 'disabled':
        if (e.target.checked) el.classList.add('br-disabled')
        else el.classList.remove('br-disabled')
        break
      case 'readonly':
				if (grid) {
					if (e.target.checked) grid.readonly = true
					else delete grid.readonly
				} else {
					if (e.target.checked) el.classList.add('br-readonly')
					else el.classList.remove('br-readonly')
				}
        break
      case 'align':
				if (gridCol) {
					if (value.length > 0) {
						gridCol.align = value
					} else {
						delete gridCol.align
					}
				} else {
	        $$('.br-selected').forEach(el => {
	          el.style.textAlign = value
	        })
				}
        break
      case 'landscape':
				if (e.target.checked) {
					el.classList.add('br-landscape')
				} else {
					el.classList.remove('br-landscape')
				}
        break
      case 'font':
				el.style.font = value
        break
      case 'border':
				el.style.border = value
        break
      case 'backward':
				if (e.target.checked) {
					el.classList.add('br-backward')
					el.style.border = '1px solid'
				} else {
					el.classList.remove('br-backward')
				}
        break
      default:
    }
    
    if (grid) {
			const form = el.tagName === 'FORM' ? el : el.closest('form')
			if (form) {
				delete grid.dummy
				grid.columns.forEach(c => delete c.data)
				form.setAttribute('data-grid', JSON.stringify(grid))
			}
		}

    modified(true)
  }








  // hidden/disabled/readonly
  const atr = {type: "checkbox", handlerChange: handlerChange}
  const hdr = <div class="columns">
                <Label class="column is-small is-one-third">hid/dis/ro</Label>
                <div class="column control">
                  <Input name="hidden" value={el.classList.contains('br-hidden')} {...atr} />
                  <Input name="disabled" value={el.classList.contains('br-disabled')} class="hdr" {...atr} />
                  <Input name="readonly" value={el.classList.contains('br-readonly')} class="hdr" {...atr} />
                </div>
              </div>
  
  // field
  const field = (label, attr) => {
    objAddProp(attr, 'class', 'is-small', true)
    attr.name = label
    attr.handlerChange = handlerChange
    return (
      <FieldColumn labelAttr={{class: 'is-small is-one-third'}} controlAttr={{class: 'column'}} inputAttr={attr}>
        {label}
      </FieldColumn>
    )
  }

  const name = field('name', {value: el.name})
  const id = field('id', {value: el.id})
  const plsh = field('placeholder', {value: el.getAttribute('placeholder') || ''})
  const tags = [
    {val: 'INPUT'},
    {val: 'SELECT'},
    {val: 'TEXTAREA'},
  ]
  const types = [
    {val: '', txt: 'text'},
    {val: 'number'},
    {val: 'checkbox'},
    {val: 'date'},
    {val: 'datetime-local'},
    {val: 'time'},
    {val: 'radio'},
    {val: 'button'},
    {val: 'email'},
    {val: 'file'},
    {val: 'image'},
    {val: 'password'},
    {val: 'autocomplete'},
    {val: 'color'},
  ]
  const tdtypes = types.concat([
    {val: 'select'},
    {val: 'textarea'},
  ])
  const colors = [
    {val: 'is-primary'},
    {val: 'is-info'},
    {val: 'is-success'},
    {val: 'is-warning'},
    {val: 'is-danger'},
  ]
  const styles = [
    {val: 'is-outlined', txt: 'outlined'},
    {val: 'is-inverted', txt: 'inverted'},
    {val: 'is-rounded', txt: 'rounded'},
  ]
  const sizes = [
    {val: 'is-small', txt: 'small'},
    {val: 'is-medium', txt: 'medium'},
    {val: 'is-large', txt: 'large'},
  ]
  const align = [
    {val: ''},
    {val: 'center'},
    {val: 'right'},
  ]
  const hasClass = (select) => {
    let cls = null
    select.forEach(s => {
      if (el.classList.contains(s.val)) cls = s.val
    })
    return cls
  }
  const size = field('size', {type: 'select', value: hasClass(sizes), data: sizes, default: 'normal'})
  const style = field('style', {type: 'select', value: hasClass(styles), data: styles, default: 'normal'})


	// getColor
  const getColor = (elem) => {
    colors.forEach(c => {
			if (elem.classList.contains(c.val)) {
				return c.val
			}
		})
    //return colors.reduce((a,o) => elem.classList.contains(o.val) ? a=o.val : null )
  }
	// setColor
	const setColor = (elem, value) => {
    colors.forEach(c => {
			if (elem.classList.contains(c.val)) {
				elem.classList.replace(c.val, value)
				return
			}
		})
	}







  // properties
  let props = []
  switch(el.tagName) {
    case 'FORM':
      props.push(field('tagName', {value: el.tagName, readonly: true}))
      props.push(field('name', {value: el.getAttribute('name'), readonly: true}))
      if (!isReport) {
				props.push(field('query', {type: 'textarea', 
                                value: el.getAttribute('data-query') || ''}))
      }
      if (grid) {
        let fields = ''
        grid.columns.forEach(c => {
          if (fields.length > 0) fields += ','
          fields += c.name
        })  
        props.push(field('order', {type: 'textarea', value: fields}))
        props.push(field('edit form', {value: grid.form}))
        props.push(field('rows', {value: grid.rows}))
        props.push(field('fixed cols', {value: grid.fixed}))
				props.push(field('readonly', {type: 'checkbox', value: grid.readonly}))
      } else if (isReport) {
				props.push(field('type', {value: 'report', readonly: true}))
				props.push(field('font', {value: el.style.font}))
				props.push(field('landscape', {type: 'checkbox', value: el.classList.contains('br-landscape')}))
			} else {
        props.push(field('list', {type: 'textarea', value: el.getAttribute('data-list') || ''}))
        props.push(size)
        props.push(hdr)
      }
      break
    
    case 'LABEL':
      props.push(field('tagName', {value: el.tagName, readonly: true}))
      props.push(field('text', {value: el.textContent}))
			if (isReport) {
				props.push(field('font', {value: el.style.font}))
			} else {
				props.push(field('for', {value: el.getAttribute('for') || ''}))
			} 
      props.push(field('width', {value: el.style.width}))
			if (isReport) {
				props.push(field('height', {value: el.style.height}))
				props.push(field('border', {value: el.style.border}))
        props.push(field('align', {type: 'select', value: el.style.textAlign, data: align}))
				props.push(field('backward', {type: 'checkbox', value: el.classList.contains('br-backward')}))
			} else {
				props.push(size)
				props.push(field('hidden', {type: 'checkbox', value: el.classList.contains('br-hidden')}))
			}
      break

    case 'INPUT':
      props.push(field('tagName', {type: 'select', value: el.tagName, data: tags}))
      let brtype
      el.classList.forEach(e => {
        if (e.substring(0,3) === 'br-') {
          const t = e.substring(3)
          if (types.find(o => o.val === t)) {
            brtype = t
          }           
        }
      })
      props.push(field('type', {type: 'select', value: brtype || el.type, data: types}))
      if (el.type === 'button') {
        props.push(field('text', {value: el.value}))
        props.push(style)
      }
      if (el.type === 'radio') {
        props.push(field('name', {value: el.name, readonly: true}))
        props.push(field('text', {value: el.nextSibling.textContent}))
        props.push(field('value', {value: el.value}))
      } else {
        props.push(name)
      }
      if (isReport) {
				props.push(field('font', {value: el.style.font}))
			} else {
				props.push(id)
			}
      if (!isReport && !'number,checkbox,radio,datetime-local,color,button'.includes(el.type)) {
        props.push(plsh)
      }
      if (el.classList.contains('br-number')) {
        props.push(field('decimals', {value: el.getAttribute('data-decimals') || ''}))
      }
      if (el.classList.contains('br-autocomplete')) {
				props.push(field('query', {type: 'textarea', value: el.getAttribute('data-query') || ''}))
				props.push(field('list', {type: 'textarea', value: el.getAttribute('data-list') || ''}))
      }
      if (!'checkbox,radio,button'.includes(el.type) && !el.classList.contains('br-autocomplete')) {
        if (!isReport) {
					props.push(field('help', {value: el.getAttribute('help') || ''}))
					if (el.hasAttribute('help')) {
						props.push(field('help color', {type: 'select', 
													value: getColor(el.nextElementSibling.firstChild), data: colors}))
					}
				}
        props.push(field('width', {value: el.parentElement.style.width}))
        if (isReport) {
					props.push(field('height', {value: el.style.height}))
					props.push(field('border', {value: el.style.border}))
				}
        props.push(field('align', {type: 'select', value: el.style.textAlign, data: align}))
      }
      if (!isReport) {
				props.push(size)
				props.push(hdr)
			}
      break

    case 'SELECT':
      props.push(field('tagName', {type: 'select', value: el.tagName, data: tags}))
      props.push(name)
      props.push(id)
      props.push(size)
      props.push(hdr)
      props.push(field('query', {type: 'textarea', value: el.getAttribute('data-query') || ''}))
      props.push(field('list', {type: 'textarea', value: el.getAttribute('data-list') || ''}))
      break
    
    case 'TEXTAREA':
      props.push(field('tagName', {type: 'select', value: el.tagName, data: tags}))
      props.push(name)
      props.push(id)
      props.push(plsh)
      props.push(size)
      props.push(hdr)
      break
    
    case 'BUTTON':
      props.push(field('tagName', {value: el.tagName, readonly: true}))
      props.push(field('text', {value: el.textContent}))
      props.push(name)
      props.push(id)
      props.push(style)
      props.push(size)
      props.push(field('color', {type: 'select', value: hasClass(colors), data: colors, default: 'is-primary'}))
      props.push(field('hidden', {type: 'checkbox', value: el.classList.contains('br-hidden')}))
      break    

    case 'IMG':
      props.push(field('tagName', {value: el.tagName, readonly: true}))
      props.push(name)
      props.push(id)
      props.push(field('width', {value: el.parentElement.style.width}))
      break    
      
    case 'TD':
			if (gridCol) {
	      props.push(field('tagName', {value: el.tagName, readonly: true}))
	      props.push(field('type', {type: 'select', value: gridCol.type, data: tdtypes}))
	      props.push(field('text', {value: gridCol.header}))
	      props.push(field('name', {value: gridCol.name}))
	      if ('select,autocomplete'.includes(gridCol.type)) {
					props.push(field('query', {type: 'textarea', value: gridCol.query}))
					props.push(field('list', {type: 'textarea', value: gridCol.list}))
	      } else if (gridCol.type === 'number') {
					props.push(field('decimals', {value: gridCol.decimals}))
					props.push(field('total', {type: 'checkbox', value: gridCol.total}))
					props.push(field('align', {type: 'select', value: gridCol.align, data: align}))
				}
			}
      break    
      
    default:  
  }

  if (el.classList.contains('tab')) {
    props.push(field('text', {value: el.firstChild.firstChild.textContent}))
	
	} else if (el.classList.contains('br-band')) {
    props.push(field('name', {value: el.getAttribute('name'), readonly: true}))
		props.push(field('type', {value: 'band', readonly: true}))
		props.push(field('query', {type: 'textarea', value: el.getAttribute('data-query') || ''}))
		props.push(field('height', {value: el.style.height}))
	}
  
  if (grid) {
    const reRender = () => {
      if (grid.reorder) {
        let cols = []
        const flds = strSplit(grid.reorder, ',')
        flds.forEach(f => {
          if (gridCol) {
            cols.push(gridCol)
          }
        })
        grid.columns = cols
        delete grid.reorder
      }
      gridRender(grid, $('form'), false, true)
    }
    props.push(field('', {class: 'is-primary', type: 'input-button', onClick: reRender, value: 'Apply'}))
  }






  posDialog('props') 
  render(
    <Dialog class="br-props" title="Properties">
      <div class="columns">
      <div class="column">
        {props}
      </div>
      </div>
    </Dialog>,
    br.dlg
  )
  
  $$('.br-props .field').forEach(f => {
		if (e$(f, 'textarea')) {
			f.classList.add('textarea-field')
		}
	})
}







/* 
 *  Create radio button
 */
export const addRadio = (parent, name) => {
  const label = createElement(`
		<label class="radio" disabled>
			<input type="radio" name="${name}" readonly="true" value="value">
			Label
		</label>
  `)
  parent.append(label)
  itemEvents(e$(label, 'input'))
}






