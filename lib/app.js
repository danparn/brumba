import { createVNode, createComponentVNode } from "../web_modules/inferno.js"; /*
                                                                                * Brumba
                                                                                * Copyright (c) 2012-2020 Dan Parnete
                                                                                *
                                                                                * This source code is licensed under the MIT license.
                                                                               */

import { render } from "../web_modules/inferno.js";
import MetisMenu from "../web_modules/metismenujs.js";
import { Navbar, closeSidebar } from "./components.js";
import { $, $$, br, remote, createElement, loadCSS } from "./util.js";
import { pageOpen, pageRender, toggleList, pageSearch } from "./page.js";
import { formList, formUpdate, formSave, formSearch, formDelete } from "./form.js";
import { gridRender } from "./grid.js";
import { test } from "./test.js";

// css
loadCSS('/css/app.css');





var App = props => {
  Object.assign(br, JSON.parse(props.br));
  var save = () => $$('form').forEach(f => formSave(f));
  var clear = () => {
    $$('form').forEach(f => {
      if (f.hasAttribute('data-grid')) {
        gridRender(f, []);
      } else {
        formUpdate(f, []);
      }
    });
  };

  return createVNode(1, "div",
  "br-container", [createComponentVNode(2, Navbar, { children: [createVNode(1, "div",

    "logo", "logo", 16), createVNode(1, "a",
    "space", [createVNode(1, "i", "fa fa-file"), createVNode(1, "span")], 4, { "title": "new", "onClick": clear }), createVNode(1, "a", null, [createVNode(1, "i",
    "fa fa-save"), createVNode(1, "span")], 4, { "id": "br-save", "title": "save", "onClick": save }), createVNode(1, "a", null, [createVNode(1, "i",
    "fa fa-search"), createVNode(1, "span")], 4, { "title": "search", "onClick": formSearch }), createVNode(1, "a", null, [createVNode(1, "i",
    "fa fa-search-plus"), createVNode(1, "span")], 4, { "title": "complex search", "onClick": pageSearch }), createVNode(1, "a",
    "space", [createVNode(1, "i", "fa fa-list-ol"), createVNode(1, "span")], 4, { "title": "toggle list", "onClick": toggleList }), createVNode(1, "a",
    "align-right", [createVNode(1, "i", "fa fa-trash"), createVNode(1, "span")], 4, { "title": "delete", "onClick": formDelete })] }), createVNode(1, "nav",

  "sidebar-nav", [createVNode(1, "a",
  "closebtn", "\xD7", 16, { "onclick": closeSidebar }), createVNode(1, "ul",
  "metismenu", null, 1, { "id": "br-menu" })], 4, { "id": "br-sidebar" }), createVNode(1, "div", null, null, 1, { "id":

    "br-dialog" }), createVNode(1, "div",
  "container is-fluid", null, 1, { "id": "br-workspace" })], 4);


};

App.defaultHooks = {
  onComponentDidMount(domNode) {
    br.ws = $('#br-workspace');
    br.dlg = $('#br-dialog');
    $('#br-menu').innerHTML = br.menu;
    $$('#br-menu li').forEach(li => {
      if (li.childElementCount > 1) {
        li.firstChild.classList.add('has-arrow');
      }
    });
    $$('#br-menu a[name]').forEach(el => el.onclick = e => {
      closeSidebar();
      if (e.target.name === 'IDE') {
        window.open(window.location.origin + '/ide');
      } else {
        pageOpen(e.target.name);
      }
    });
    new MetisMenu("#br-menu");
    if (br.open) {
      pageOpen(br.open);
    }
    //pageOpen('forms.VehicleSetup')
    //test()
  } };


export default App;