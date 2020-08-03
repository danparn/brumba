import { createComponentVNode } from "../web_modules/inferno.js"; /*
                                                                   * Brumba
                                                                   * Copyright (c) 2012-2020 Dan Parnete
                                                                   *
                                                                   * This source code is licensed under the MIT license.
                                                                  */

import { render } from "../web_modules/inferno.js";
import { strSplit, strCap, toJSON, objClone, translate, decimals, objEmpty, timezone } from "./common.js";
import { $, e$, e$$, br, remote, createElement, modified, substArgs } from "./util.js";
import { Dialog, posDialog, closeDialog, confirmModal, autocomplete, autocompleteText,
notification, inputImageLoad, inputFile } from "./components.js";
import { addForm, findForm, listForm, getDetails, refreshForms } from "./forms.js";
import { Grid, gridRefresh } from "./grid.js";
import sha256 from "../web_modules/sha256.js";





/* 
                                                *  Form init
                                                */
export var formInit = formE => {
  var form = addForm(formE);

  // input types
  e$$(formE, '.br-date').forEach(el => el.setAttribute('type', 'date'));
  e$$(formE, '.br-datetime-local').forEach(el => el.setAttribute('type', 'datetime-local'));
  e$$(formE, '[type=radio]').forEach(el => el.value = el.nextSibling.textContent);
  e$$(formE, '.br-autocomplete').forEach(el => autocomplete(el, form));
  e$$(formE, '[type=image]').forEach(el => inputFile(el, true));
  e$$(formE, '.br-file').forEach(el => inputFile(el));
  e$$(formE, '.br-password').forEach(el => el.setAttribute('type', 'password'));
  e$$(formE, '.br-email').forEach(el => el.setAttribute('type', 'email'));

  // fields
  var classType = el => {
    if (el.className.includes('br-number')) return 'number';else
    if (el.className.includes('br-email')) return 'email';
  };
  form.fields = [];
  e$$(formE, 'input,select,textarea').forEach(el => {
    if (el.classList.contains('br-disabled')) el.setAttribute('disabled', 'true');
    if (el.classList.contains('br-readonly')) el.setAttribute('readonly', 'true');
    var name = el.getAttribute('name');
    if (!form.fields.find(f => f.name === name)) {
      form.fields.push({
        name: name,
        type: el.getAttribute('type') || classType(el) || (
        el.tagName === 'INPUT' ? 'text' : el.tagName.toLowerCase()) });

    }

    // onchange
    el.addEventListener('change', e => {
      var type = el.getAttribute('type');
      if (type !== 'autocomplete') {
        var val = el.value;
        switch (type) {
          case 'checkbox':
            if (el.checked) val = true;else
            val = '';
            break;
          case 'datetime-local':
            val = Date.parse(val);
            break;
          default:}

        if (val === '') {
          val = null;
        }
        var fld = form.fields.find(f => f.name === el.getAttribute('name'));
        fld.newval = val;
        if (!formE.classList.contains('br-readonly') && !form.searchMode) {
          form.modified = true;
          modified(true);
        }
      }
    });

    if (el.tagName === 'SELECT') {
      select(el, form);
    }
  });
};




/* 
    *  Form retrieve
    */
export var formRetrieve = (form, id) => {
  remote({ db: br.db, coll: form.query.coll, where: { _id: id } }).then(res => {
    if (res.err) return;
    if (res[0]) {
      form.data = res[0];
      formUpdate(form, form.data);
    }
  });
};




/* 
    *  Form update
    */
export var formUpdate = (formE, data) => {
  if (!formE || !data) return console.log('formUpdate no args');
  if (!formE.tagName) {
    formE = $("form[name=".concat(formE.name, "]"));
  }
  var form = findForm(formE);
  if (form) {
    form.data = data;
    form.fields.forEach(f => delete f.newval);
    updateDetails(form);
  }

  e$$(formE, 'input,select,textarea').forEach(el => {
    var type = el.classList.contains('br-autocomplete') ?
    'autocomplete' :
    el.getAttribute('type') || el.tagName.toLowerCase();
    var val = data[el.name];
    //console.log(`name=${el.name}  type=${type}  val=${val}`)
    if (val) {
      switch (type) {
        case 'number':
          var dec = el.getAttribute('data-decimals');
          if (dec) {
            el.value = decimals(val, parseInt(dec, 10));
          } else {
            el.value = val;
          }
          break;
        case 'datetime-local':
          el.value = new Date(val + timezone()).toJSON().substring(0, 16);
          break;
        case 'checkbox':
          el.checked = val;
          break;
        case 'radio':
          el.checked = el.value === val;
          break;
        case 'autocomplete':
          autocompleteText(el, form);
          break;
        case 'image':
          el.classList.remove('input');
          inputImageLoad(el, val);
        default:
          el.value = val;}

    } else if (['checkbox', 'radio'].includes(type)) {
      el.checked = false;
    } else {
      el.value = '';
      if (type === 'image') {
        el.removeAttribute('src');
        el.classList.add('input');
      }
    }
  });
};




