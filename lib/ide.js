import { createVNode, createComponentVNode } from "../web_modules/inferno.js";function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};} /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  * Brumba
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  * Copyright (c) 2012-2020 Dan Parnete
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  * This source code is licensed under the MIT license.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 */


import { render } from "../web_modules/inferno.js";
import { objLess, translate, hex24 } from "./common.js";
import { Textarea } from "./inferno-bulma.js";
import { Navbar, Sidebar, closeSidebar, closeDialog, confirmModal, imgLoad, notification } from "./components.js";
import { $, $$, e$$, br, remote, modified, createElement, createStyle, createScript, loadCSS, unselect } from "./util.js";
import { newPage, tileEvents, tabEvents } from "./ide-page.js";
import { pageRender, toggleList, pageWrapper } from "./page.js";
import { newForm, addFields, fieldEvents, itemEvents, containerEvents } from "./ide-form.js";
import { newGrid, gridRender } from "./ide-grid.js";
import { newReport, openReport } from "./ide-report.js";
import { properties } from "./ide-props.js";
import { Editor, openDialogEditor, dialogEditor, onApplay } from "./ide-editor.js";

// css
loadCSS('/node_modules/basiccontext/dist/basicContext.min.css');
loadCSS('/node_modules/basiccontext/dist/themes/default.min.css');
loadCSS('/css/ide.css');



/* 
                          *  Ide
                          */
