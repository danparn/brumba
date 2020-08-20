/*
 * Brumba
 * Copyright (c) 2012-2020 Dan Parnete
 *
 * This source code is licensed under the MIT license.
*/

import { render } from 'web/inferno'
import { strSplit, strCap } from './common'
import { $, $$, br, modified } from './util'
import { copy } from './ide-form'
import { properties, toolsText } from './ide-props'
import { pageWrapper } from './page'
import { Grid } from './grid'
import { show } from './basiccontext/basicContext'




/* 
 *  New grid
 */
export const newGrid = () => {
  const grid = {
    rows: 10,
    fixed: 0,
    columns: []
  }
  const ws = br.ws
  const wo = br.wo
  wo.value = new Date().toLocaleString()
  wo.name = 'forms'
  wo.modified = true
  render(null, ws)
  ws.innerHTML = pageWrapper('<form name="'+wo.value+'" />')
  
  const text = toolsText()
  const flds = strSplit(text, ',') || []
  if (flds.length) {
    flds.forEach(f => {
      const fd = strSplit(f, ':')
      grid.columns.push({
        name: fd[0],
        header: fd[1] || strCap(fd[0]).replace(/_/g, ' ')
      })
    })
    gridRender(grid, $('form'))
  }
}



/* 
 *  Grid render
 */
export const gridRender = (grid, root, nomodif, noevents) => {
//console.log(`gridRender: nomodif=${nomodif}  noevents=${noevents}`)
  let data = []
  let rdata = {}
  let footer = {}
  grid.columns.forEach(c => {
    rdata[c.name] = c.name
    if (c.total) footer[c.name] = c.name
  })
  grid.dummy = true
  for (let i=0; i < grid.rows; ++i) {
    data.push(rdata)
  }
  if (footer !== {}) grid.footer = footer
  
  const cellClick = e => {
    e.stopPropagation()
    e.preventDefault()
    e.target.classList.add('is-selected')
    if ($('.br-props')) properties(e.target, grid)
  }
  
  render(null, root)
  render(
    <Grid grid={grid} data={data} cellClick={cellClick} />,
    root
  )
  
  // events
  const form = $('form')
  if (!noevents) {
    form.addEventListener('click', (e) => {
      e.preventDefault()
      $$('.is-selected').forEach(el => el.classList.remove('is-selected'))
      if ($('.br-props')) properties(form, grid)
    })
    form.addEventListener('contextmenu', (e) => {
      e.preventDefault()
  
      const add = () => {
        grid.columns.push({
          name: 'field',
          header: 'Field'
        })
        rdata['field'] = 'field'
        gridRender(grid, root, nomodif, true)
      }
  
      const remove = () => {
        const c = $('.is-selected')
        if (c) {
          grid.columns = grid.columns.filter(r => r.name !== c.textContent)
          gridRender(grid, root, nomodif, true)
        }
      }      
      
      show([
        {title: 'Add column', fn: add},
        {title: 'Remove column', fn: remove},
				{},
				{title: 'Copy', fn: copy},
      ], e)
    
    })  
  }

  delete grid.data
  delete grid.footer
  form.setAttribute('data-grid', JSON.stringify(grid))
  if ($('.br-props')) properties(form, grid)
  if (!nomodif) modified(true)
}






