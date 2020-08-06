/*
 * Brumba
 * Copyright (c) 2012-2020 Dan Parnete
 *
 * This source code is licensed under the MIT license.
*/

import { render } from 'web/inferno'
import MetisMenu from 'web/metismenujs'
import { Navbar, closeSidebar } from './components'
import { $, $$, br, remote, createElement, loadCSS } from './util'
import { pageOpen, pageRender, toggleList, pageSearch } from './page';
import { formList, formUpdate, formSave, formSearch, formDelete } from './form'
import { gridRender } from './grid'
import { test } from './test';

// css
loadCSS('/css/app.css')





const App = (props) => {
  Object.assign(br, JSON.parse(props.br))
	const save = () => $$('form').forEach(f => formSave(f))
	const clear = () => {
	  $$('form').forEach(f => {
			if (f.hasAttribute('data-grid')) {
				gridRender(f, [])
			} else {
				formUpdate(f, [])
			}
		})
	}
	
  return (
    <div class="br-container">
      <Navbar>
        <div class="logo">logo</div>
        <a class="space" title="new" onClick={clear}><i class="fa fa-file"></i><span></span></a>
        <a id="br-save" title="save" onClick={save}><i class="fa fa-save"></i><span></span></a>
        <a title="search" onClick={formSearch}><i class="fa fa-search"></i><span></span></a>
        <a title="complex search" onClick={pageSearch}><i class="fa fa-search-plus"></i><span></span></a>
        <a title="toggle list" class="space" onClick={toggleList}><i class="fa fa-list-ol"></i><span></span></a>
        <a title="delete" class="align-right" onClick={formDelete}><i class="fa fa-trash"></i><span></span></a>
      </Navbar>
      <nav class="sidebar-nav" id="br-sidebar">
        <a class="closebtn" onclick={closeSidebar}>&times;</a>
        <ul class="metismenu" id="br-menu" />
      </nav>
      <div id="br-dialog" />
      <div id="br-workspace" class="container is-fluid" />
    </div>
  )
}

App.defaultHooks = {
  onComponentDidMount(domNode) {
    br.ws = $('#br-workspace')
    br.dlg = $('#br-dialog')
    $('#br-menu').innerHTML = br.menu
    $$('#br-menu li').forEach(li => {
      if (li.childElementCount > 1) {
        li.firstChild.classList.add('has-arrow')
      }
    })
    $$('#br-menu a[name]').forEach(el => el.onclick = (e) => {
      closeSidebar()
      if (e.target.name === 'IDE') {
        window.open(window.location.origin + '/ide')
      } else {
        pageOpen(e.target.name)
      }
    })
    new MetisMenu("#br-menu")
    if (br.open) {
			pageOpen(br.open)
		}
//pageOpen('forms.VehicleSetup')
//test()
  }
}

export default App;