var Ide = props => {
  Object.assign(br, JSON.parse(props.br));
  var forms, pages, reports, scripts;
  var par = {
    cmd: 'GET',
    db: br.app,
    fields: 'name',
    sort: { name: 1 } };

  keyEvents();

  // tools
  var tools = e => {
    $$('style.br-css').forEach(s => s.remove());
    $$('script.br-events').forEach(s => s.remove());
    switch (e.target.name) {
      case 'page':
        selected(e);
        closeSidebar();
        newPage();
        break;
      case 'form':
        selected(e);
        closeSidebar();
        newForm();
        break;
      case 'grid':
        selected(e);
        closeSidebar();
        newGrid();
        break;
      case 'report':
        selected(e);
        closeSidebar();
        newReport();
        break;
      case 'fields':
        $('#br-sidebar').style.width = "0px";
        addFields();
        break;
      case 'script':
        selected(e);
        closeSidebar();
        br.wo.name = 'scripts';
        br.wo.value = new Date().toLocaleString();
        render(null, br.ws);
        br.ws.innerHTML = '';
        render(createComponentVNode(2, Editor), br.ws);
        break;
      default:}

  };

  // menu
  var getMenu = e => {
    closeSidebar();
    selected(e);
    par.coll = 'application';
    par.where = { section: 'menu' };
    delete par.fields;
    remote(par).then(res => {
      if (res.err) return;
      var menu = res[0] ? res[0].menu : '';
      if (res[0]) br.wo.id = res[0]._id;
      render(null, br.ws);
      br.ws.innerHTML = '';
      closeDialog();
      render(createComponentVNode(2, Editor, { "code": menu }), br.ws);
    });
  };

  // renderNav
  var renderNav = () => {
    var toolsText = localStorage ? localStorage.getItem('br.tools-text') : '';
    var workonChange = e => {
      e.target.modified = true;
      modified(true);
      if ($('.br-props')) properties($('.br-selected'));
    };
    var onProperties = e => {
      properties($('.br-selected'));
    };
    var onEditor = e => {
      dialogEditor(e.target.textContent);
    };
    var onSave = e => {
      save(() => {
        reloadList();
      });
    };
    var onDel = e => {
      del(() => {
        reloadList();
        render(null, br.ws);
        br.ws.innerHTML = '';
      });
    };

    var nav = createVNode(1, "div",
    "br-container", [createComponentVNode(2, Navbar, { children: [createVNode(1, "div",

      "logo", "brumba", 16), createVNode(1, "a",
      "space", [createVNode(1, "i", "fas fa-save"), createVNode(1, "span", null, "save", 16)], 4, { "id": "br-save", "onClick": onSave }), createVNode(1, "a", null, [createVNode(1, "i",
      "fa fa-list-alt"), createVNode(1, "span", null, "properties", 16)], 4, { "onClick": onProperties }), createVNode(1, "a", null, [createVNode(1, "i",
      "fa fa-code"), createVNode(1, "span", null, "events", 16)], 4, { "onClick": onEditor }), createVNode(1, "a", null, [createVNode(1, "i",
      "fab fa-css3"), createVNode(1, "span", null, "css", 16)], 4, { "onClick": onEditor }), createVNode(1, "a", null, [createVNode(1, "i",
      "fab fa-html5"), createVNode(1, "span", null, "html", 16)], 4, { "onClick": onEditor }), createVNode(1, "a", null, createVNode(64, "input",
      "input is-small br-workon", null, 1, { "onchange": workonChange }), 2), createVNode(1, "a",
      "space", [createVNode(1, "i", "fa fa-list-ol"), createVNode(1, "span", null, "list", 16)], 4, { "onClick": toggleList }), createVNode(1, "a", null, [createVNode(1, "i",
      "fa fa-border-none"), createVNode(1, "span", null, "borders", 16)], 4, { "onClick": borders }), createVNode(1, "a",
      "align-right", [createVNode(1, "i", "fa fa-trash"), createVNode(1, "span", null, "delete", 16)], 4, { "onClick": onDel })] }), createComponentVNode(2, Sidebar, { children: [createVNode(1, "li", null, [createVNode(1, "a",


      "has-arrow", "FORMS", 16, { "aria-expanded": "false" }), createVNode(1, "ul", "forms", forms, 0)], 4), createVNode(1, "li", null, [createVNode(1, "a",
      "has-arrow", "PAGES", 16, { "aria-expanded": "false" }), createVNode(1, "ul", "pages", pages, 0)], 4), createVNode(1, "li", null, [createVNode(1, "a",
      "has-arrow", "REPORTS", 16, { "aria-expanded": "false" }), createVNode(1, "ul", "reports", reports, 0)], 4), createVNode(1, "li", null, [createVNode(1, "a",
      "has-arrow", "SCRIPTS", 16, { "aria-expanded": "false" }), createVNode(1, "ul", "scripts", scripts, 0)], 4), createVNode(1, "li", null, createVNode(1, "a", null, "MENU", 16, { "name":
        "menu", "onClick": getMenu }), 2), createVNode(1, "li", null, [createVNode(1, "a",
      "has-arrow", "TOOLS", 16, { "aria-expanded": "false" }), createVNode(1, "ul", null, [createVNode(1, "li", null, createVNode(1, "a", null, "new Page", 16, { "name":

        "page", "onClick": tools }), 2), createVNode(1, "li", null, createVNode(1, "a", null, "new Form", 16, { "name":
        "form", "onClick": tools }), 2), createVNode(1, "li", null, createVNode(1, "a", null, "new Grid", 16, { "name":
        "grid", "onClick": tools }), 2), createVNode(1, "li", null, createVNode(1, "a", null, "new Report", 16, { "name":
        "report", "onClick": tools }), 2), createVNode(1, "li", null, createVNode(1, "a", null, "new Script", 16, { "name":
        "script", "onClick": tools }), 2), createVNode(1, "li", null, createVNode(1, "a", null, "add Fields", 16, { "name":
        "fields", "onClick": tools }), 2), createVNode(1, "li", null, createVNode(1, "div",

      "control", createComponentVNode(2, Textarea, { "id":
        "br-tools-text", "value": toolsText }), 2), 2)], 4)], 4)] }), createVNode(1, "div", null, null, 1, { "id":





      "br-dialog" }), createVNode(1, "div",
    "container is-fluid", null, 1, { "id": "br-workspace" })], 4);



    render(nav, $('#root'));
    br.ws = $('#br-workspace');
    br.wo = $('.br-workon');
    br.dlg = $('#br-dialog');
    br.wo.addEventListener('click', unselect);
    //localStorage.clear()
    //newForm()
    //newGrid()
    //newPage()
  };

  // get data and render
  _asyncToGenerator(function* () {
    forms = yield addItems('forms');
    pages = yield addItems('pages');
    reports = yield addItems('reports');
    scripts = yield addItems('scripts');
    renderNav();
  })();
};

export default Ide;






/* 
                     *  Set events
                     */
var setEvents = () => {
  $$('.field').forEach(el => fieldEvents(el));
  $$('.br-label,.image,.button').forEach(el => itemEvents(el));
  $$('.container').forEach(el => containerEvents(el));
};



/* 
    *  Selected items
    */
var selected = e => {
  var wo = br.wo;
  wo.value = e.target.text;
  wo.name = e.target.name;
  wo.id = e.target.id;
  e.target.classList.add('active'); // active item
  modified(false);
};



