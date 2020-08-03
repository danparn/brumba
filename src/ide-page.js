/*
 * Brumba
 * Copyright (c) 2012-2020 Dan Parnete
 *
 * This source code is licensed under the MIT license.
*/


import { render } from 'web/inferno'
import { $, $$, br, modified, remote, createElement } from './util'
import { renderToString, ListBox } from './components'
import { properties } from './ide-props'
import { gridRender } from './ide-grid'
import { tabClick, pageWrapper } from './page'
import { show } from './basiccontext/basicContext'



/* 
 *  New page
 */
export const newPage = () => {
  const ws = br.ws
  const wo = br.wo
  wo.value = new Date().toLocaleString()
  wo.name = 'pages'
  $$('head style.br-css').forEach(s => s.remove())

  render(null, ws)
  ws.innerHTML = pageWrapper('<div class="tile is-ancestor br-page br-borders" name="'+wo.value+'"></div>')
  tileEvents($('.tile'))
  modified(true)
}



/* 
 *  New tile
 */
const newTile = () => {
  const tile = document.createElement('div')
  tile.className = 'tile br-borders'
  tileEvents(tile)
  return tile
}



/* 
 *  Tile events
 */
export const tileEvents = (tile) => {
  // click
  tile.addEventListener('click', (e) => {
    const t = e.path.find(r => r.className.includes('tile'))
    e.stopPropagation()
    e.preventDefault()
    $$('.br-selected').forEach(el => el.classList.remove('br-selected'))
    if (!t.className.includes('is-ancestor')) {
      t.classList.add('br-selected')
    }  
  })

  // contextmenu
  tile.addEventListener('contextmenu', (e) => {
    e.stopPropagation()
    e.preventDefault()
    modified(true)

    const tile = e.path.find(r => r.className.includes('tile'))

    const vertical = () => {
			let t = tile
			if (tile.classList.contains('tab-pane')) {
				t = newTile()
				tile.append(t)
			}
      t.append(newTile())
      t.append(newTile())
    }

    const horizontal = () => {
      tile.classList.add('is-vertical')
      tile.append(newTile())
      tile.append(newTile())
    }      
    
    const add = () => {
      tile.parentElement.append(newTile())
    }      
    
    const tabs = () => {
      const div = createElement(renderToString(
        <div>
          <div class="tabs is-boxed">
            <ul>
              <li class="tab is-active" name="tab_1">
                <a><span>Tab1</span></a>
              </li>
              <li class="tab" name="tab_2">
                <a><span>Tab2</span></a>
              </li>
            </ul>
          </div>
          <div class="tab-content">
            <div class="tab-pane tile br-borders" name="tab_1" />
            <div class="tab-pane tile br-borders" name="tab_2" />
          </div>
        </div>
      ))
      tile.classList.add('is-vertical')
      tile.append(div.firstChild)
      tile.append(div.lastChild)
      $('.tab-content').lastChild.style.display = 'none'
      $$('.tabs li').forEach(t => {
        tabEvents(t)
        tabClick(t)
      })
    }      
    
    const form = () => {
      //if (!tile.firstChild) {
        const q = {cmd: 'GET', db: br.app, coll: 'forms', fields: 'name'}
        remote(q).then(res => {
          if (res.err) return
          let dat = []
          res.forEach(r => {
            dat.push({id: r._id, text: r.name})
          });        
          render(
            <ListBox data={dat} title="Forms" onClick={onClick} />,
            br.dlg
          )
        })
      }

      const onClick = (ev) => {
        render(null, br.dlg)
        tile.setAttribute('data-form', ev.target.id)
        const q = {cmd: 'GET', db: br.app, coll: 'forms', where: {_id: ev.target.id}}
        remote(q).then(res => {
          if (res.err) return
          if (res[0]) {
            tile.innerHTML = res[0].html
            const form = tile.firstChild
            if (form.hasAttribute('data-grid')) {
              gridRender(JSON.parse(form.getAttribute('data-grid')), form, true, true)
            }
          }
        })
      //}
    }      
    
    show([
      {title: 'Split vertical', fn: vertical},
      {title: 'Split horizontal', fn: horizontal},
      {title: 'Add column', fn: add},
      {title: 'Add tabs', fn: tabs},
      {title: 'Set form', fn: form},
    ], e)
  })
}




/* 
 *  Next tab nymber
 */
const nextTab = () => {
  let n = 0
  $$('.tabs li').forEach(t => {
    const name = t.getAttribute('name')
    if (name) {
      n = Math.max(n, parseInt(name.substring(4), 10))
    }
  })
  return n + 1
}



/* 
 *  Tab events
 */
export const tabEvents = (tab) => {
  // click
  tab.addEventListener('click', (e) => {
    if ($('.br-props')) properties(tab)
  })

  // contextmenu
  tab.addEventListener('contextmenu', (e) => {
    e.stopPropagation()
    e.preventDefault()

    const add = () => {
      const n = nextTab()
      const t = createElement(renderToString(
        <li class="tab" name={'tab_'+n}>
          <a><span>{'Tab'+n}</span></a>
        </li>
      ))
      tab.parentElement.append(t)
      tabEvents(t)
      tabClick(t)
      const tile = createElement(renderToString(
        <div class="tab-pane tile br-borders" name={"tab_"+n} />
      ))
      tile.style.display = "none"
      $('.tab-content').append(tile)
    }   
    
    const remove = () => {
      const name = tab.getAttribute('name')
      const cont = $('.tab-content')
      cont.remove(cont.querySelector('[name='+name+']'))
      tab.parentElement.remove(tab)
    }   
    
    show([
      {title: 'Add tab', fn: add},
      {title: 'Remove tab', fn: remove},
    ], e)
  })
}


/*

*/
