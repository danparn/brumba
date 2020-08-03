import { createVNode, createComponentVNode } from "../web_modules/inferno.js"; /*
                                                                                * Brumba
                                                                                * Copyright (c) 2012-2020 Dan Parnete
                                                                                *
                                                                                * This source code is licensed under the MIT license.
                                                                               */


import { render } from "../web_modules/inferno.js";
import { $, $$, br, modified, remote, createElement } from "./util.js";
import { renderToString, ListBox } from "./components.js";
import { properties } from "./ide-props.js";
import { gridRender } from "./ide-grid.js";
import { tabClick, pageWrapper } from "./page.js";
import { show } from "./basiccontext/basicContext.js";



/* 
                                                        *  New page
                                                        */
export var newPage = () => {
  var ws = br.ws;
  var wo = br.wo;
  wo.value = new Date().toLocaleString();
  wo.name = 'pages';
  $$('head style.br-css').forEach(s => s.remove());

  render(null, ws);
  ws.innerHTML = pageWrapper('<div class="tile is-ancestor br-page br-borders" name="' + wo.value + '"></div>');
  tileEvents($('.tile'));
  modified(true);
};



/* 
    *  New tile
    */
var newTile = () => {
  var tile = document.createElement('div');
  tile.className = 'tile br-borders';
  tileEvents(tile);
  return tile;
};



/* 
    *  Tile events
    */
export var tileEvents = tile => {
  // click
  tile.addEventListener('click', e => {
    var t = e.path.find(r => r.className.includes('tile'));
    e.stopPropagation();
    e.preventDefault();
    $$('.br-selected').forEach(el => el.classList.remove('br-selected'));
    if (!t.className.includes('is-ancestor')) {
      t.classList.add('br-selected');
    }
  });

  // contextmenu
  tile.addEventListener('contextmenu', e => {
    e.stopPropagation();
    e.preventDefault();
    modified(true);

    var tile = e.path.find(r => r.className.includes('tile'));

    var vertical = () => {
      var t = tile;
      if (tile.classList.contains('tab-pane')) {
        t = newTile();
        tile.append(t);
      }
      t.append(newTile());
      t.append(newTile());
    };

    var horizontal = () => {
      tile.classList.add('is-vertical');
      tile.append(newTile());
      tile.append(newTile());
    };

    var add = () => {
      tile.parentElement.append(newTile());
    };

    var tabs = () => {
      var div = createElement(renderToString(createVNode(1, "div", null, [createVNode(1, "div",

      "tabs is-boxed", createVNode(1, "ul", null, [createVNode(1, "li",

      "tab is-active", createVNode(1, "a", null, createVNode(1, "span", null, "Tab1", 16), 2), 2, { "name": "tab_1" }), createVNode(1, "li",


      "tab", createVNode(1, "a", null, createVNode(1, "span", null, "Tab2", 16), 2), 2, { "name": "tab_2" })], 4), 2), createVNode(1, "div",




      "tab-content", [createVNode(1, "div",
      "tab-pane tile br-borders", null, 1, { "name": "tab_1" }), createVNode(1, "div",
      "tab-pane tile br-borders", null, 1, { "name": "tab_2" })], 4)], 4)));



      tile.classList.add('is-vertical');
      tile.append(div.firstChild);
      tile.append(div.lastChild);
      $('.tab-content').lastChild.style.display = 'none';
      $$('.tabs li').forEach(t => {
        tabEvents(t);
        tabClick(t);
      });
    };

    var form = () => {
      //if (!tile.firstChild) {
      var q = { cmd: 'GET', db: br.app, coll: 'forms', fields: 'name' };
      remote(q).then(res => {
        if (res.err) return;
        var dat = [];
        res.forEach(r => {
          dat.push({ id: r._id, text: r.name });
        });
        render(createComponentVNode(2, ListBox, { "data":
          dat, "title": "Forms", "onClick": onClick }),
        br.dlg);

      });
    };

    var onClick = ev => {
      render(null, br.dlg);
      tile.setAttribute('data-form', ev.target.id);
      var q = { cmd: 'GET', db: br.app, coll: 'forms', where: { _id: ev.target.id } };
      remote(q).then(res => {
        if (res.err) return;
        if (res[0]) {
          tile.innerHTML = res[0].html;
          var _form = tile.firstChild;
          if (_form.hasAttribute('data-grid')) {
            gridRender(JSON.parse(_form.getAttribute('data-grid')), _form, true, true);
          }
        }
      });
      //}
    };

    show([
    { title: 'Split vertical', fn: vertical },
    { title: 'Split horizontal', fn: horizontal },
    { title: 'Add column', fn: add },
    { title: 'Add tabs', fn: tabs },
    { title: 'Set form', fn: form }],
    e);
  });
};




/* 
    *  Next tab nymber
    */
var nextTab = () => {
  var n = 0;
  $$('.tabs li').forEach(t => {
    var name = t.getAttribute('name');
    if (name) {
      n = Math.max(n, parseInt(name.substring(4), 10));
    }
  });
  return n + 1;
};



/* 
    *  Tab events
    */
export var tabEvents = tab => {
  // click
  tab.addEventListener('click', e => {
    if ($('.br-props')) properties(tab);
  });

  // contextmenu
  tab.addEventListener('contextmenu', e => {
    e.stopPropagation();
    e.preventDefault();

    var add = () => {
      var n = nextTab();
      var t = createElement(renderToString(createVNode(1, "li",
      "tab", createVNode(1, "a", null, createVNode(1, "span", null,
      'Tab' + n, 0), 2), 2, { "name": 'tab_' + n })));


      tab.parentElement.append(t);
      tabEvents(t);
      tabClick(t);
      var tile = createElement(renderToString(createVNode(1, "div",
      "tab-pane tile br-borders", null, 1, { "name": "tab_" + n })));

      tile.style.display = "none";
      $('.tab-content').append(tile);
    };

    var remove = () => {
      var name = tab.getAttribute('name');
      var cont = $('.tab-content');
      cont.remove(cont.querySelector('[name=' + name + ']'));
      tab.parentElement.remove(tab);
    };

    show([
    { title: 'Add tab', fn: add },
    { title: 'Remove tab', fn: remove }],
    e);
  });
};


/*
   
   */