/* 
    *  Create menu items list
    */
var addItems = /*#__PURE__*/function () {var _ref2 = _asyncToGenerator(function* (coll) {
    var par = {
      cmd: 'GET',
      db: br.app,
      coll: coll,
      fields: 'name',
      sort: { name: 1 } };


    // menuItem
    var menuItem = /*#__PURE__*/function () {var _ref3 = _asyncToGenerator(function* (e) {
        closeSidebar();
        selected(e);
        open(e.target.name, e.target.id);
      });return function menuItem(_x2) {return _ref3.apply(this, arguments);};}();

    var res = yield remote(par);
    delete par.fields;
    delete par.sort;
    var list = [];
    for (var i = 0; i < res.length; ++i) {
      list.push(createVNode(1, "li", null, createVNode(1, "a", null,


      res[i].name, 0, { "name": coll, "id": res[i]._id, "onClick": menuItem }), 2));



    }
    if (list.length === 0) {
      list.push(createVNode(1, "li"));
    }
    return list;
  });return function addItems(_x) {return _ref2.apply(this, arguments);};}();




/* 
                                                                               *  Open by id or name
                                                                               */
var open = /*#__PURE__*/function () {var _ref4 = _asyncToGenerator(function* (coll, id) {
    var ws = br.ws;
    render(null, ws);
    ws.innerHTML = '';
    $$('style.br-css').forEach(s => s.remove());
    $$('script.br-events').forEach(s => s.remove());

    var par = {
      cmd: 'GET',
      db: br.app,
      coll: coll,
      where: hex24.test(id) ? { _id: id } : { name: id } };

    var res = yield remote(par);
    if (res.err || !res[0]) return;
    var rec = res[0];

    switch (coll) {
      case 'pages':
        yield pageRender(rec, true);
        $$('.tile').forEach(t => tileEvents(t));
        $$('.tab').forEach(t => tabEvents(t));
        if ($('.br-page').classList.contains('has-list')) {
          $('.br-list').classList.remove('hidden');
        }
        borders();
        openDialogEditor();
        break;

      case 'forms':
        ws.innerHTML = pageWrapper(rec.html);
        if (rec.css) {
          createStyle(rec.css);
        }
        if (rec.events) {
          $('head').appendChild(createElement("\n\t\t\t\t\t<script class=\"br-events\">".concat(
          rec.events, "</script>\n\t\t\t\t")));

        }
        var form = $('form');
        if (form.classList.contains('has-list')) {
          $('.br-list').classList.remove('hidden');
        }
        if (form.hasAttribute('data-grid')) {
          gridRender(JSON.parse(form.getAttribute('data-grid')), form, true);
        } else {
          $$('form input').forEach(el => {
            el.setAttribute('readonly', '');
            if (!'button,radio'.includes(el.type)) {
              el.value = el.name;
            }
          });
          $$('.field, button').forEach(el => {
            el.setAttribute('draggable', 'true');
          });
          $$('.label').forEach(el => {
            if (!el.parentElement.classList.contains('field')) {
              el.setAttribute('draggable', 'true');
            }
          });
          $$('.image').forEach(img => imgLoad(br.app, img));
          setEvents();
        }
        e$$(form, '[hidden]').forEach(el => {
          el.removeAttribute('hidden');
          el.classList.add('br-hidden');
        });
        borders();
        if ($('.br-props')) properties();else
        openDialogEditor();
        break;

      case 'reports':
        openReport(rec);
        break;

      case 'scripts':
        closeDialog();
        render(createComponentVNode(2, Editor, { "code": rec.code }), ws);
        break;
      default:}

  });return function open(_x3, _x4) {return _ref4.apply(this, arguments);};}();



/* 
                                                                                 *  Reload list
                                                                                 */
export var reloadList = /*#__PURE__*/function () {var _ref5 = _asyncToGenerator(function* () {
    var coll = br.wo.name;
    var list = yield addItems(coll);
    var cont = $('ul.' + coll);
    render(null, cont);
    cont.innerHTML = '';
    render(createVNode(1, "div", null, list, 0), cont);
  });return function reloadList() {return _ref5.apply(this, arguments);};}();



/* 
                                                                               *  Save
                                                                               */