/* 
    *  Update details
    */
export var updateDetails = form => {
  getDetails(form).forEach(d => {
    if (d.query) {
      //console.log(`updateDetails: ${d.name}`)
      // field
      if (d.query.field && d.externRefresh) {
        var fld = strSplit(d.query.field, '.').pop();
        d.externRefresh((form.data ? form.data[fld] : null) || []);

        // concat
      } else if (d.query.concat && d.externRefresh) {(function () {
          var mdata = [];
          var flds = strSplit(d.query.concat, '.');
          var m = d.master;
          for (var i = flds.length - 1; i >= 0; --i) {
            if (m) {
              if (!m.columns && m.data && m.data[flds[i]]) {
                mdata = m.data[flds[i]];
                break;
              }
              m = m.master;
            }
          }
          var data = [];
          var fld = flds[flds.length - 1];var _loop = function _loop(
          len, _i) {
            var fldata = mdata[_i][fld];
            if (fldata) {
              // add
              if (d.query.add) {
                var adds = strSplit(d.query.add, ',');var _loop2 = function _loop2(
                j) {
                  adds.forEach(a => {
                    if (mdata[_i][a]) {
                      fldata[j][a] = mdata[_i][a];
                    }
                  });};for (var j = 0; j < fldata.length; ++j) {_loop2(j);
                }
              }
              data = data.concat(fldata);
            }};for (var _i = 0, len = mdata.length; _i < len; ++_i) {_loop(len, _i);
          }
          d.externRefresh(data);

          // {}
        })();} else if (objEmpty(d.query)) {
        formUpdate(d, form.data);
      }

      updateDetails(d);
    }
  });
};



/* 
    *  Form colect data
    */
export var formColect = form => {
  var rec = {};
  form.fields.forEach(f => {
    if ('newval' in f) {
      if (f.type === 'password') {
        rec[f.name] = sha256(f.newval);
      } else {
        rec[f.name] = f.newval;
      }
    }
  });
  return rec;
};



/* 
    *  Form save
    */
export var formSave = formE => {
  var form = findForm(formE);
  if (form && form.modified && form.query) {
    var rec = formColect(form);
    if (!objEmpty(rec)) {
      var coll;
      var master;
      var hasId = false;
      // _id
      if (form.data && form.data._id) {
        rec._id = form.data._id;
        hasId = true;
        // user and type
      } else if (form.query.coll) {
        rec._user = br.user;
        if (br.menuid) {
          rec.type = br.menuid;
        }
      }

      // query.field
      if (form.query.field) {
        var f = form;
        var r = rec;
        while (f.master) {
          //console.log('master: '+f.master.name)
          if (!f.master.data || !f.master.data._id) {
            notification('Master record not found');
            return;
          }
          var fld = strSplit(f.query.field, '.').pop();
          var m = { _id: f.master.data._id };
          //console.log(m)
          m[fld] = [r];
          //console.log(m)
          r = m;
          f = f.master;
        }
        master = f;
        coll = f.query.coll;
        rec = r;
      }

      var par = { cmd: 'POST', coll: coll || form.query.coll };
      //console.log(par)
      //console.log(rec)
      //return
      remote(par, rec).then(res => {
        if (res.err) return;
        modified(false);
        if (formE.hasAttribute('data-list')) {
          formList();
        }
        refreshForms();
        if (formE.classList.contains('br-grid-form')) {
          render(null, br.dlg);
        }
      });
    }
  }
};




/* 
    *  Form search
    */
export var formSearch = () => {
  var formE = $('form.has-list');
  var form = findForm(formE);
  if (!form) return;

  if (form.searchMode) {
    form.searchMode = false;
    formE.classList.remove('br-search');
    form.search = formColect(form);
    formUpdate(form, []);
    formList();

  } else {
    form.searchMode = true;
    form.search = null;
    formE.classList.add('br-search');
    formUpdate(form, []);
  }
};



/* 
    *  Form delete
    */
export var formDelete = () => {
  var form = listForm();
  if (form && form.data && form.data._id) {
    deleteRecord({ coll: form.query.coll, where: { _id: form.data._id } }, res => {
      formList();
      formUpdate(form, {});
      modified(false);
    });
  }
};

/* 
    *  Delete record
    */
export var deleteRecord = (par, cb) => {
  var msg = translate('Are you sure you want to delete the selected record?');
  var onOk = e => {
    Object.assign(par, { cmd: 'DEL' });
    remote(par).then(res => {
      if (res.err) return;
      if (cb) cb(res);
    });
  };

  confirmModal(msg, onOk, 'is-danger');
};





/* 
    *  Form list
    */
