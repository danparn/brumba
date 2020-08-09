function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};} /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * Brumba
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * Copyright (c) 2012-2020 Dan Parnete
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * This source code is licensed under the MIT license.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   */


import { render } from "../web_modules/inferno.js";
import { toJSON, objEmpty } from "./common.js";
import { $, $$, e$, e$$, br, remote, modified, unselect, createElement, createStyle, inputDate } from "./util.js";
import { closeDialog } from "./components.js";
import { formInit, formList, formUpdate } from "./form.js";
import { formsInit, addForm, findForm, getDetails } from "./forms.js";
import { gridRender } from "./grid.js";




/* 
                                         *  Page open
                                         */
export var pageOpen = pageName => {
  var ws = br.ws;
  $$('style.br-css').forEach(s => s.remove());
  $$('script.br-events').forEach(s => s.remove());
  render(null, ws);
  ws.innerHTML = '';
  formsInit();
  closeDialog();

  var [menupg, menuid, menuarg] = pageName.split(';');
  br.menupg = menupg;
  br.menuid = menuid;
  br.menuarg = menuarg;
  var [coll, name] = menupg.split('.');
  var par = {
    cmd: 'GET',
    db: br.app,
    coll: coll,
    where: { name: name } };

  remote(par).then(res => {
    if (res.err) return;
    if (!res[0]) return alert('Page not found ' + pageName);

    pageRender(res[0]);
    if ($('.br-content').firstChild.className.includes('has-list')) {
      $('.br-list').classList.remove('hidden');
    }
    var ctent = $('.br-content');
    ctent.style.width = ctent.offsetWidth + 'px';
  });
};





/* 
    *  Page render
    */
export var pageRender = (data, ide) => {
  var ws = br.ws;
  if (data) {
    ws.innerHTML = pageWrapper(data.html);
    var isPage = $('.br-page') ? true : false;
    if (data.css) {
      createStyle(data.css, isPage);
    }
    if (data.events) {
      createScript(data.events);
    }
    if (isPage) {
      pageInit(ide);
    } else {
      var form = $('form');
      if (form.hasAttribute('data-grid')) {
        gridRender(form);
      } else if (!ide) {
        formInit(form);
        formList();
      }
    }
  } else {
    ws.innerHTML = '';
  }
};




/* 
    *  Page init
    */
export var pageInit = /*#__PURE__*/function () {var _ref = _asyncToGenerator(function* (ide) {
    $$('.tab').forEach(t => tabClick(t));
    var tiles = $$('.tile');
    for (var i = 0; i < tiles.length; ++i) {
      var tile = tiles[i];
      var id = tile.getAttribute('data-form');
      if (id) {
        var par = {
          cmd: 'GET',
          db: br.app,
          coll: 'forms',
          where: { _id: id } };

        var res = yield remote(par);
        if (!res.err && res[0]) {
          var rec = res[0];
          tile.innerHTML = rec.html;
          if (rec.css) {
            createStyle(rec.css);
          }
          if (rec.events) {
            createScript(rec.events);
          }
          var form = tile.firstChild;
          if (form.hasAttribute('data-grid')) {
            gridRender(form);
          } else if (!ide) {
            formInit(form);
          }
        }
      }
    }
    formList();
  });return function pageInit(_x) {return _ref.apply(this, arguments);};}();


/* 
                                                                              *  Tab click
                                                                              */
export var tabClick = tab => {
  tab.onclick = e => {
    e.stopPropagation();
    e.preventDefault();
    unselect();
    if (tab.className.includes('is-active')) return;

    var active = $('.tabs .is-active');
    if (active) {
      active.classList.remove('is-active');
    }
    tab.classList.add('is-active');

    var name = tab.getAttribute('name');
    $$('.tab-pane').forEach(p => {
      if (p.getAttribute('name') === name) {
        p.style.display = "block";
      } else {
        p.style.display = "none";
      }
    });
  };
};




/* 
    *  Page wrapper
    */
export var pageWrapper = page => {
  var txt = '<div class="columns">\
                  <div class="br-list column is-2 hidden"></div>\
                  <div class="br-content column">' + page + '</div>\
                </div>';
  return txt.replace(/> +/g, '>');
};




/* 
    *  Toggle list
    */
export var toggleList = e => {
  var list = $('.br-list');
  if (list) {
    var hid = 'hidden';
    if (list.className.includes(hid)) {
      list.classList.remove(hid);
    } else {
      list.classList.add(hid);
    }
    if (br.wo) {
      modified(true);
    }
  }
};




/* 
    *  Create script
    */
export var createScript = (code, src, type) => {
  var script = document.createElement('script');
  script.classList.add('br-events');
  script.type = type || 'module';
  if (src) {
    script.src = src;
  } else {
    script.textContent = code;
  }
  $('head').append(script);
};