var save = cb => {
  var saveBut = $('#br-save');
  var modif = 'modified';
  if (!saveBut.classList.contains(modif)) return;
  var wo = br.wo;
  var cme = $('.CodeMirror');
  var cm = cme ? cme.CodeMirror : null;
  var css;
  unselect();
  $$('.br-borders').forEach(el => el.classList.remove('br-borders'));
  // has-list
  var pg = $('.br-page') || $('form');
  if (pg && wo.name !== 'reports') {
    if ($('.br-list').classList.contains('hidden')) {
      pg.classList.remove('has-list');
    } else {
      pg.classList.add('has-list');
    }
  }

  var par = { cmd: 'POST', db: br.app, coll: wo.name };
  var data = { name: wo.value };
  if (wo.id) {
    data._id = wo.id;
  }

  switch (wo.name) {
    // menu
    case 'menu':
      par.coll = 'application';
      delete data.name;
      data.menu = cm.getValue();
      if (!wo.id) {
        data.section = wo.name;
      }
      break;

    // scripts
    case 'scripts':
      data.code = cm.getValue();
      data.updated = Date.now();
      break;

    // form and report
    case 'forms':
    case 'reports':
      if ($('.br-dialog-editor')) {
        onApplay();
      }
      var form = $('form');
      if (!form) return;
      $$('[draggable]').forEach(el => el.removeAttribute('draggable'));
      e$$(form, '.br-hidden').forEach(el => {
        el.setAttribute('hidden', '');
        el.classList.remove('br-hidden');
      });
      //$$('.dropzone').forEach(el => el.classList.remove('dropzone'))
      e$$(form, 'input,textarea').forEach(el => {
        el.removeAttribute('readonly');
        if (el.tagName === 'TEXTAREA') {
          el.textContent = '';
        } else if (!'button,radio'.includes(el.type)) {
          el.removeAttribute('value');
        }
      });
      form.name = wo.value;
      if (form.hasAttribute('data-grid')) {
        form.innerHTML = '';
      }
      data.html = form.outerHTML;
      css = $('head style.br-css');
      if (css) {
        data.css = css.innerHTML;
      }
      var events = $('script.br-events');
      if (events) data.events = events.innerHTML;
      break;

    // page
    case 'pages':
      if ($('.br-dialog-editor')) {
        onApplay();
      }
      var page = createElement($('.br-page').outerHTML);
      page.setAttribute('name', wo.value);
      var forms = e$$(page, 'form');
      forms.forEach(f => f.remove());
      css = $('head style.br-page-css');
      if (css) {
        data.css = css.innerHTML;
      }
      data.html = page.outerHTML;
      break;

    default:}


  remote(par, data).then(res => {
    if (res.err) {
      console.log(res);
    } else {
      saveBut.classList.remove(modif);
      if ('forms,pages,reports'.includes(wo.name)) {
        open(wo.name, wo.id || wo.value);
      }
    }
    if (cb) cb();
  });
};



/* 
    *  Delete
    */
var del = cb => {
  var msg = translate('Are you sure you want to delete this page/form?');
  var onOk = e => {
    if (br.wo.id) {
      var par = { cmd: 'DEL', db: br.app, coll: br.wo.name, where: { _id: br.wo.id } };
      remote(par).then(res => {
        if (res.err) {
          console.log(res);
        }
        if (cb) cb();
      });
    }
  };

  confirmModal(msg, onOk, 'is-danger');
};



/* 
    *  Borders
    */
var borders = () => {
  var cls;
  if ($('.br-page')) {
    cls = '.tile';
  } else if ($('.br-band')) {
    cls = '.br-band';
  } else {
    cls = '.container';
  }
  var elems = $$('.br-borders');
  if (elems.length > 0) {
    elems.forEach(el => el.classList.remove('br-borders'));
  } else {
    $$(cls).forEach(el => {
      if (el.id !== 'br-workspace') {
        el.classList.add('br-borders');
      }
    });
  }
};



/* 
    *  Keyboard events
    */