export var formList = () => {
  var form = listForm();
  if (form) {
    var formE = $("form[name=".concat(form.name, "]"));
    var query = objClone(form.query);
    query.result = 'count';
    if (form.search) {
      query.where = query.where ?
      Object.assign(query.where, form.search) :
      form.search;
    }
    remote(query).then(res => {
      if (res.err) return;

      var flds = strSplit(form.list, ',');
      if (flds && flds.length) {
        var grid = {
          query: query,
          rows: 20,
          fixed: 0,
          columns: [],
          readonly: true };

        flds.forEach(f => {
          var [fname, head] = strSplit(f, ':');
          var [name, as] = strSplit(fname, ' as ');
          var col = {
            name: name,
            header: head || strCap(as || name).replace(/_/g, ' ') };

          if (as) col.as = as;
          var fld = e$(formE, "[name=".concat(as || name, "]"));
          if (fld) {
            if (fld.tagName === 'SELECT' || fld.classList.contains('br-autocomplete')) {
              if (fld.tagName === 'SELECT') {
                col.type = 'select';
              } else {
                col.type = 'autocomplete';
              }
              col.query = fld.getAttribute('data-query');
              col.list = fld.getAttribute('data-list');
            } else if (fld.type) {
              col.type = fld.type;
            }
          }
          grid.columns.push(col);
        });

        var rowClick = selected => {
          selected.forEach(row => {
            if (row.id) {
              formRetrieve(form, row.id);
            } else {
              formUpdate(form, {});
            }
          });
          modified(false);
        };

        var list = $('.br-list');
        render(null, list);
        render(createComponentVNode(2, Grid, { "grid":
          grid, "rowClick": rowClick }),
        list);

      }
    });
  }
};















/* 
    *  Select
    */
var select = (elem, form) => {
  var query = elem.getAttribute('data-query');
  if (query) {
    var q = toJSON(query);
    if (!q) return;

    if (Array.isArray(q)) {// array of {_id:..., _txt:...}
      selectFromArrayQuery(elem, q);
    } else {
      if (elem.classList.contains('br-query-args') && !substArgs(q.where, elem)) return;
      var fld = form.fields.find(f => f.name === elem.name);

      if (q.coll) {
        remote(q).then(res => {
          if (res.err) return;
          fld.data = res;
          selectPopulate(elem, res);
        });

      } else if (q.script) {// already formated from server script 
        remote(q).
        then(res => {
          if (res.err) return;
          if (res.html) {
            elem.append(res.html);
          } else {
            fld.data = res;
            selectPopulate(elem, res);
          }
        }).
        catch(console.error);
      }
    }
  }
};


export var selectPopulate = (elem, data) => {
  var fields = elem.getAttribute('data-list');
  var fld = strSplit(fields, ',');
  var q = toJSON(elem.getAttribute('data-query'));
  var txt = '';
  if (!fields || !q) return;

  elem.innerHTML = '';
  elem.append(createElement('<option></option>'));var _loop3 = function _loop3(
  i, len) {
    var r = data[i];
    txt = '';
    for (var j = 1; j < fld.length; ++j) {
      var fl = fld[j],
      sep = '';
      if (j > 1) {
        if (fld[j].charAt(0) === '+') {
          fl = fld[j].substr(1);
          sep = ' ';
        } else {
          sep = ' - ';
        }
      }
      if (r[fl]) {
        txt += sep;
        txt += r[fl];
      }
    }
    var val = r[fld[0]];
    var typ = typeof val == 'number' ? 'type="number" ' : '';
    var opt = createElement('<option ' + typ + 'value="' + val + '">' + txt + '</option>');
    if (q.group || q.groupsel) {
      if (data.find(d => d[fld[0]].indexOf(val + '.') === 0)) {
        opt.classList.add('br-optgroup');
        if (!q.groupsel) {
          opt.setAttribute('disabled', '');
        }
      }
    }
    elem.append(opt);};for (var i = 0, len = data.length; i < len; ++i) {_loop3(i, len);
  }
};


export var selectText = (rec, flds) => {
  var val = '';
  if (rec && flds && Array.isArray(flds)) {
    for (var j = 1; j < flds.length; ++j) {
      var f = flds[j];
      if (j > 1) {
        if (f.charAt(0) === '+') {
          val += ' ';
          f = f.substring(1);
        } else {
          val += ' - ';
        }
      }
      val += rec[f] || '';
    }
  }
  return val;
};


export var selectFromArrayQuery = (elem, data) => {
  if (elem && data) {
    elem.innerHTML = '';
    elem.append(createElement('<option value=""></option>'));
    for (var i = 0, len = data.length; i < len; i++) {
      var s = data[i]._txt || data[i]._id + '';
      s = translate(s, br.lang);
      elem.append(createElement("<option value=\"".concat(data[i]._id, "\">").concat(s, "</option>")));
    }
  }
};