/* 
    *  Page search
    */
export var pageSearch = () => {
  var close = e => br.dlg.innerHTML = '';
  var form = findForm($('form.has-list'));

  var ok = e => {
    var where = {};
    e$$(br.dlg, '.row').forEach(r => {
      var field = e$(r, '[name=field]');
      var f = field.value;
      var t = e$(field, "option[value=\"".concat(f, "\"]")).getAttribute('type');
      var v = e$(r, '[name=value]').value;
      if (t === 'date') {
        v = inputDate(v);
      }
      var val;
      switch (e$(r, '[name=condition]').value) {
        case '=':
          if ('textarea'.includes(t)) {
            val = { '$regex': v, '$options': 'i' };
          } else {
            val = v;
          }
          break;
        case '>':
          val = { $gt: v };
          break;
        case '<':
          val = { $lt: v };
          break;
        case '>=':
          val = { $gte: v };
          break;
        case '<=':
          val = { $lte: v };
          break;
        default:}

      if (e$(r, '[name=logic]').value === 'OR' && !where.$or) {
        where = objEmpty(where) ? { $or: [] } : { $or: [where] };
      }
      if (Array.isArray(where.$or)) {
        var n = {};
        n[f] = val;
        where.$or.push(n);
      } else {
        where[f] = val;
      }
    });
    form.search = where;
    formUpdate(form, []);
    formList();
  };

  if (form) {
    render(null, br.dlg);
    br.dlg.innerHTML = "\n\t\t\t<div class=\"modal is-active\">\n\t\t\t\t<div class=\"modal-background\"></div>\n\t\t\t\t<div class=\"modal-card\">\n\t\t\t\t\t<header class=\"modal-card-head\">\n\t\t\t\t\t\t<p class=\"modal-card-title\">Search</p>\n\t\t\t\t\t\t<button class=\"delete\" aria-label=\"close\"></button>\n\t\t\t\t\t</header>\n\t\t\t\t\t<section class=\"modal-card-body\">\n\t\t\t\t\t</section>\n\t\t\t\t\t<footer class=\"modal-card-foot\">\n\t\t\t\t\t\t<button class=\"button mod-ok\">Ok</button>\n\t\t\t\t\t\t<button class=\"button mod-close\">Cancel</button>\n\t\t\t\t\t</footer>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t";
















    e$(br.dlg, '.mod-ok').addEventListener('click', e => {ok();close();});
    e$(br.dlg, '.mod-close').addEventListener('click', close);
    e$(br.dlg, '.delete').addEventListener('click', close);
    e$(br.dlg, 'section').append(addRow());

    function addRow() {
      var row = createElement("\n\t\t\t\t<div class=\"row columns\">\n\t\t\t\t\t<div class=\"select\">\n\t\t\t\t\t\t<select name=\"field\"></select>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"select width-unset\">\n\t\t\t\t\t\t<select name=\"condition\"></select>\n\t\t\t\t\t</div>\n\t\t\t\t\t<input class=\"input\" name=\"value\" />\n\t\t\t\t\t<div class=\"select width-unset\">\n\t\t\t\t\t\t<select name=\"logic\">\n\t\t\t\t\t\t\t<option value=\"\"></option>\n\t\t\t\t\t\t\t<option value=\"AND\">AND</option>\n\t\t\t\t\t\t\t<option value=\"OR\">OR</option>\n\t\t\t\t\t\t</select>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t");


















      // colect fields
      var fields = e$(row, '[name=field]');
      var colectFields = (frm, pref) => {
        (frm.columns || frm.fields).forEach(f => {
          var name = pref ? pref + '.' + f.name : f.name;
          fields.append(createElement("<option type=\"".concat(f.type, "\" value=\"").concat(name, "\">").concat(name, "</option>")));
        });
        getDetails(frm).forEach(fr => {
          if (fr.query.field) {
            colectFields(fr, fr.query.field.substring(fr.query.field.indexOf('.') + 1));
          } else if (!fr.query.concat) {
            colectFields(fr);
          }
        });
      };
      colectFields(form);

      var cond = e$(row, '[name=condition]');
      '=,>,<,>=,<='.split(',').forEach(c => {
        cond.append(createElement("<option value=\"".concat(c, "\">").concat(c, "</option>")));
      });

      e$(row, '[name=logic]').addEventListener('change', e => {
        var r = e.target.closest('.row');
        if (e.target.value === '') {
          if (r.nextElementSibling) {
            r.nextElementSibling.remove();
          }
        } else {
          if (!r.nextElementSibling) {
            e$(br.dlg, 'section').append(addRow());
          }
        }
      });

      return row;
    }
  }
};