export var keyEvents = () => {
  var count = 0;
  var step = 1;

  document.addEventListener("keydown", e => {
    if (e.isComposing || e.keyCode === 229) return;
    if (br.dlg.firstChild && 'Delete,ArrowLeft,ArrowRight,ArrowUp,ArrowDown'.includes(e.code)) {
      return; // do nothing if Properties opened
    }
    var isReport = br.wo.name === 'reports';
    var selected = $$('.br-selected');
    if (e.repeat) {
      ++count;
      if (step === 1 && count > 20) {
        step = 5;
      }
    } else if (count) {
      count = 0;
      step = 1;
    }

    // DEL
    if (e.code === 'Delete' && e.ctrlKey) {
      e.stopPropagation();
      e.preventDefault();
      selected.forEach(el => {
        if (el.classList.contains('tile')) {
          if (!el.classList.contains('is-ancestor')) {
            var p = el.parentNode;
            p.removeChild(el);
            if (p.childElementCount === 0) {
              p.classList.remove('is-vertical');
            }
            modified(true);
          }
        } else if (el.classList.contains('container') || el.classList.contains('br-band')) {
          el.remove();
        } else {
          var _p = el.closest('.field');
          if (el.tagName === 'LABEL') {
            el.parentNode.removeChild(el);
          } else {
            el.parentNode.parentNode.removeChild(el.parentNode);
          }
          if (_p && _p.childNodes.length === 0) {
            _p.parentNode.removeChild(_p);
          }
          modified(true);
        }
      });

      // CTRL+S
    } else if (e.code === 'KeyS' && e.ctrlKey) {
      e.stopPropagation();
      e.preventDefault();
      save();

      // CTRL+B
    } else if (e.code === 'KeyB' && e.ctrlKey) {
      e.stopPropagation();
      e.preventDefault();
      borders();

      // ArrowLeft
    } else if (e.code === 'ArrowLeft') {
      if (isReport) {
        reportArrows(-step, 0);
      } else if (e.shiftKey) {
        setWidth(-1);
      }

      // ArrowRight
    } else if (e.code === 'ArrowRight') {
      if (isReport) {
        reportArrows(step, 0);
      } else if (e.shiftKey) {
        setWidth(1);
      }

      // ArrowUp
    } else if (e.code === 'ArrowUp') {
      if (isReport) {
        reportArrows(0, -step);
      }

      // ArrowDown
    } else if (e.code === 'ArrowDown') {
      if (isReport) {
        reportArrows(0, step);
      }
    }

    // setWidth
    function setWidth(inc) {
      e.stopPropagation();
      e.preventDefault();
      selected.forEach(elem => {
        // tile
        if (elem.classList.contains('tile')) {
          if (!elem.parentElement.classList.contains('is-vertical') && elem.nextSibling) {
            var w = 6;
            var old;
            elem.classList.forEach(c => {
              if (c.startsWith('is-')) {
                var n = c.substring(3);
                if (!isNaN(n)) {
                  w = parseInt(n, 10);
                  old = c;
                }
              }
            });
            if (inc > 0 && w + inc < 12 || inc < 0 && w + inc > 0) {
              if (old) {
                elem.classList.remove(old);
              }
              w += inc;
              elem.classList.add('is-' + w);
            }
          }

          // container
        } else if (elem.classList.contains('container')) {
          if (elem !== elem.parentElement.lastChild) {
            var _w = elem.offsetWidth / elem.parentElement.offsetWidth * 100;
            _w += inc;
            elem.style.width = _w + '%';
            if (!elem.style.flex) elem.style.flex = 'none';
          }
        } else {
          var parent = elem.closest('.columns');
          var el = elem.tagName === 'LABEL' || elem.classList.contains('container') ?
          elem :
          elem.parentElement;
          var _w2 = el.style.width ?
          parseInt(el.style.width.substring(-1), 10) :
          Math.round(el.offsetWidth / parent.offsetWidth * 100);
          _w2 = Math.min(Math.max(_w2 + inc, 5), 100);
          el.style.width = _w2 + '%';
        }
        modified(true);
      });
    }

    // reportArrows
    function reportArrows(hor, ver) {
      e.stopPropagation();
      e.preventDefault();
      selected.forEach(el => {
        if (hor) {
          if (e.shiftKey) {
            el.style.width = Math.max((parseInt(el.style.width.substring(-1), 10) || 50) + hor, 5) + 'px';
          } else {
            el.style.left = Math.max(parseInt(el.style.left.substring(-1), 10) + hor, 0) + 'px';
          }
        }
        if (ver) {
          if (e.shiftKey) {
            el.style.height = Math.max((parseInt(el.style.height.substring(-1), 10) || 17) + ver, 5) + 'px';
          } else {
            el.style.top = Math.max(parseInt(el.style.top.substring(-1), 10) + ver, 0) + 'px';
          }
        }
        modified(true);
      });
    }

  });
};