import { createVNode, createComponentVNode, normalizeProps } from "../web_modules/inferno.js";function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {var symbols = Object.getOwnPropertySymbols(object);if (enumerableOnly) symbols = symbols.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});keys.push.apply(keys, symbols);}return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i] != null ? arguments[i] : {};if (i % 2) {ownKeys(Object(source), true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));} else {ownKeys(Object(source)).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};} /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             * Brumba
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             * Copyright (c) 2012-2020 Dan Parnete
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             * This source code is licensed under the MIT license.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            */

import { render, Component, createRef } from "../web_modules/inferno.js";
import { strSplit, objClone, toJSON, decimals, translate } from "./common.js";
import { $, e$, e$$, br, remote, createElement, childIndex } from "./util.js";
import { formInit, formUpdate, updateDetails, selectPopulate, selectFromArrayQuery, selectText, deleteRecord } from "./form.js";
import { findForm, addGrid, refreshForms, mainArgs } from "./forms.js";
import { FieldColumn } from "./inferno-bulma.js";
import { Dialog, posDialog, renderToString, listArgs, openFile } from "./components.js";


export var gridRefresh; // for extern call from formSave

/* 
 *  Grid
 */
export class Grid extends Component {
  constructor(props) {
    super(props);
    this.element = createRef();
    this.grid = props.grid;
    this.rows = props.grid.rows || 10;
    this.rowHeight = 0;
    this.rec0 = 0;
    this.count = 0;
    this.limit = 100;
    this.selected = [];
    this.scroll = null;
    this.dummy = props.grid.dummy || false; // not real data
    this.fixed = props.grid.fixed || 0;
    this.cellClick = (props.cellClick || this.cellClick).bind(this);
    this.cellDblClick = this.cellDblClick.bind(this);
    this.butClick = this.butClick.bind(this);
    this.radioClick = props.radioClick;
    this.butDel = null;
    this.delVisible = false;
    this.externRefresh = this.externRefresh.bind(this);
    this.grid.externRefresh = this.externRefresh;
    this.rowClick = props.rowClick;
    this.onMousewheel = this.onMousewheel.bind(this);
    this.state = { data: props.data || [] };

    if (this.state.data.length > 0) {
      this.count = this.state.data.length;
      this.dummy = false;
    } else {
      this.fillDummy();
    }
  }

  // componentDidMount
  componentDidMount() {var _this = this;return _asyncToGenerator(function* () {
      var fh = e$(_this.element.current, '.fixed th');
      if (fh) {
        var th = e$(_this.element.current, '.table-container thead');
        fh.style.height = th.offsetHeight + 'px';
      }
      _this.butDel = e$(_this.element.current, 'button.br-delete');
      _this.scroll = e$(_this.element.current, '.br-scroll');
      _this.scrollSet();

      // retrieve
      if (_this.grid.query) {
        if (!_this.grid.readonly) {
          e$(_this.element.current, 'button.br-edit').style.display = 'block';
        }
        yield _this.retrieve();
      } else {
        yield _this.selectData();
        _this.setState({ data: _this.state.data });
      }

      // mouseup for scroll end
      _this.scroll.addEventListener('mouseup', e => {
        if (_this.scrollMode === 2) {
          _this.scrollMode = 1;
          _this.onScroll(e);
        }
      });})();
  }

  // fillDummy
  fillDummy() {
    var r = {};
    for (var i = 0; i < this.grid.columns.length; ++i) {
      r[this.grid.columns[i].name] = '\u200C';
    }
    var data = [];
    for (var _i = 0; _i < this.rows; ++_i) {
      data.push(r);
    }
    this.state = { data: data };
    this.count = this.rows;
    this.dummy = true;
  }

  // scrollSet
  scrollSet() {
    if (!this.rowHeight) {
      this.rowHeight = this.scroll.scrollHeight / this.rows;
      this.scroll.style.height = this.scroll.scrollHeight + 'px';
    }
    this.scroll.firstChild.style.height = Math.round(this.rowHeight * this.count) + 'px';
  }

  // onScroll
  onScroll(e) {
    e.stopPropagation();
    e.preventDefault();
    this.unselect();
    this.rec0 = Math.round(e.target.scrollTop / this.rowHeight);
    if (this.scrollMode === 1) {
      this.refresh();
      this.scrollMode = 0;
    } else {
      this.scrollMode = 2; // moving
    }
  }

  // mouseWheel
  onMousewheel(e) {
    e.stopPropagation();
    e.preventDefault();
    this.scrollMode = 1;
    if (this.scroll) {
      this.scroll.scrollTop -= e.wheelDelta / 2;
    }
  }

  // externRefresh
  externRefresh(data) {var _this2 = this;return _asyncToGenerator(function* () {
      _this2.unselect();
      if (data) {
        _this2.dummy = false;
        yield _this2.selectData();
        yield _this2.autocompleteData(data);
        _this2.setState({ data: data });
      } else {
        _this2.retrieve();
      }})();
  }

  // refresh
  refresh() {
    //console.log('refresh')
    this.unselect();
    for (var i = 0, j = this.rec0; i < this.rows && j < this.count; ++i, ++j) {
      if (!this.state.data[j]) {
        var b = j,bmax = j + this.limit;
        do {++b;} while (!this.state.data[b] && b < bmax);
        if (b < bmax) {
          var jmin = Math.max(b - this.limit, -1);
          do {--j;} while (!this.state.data[j] && j > jmin);
        }
        this.retrieve(j);
        return;
      }
    }
    this.setState({ data: this.state.data });
  }

  // retrieve
  retrieve(from) {var _this3 = this;return _asyncToGenerator(function* () {
      if (_this3.inRetrieve) return;
      if (!_this3.grid.query.coll) return;
      _this3.inRetrieve = true;
      var query = objClone(_this3.grid.query);
      var res;
      var data;

      // count
      if (!from) {
        query.result = 'count';
        res = yield remote(query);
        if (res.err) return;
        _this3.count = res.count;
        data = [];
        _this3.scrollSet();
        delete query.result;
        if (_this3.count === 0) {
          _this3.fillDummy();
          return;
        }
      }

      // retrieve data
      query.limit = _this3.limit;
      if (from) {
        query.skip = from;
      }
      from = from || 0;
      res = yield remote(query);
      if (res.err) return;
      //console.log(`retrieve ${res.length} from ${from}`)
      yield _this3.selectData();
      yield _this3.autocompleteData(res); // autocomplete data
      data = data || _this3.state.data;var _loop = function _loop(
      i) {
        var rec = res[i];
        _this3.grid.columns.forEach(c => {
          var name = c.as || c.name;
          var val;
          if (c.name.includes('+')) {
            var multi = strSplit(c.name, '+');
            val = '';
            multi.forEach(f => {
              if (val.length > 0) val += ' ';
              val += rec[f] || '';
            });
          } else if (rec[name]) {
            val = rec[name];
          }
          if (val) {
            rec[name] = val;
          }
        });
        data[from + i] = rec;};for (var i = 0; i < res.length; ++i) {_loop(i);
      }

      _this3.dummy = false;
      _this3.unselect();
      _this3.setState({ data: data });
      _this3.inRetrieve = false;})();
  }

  // select data
  selectData() {var _this4 = this;return _asyncToGenerator(function* () {
      for (var n = 0; n < _this4.grid.columns.length; ++n) {
        var c = _this4.grid.columns[n];
        //this.grid.columns.forEach(async c => {
        if (c.type === 'select' && c.query) {
          var q = toJSON(c.query);
          if (Array.isArray(q)) {
            c.data = q;
          } else {
            var res = yield remote(q).catch(alert);
            c.data = res;
            if (c.list) {
              var flds = strSplit(c.list, ',');
              for (var i = 0, len = c.data.length; i < len; ++i) {
                var _r = c.data[i];
                _r._txt = selectText(_r, flds);
                if (flds[0] !== '_id') {
                  _r._id = _r[flds[0]];
                }
              }
            }
          }
        }
      }})();
  }

  // autocomplete data
  autocompleteData(data) {var _this5 = this;return _asyncToGenerator(function* () {
      var auto = _this5.grid.columns.filter(c => c.type === 'autocomplete');var _loop2 = function* _loop2(
      i) {
        var c = auto[i];
        // ids
        var ids = [];
        var list = strSplit(c.list, ',');var _loop3 = function _loop3(
        len, _i2) {
          var val = data[_i2][c.name];
          if (val) {
            var exists = c.data ? c.data.findIndex(r => r._id === val) > -1 : false;
            if (!exists && !ids.includes(val)) {
              ids.push(val);
            }
          }};for (var _i2 = 0, len = data.length; _i2 < len; ++_i2) {_loop3(len, _i2);
        }
        // column data
        if (ids.length && c.query) {
          var q = toJSON(c.query);
          var cond = { _id: { $in: ids } };
          q.where = q.where ? Object.assign(q.where, cond) : cond;
          var res = yield remote(q);
          if (res.err) return { v: void 0 };
          res.forEach(r => r._txt = listArgs(list, r));
          if (c.data) {
            c.data = c.data.concat(res);
          } else {
            c.data = res;
          }
        }};for (var i = 0; i < auto.length; ++i) {var _ret = yield* _loop2(i);if (typeof _ret === "object") return _ret.v;
      }})();
  }

  // unselect
  unselect() {
    delete this.grid.data;
    this.selected.forEach(r => r.classList.remove('is-selected'));
    this.selected.length = 0;
    if (this.delVisible) {
      this.butDel.style.display = 'none';
      this.delVisible = false;
      if (this.grid.data) delete this.grid.data;
    }
  }

  // cellClick
  cellClick(e) {
    this.unselect();
    var id;
    var rname = e.target.parentElement.getAttribute('name');
    e$$(this.element.current, "tr[name=".concat(rname, "]")).forEach(r => {
      r.classList.add('is-selected');
      this.selected.push(r);
      if (r.id) id = r.id;
    });
    this.grid.data = this.state.data.find(r => r._id === id);
    if (!this.grid.readonly) {
      if (id && !this.delVisible) {
        this.butDel.style.display = 'block';
        this.delVisible = true;
      }
      var gform = $('.br-grid-form');
      if (gform) {
        formUpdate(gform, this.grid.data || {});
      }
    }
    updateDetails(this.grid);
    if (this.rowClick) {
      this.rowClick(this.selected);
    }
    r.dispatchEvent(new Event('rowselected'));
  }

  // cellDblClick
  cellDblClick(e) {
    var i = childIndex(e.target);
    if (this.grid.columns[i].type === 'file') {
      openFile(e.target.textContent);
    } else if (this.grid.columns[i].type === 'image') {
      openFile(null, e.target.id);
    }
  }

  // butClick
  butClick(e) {
    e.preventDefault();
    var but = e.target.closest('button');
    var id = this.selected[0] ? this.selected[this.selected.length - 1].id : null;
    gridRefresh = this.externRefresh;
    // delete
    if (but.classList.contains('br-delete')) {
      var par = { where: { _id: id } };
      if (this.grid.query.coll) {
        par.coll = this.grid.query.coll;
      } else if (this.grid.query.field) {
        var p = this.grid.query.field.indexOf('.');
        par.coll = this.grid.query.field.substring(0, p);
        par.field = this.grid.query.field.substring(p + 1);
      }
      deleteRecord(par, res => {
        if (!res.err) {
          refreshForms();
        }
      });

      // edit
    } else {
      var rec = id ? this.state.data.find(r => r._id === id) : {};
      gridForm(this.grid, rec);
    }
  }

  // render
  render() {var _this6 = this;
    // header
    var ths = [];
    var thf = [];
    for (var i = 0; i < this.grid.columns.length; ++i) {
      if (i < this.fixed) {
        thf.push(createVNode(1, "th", null, this.grid.columns[i].header, 0));
      } else {
        ths.push(createVNode(1, "th", null, this.grid.columns[i].header, 0));
      }
    }
    // body
    var trs = [];
    var trf = [];var _loop4 = function _loop4(
    j) {
      var rec = _this6.state.data[_this6.rec0 + j];
      if (!rec) rec = {};
      if (rec) {
        var tds = [];
        var tdf = [];var _loop5 = function _loop5(
        _i4) {
          var col = _this6.grid.columns[_i4];
          var name = col.as || col.name;
          var id = void 0;
          var val = rec[name];
          //console.log(`col=${col.name}  type=${col.type}  val=${val}  dummy=${this.dummy}`)
          if (!_this6.dummy && !_this6.grid.dummy && val !== undefined && !_this6.grid.ide) {
            switch (col.type) {
              case 'number':
                if (col.decimals) {
                  var dec = parseInt(col.decimals, 10);
                  var sp = (val + '').split('.');
                  if (dec === 0) {
                    val = sp[0];
                  } else {
                    val = sp[0] + '.' + (sp[1] ? sp[1].substring(0, dec).padEnd(dec, '0') : '00');
                  }
                }
                break;
              case 'date':
                val = new Date(val).toLocaleString().substring(0, 10);
                break;
              case 'checkbox':
                val = val ? 'x' : val; // 
                break;
              case 'datetime-local':
                val = new Date(val).toLocaleString();
                val = val.substring(0, val.length - 3).replace(',', '');
                break;
              case 'select':
              case 'autocomplete':
                if (col.data) {
                  var rc = col.data.find(r => r._id === val);
                  if (rc) {
                    val = rc._txt;
                  }
                }
                break;
              case 'password':
                val = val.length ? '**' : null;
                break;
              case 'image':
                id = val.length ? val : null;
                val = val.length ? '�' : null;
                break;
              case 'color':
                val = createVNode(64, "input", "input", null, 1, { "type": "color", "value": val, "disabled": true });
                break;
              case 'radio':
                val = createVNode(64, "input", null, null, 1, { "type": "radio", "value": val, "onClick": _this6.radioClick });
                break;
              default:}

          }
          var cls = col.align ? "align-".concat(col.align) : '';
          cls += col.type === 'textarea' ? ' text' : '';
          cls = cls.trim();
          if (cls.length === 0) cls = null;
          var td = createVNode(1, "td", cls, val || '\u200C', 0, { "id": id });
          if (_i4 < _this6.fixed) {
            tdf.push(td);
          } else {
            tds.push(td);
          }};for (var _i4 = 0; _i4 < _this6.grid.columns.length; ++_i4) {_loop5(_i4);
        }
        var Tr = props => {
          return createVNode(1, "tr", null, props.children, 0, { "id": props.id || null, "name": 'row' + j, "onClick": _this6.cellClick, "onDblClick": _this6.cellDblClick });
        };
        trf.push(createComponentVNode(2, Tr, { children: tdf }));
        trs.push(createComponentVNode(2, Tr, { "id": rec._id, children: tds }));
      }};for (var j = 0; j < this.rows; ++j) {_loop4(j);
    }
    // footer
    var tfs = [];
    var tff = [];
    if (this.grid.footer) {
      for (var _i3 = 0; _i3 < this.grid.columns.length; ++_i3) {
        var td = createVNode(1, "td", null, this.grid.footer[this.grid.columns[_i3].name] || '', 0);
        if (_i3 < this.fixed) {
          tff.push(td);
        } else {
          tfs.push(td);
        }
      }
    }

    var cls = "table is-bordered is-striped is-narrow is-hoverable";
    var mainTable = createVNode(1, "div",
    "table-container", createVNode(1, "table",
    cls, [createVNode(1, "thead", null,

    ths, 0), createVNode(1, "tbody", null,


    trs, 0), createVNode(1, "tfoot", null,


    tfs, 0)], 4, { "onMousewheel": this.onMousewheel }), 2);



    var fixedTable = createVNode(1, "table",
    cls + ' fixed', [createVNode(1, "thead", null,

    thf, 0), createVNode(1, "tbody", null,


    trf, 0), createVNode(1, "tfoot", null,


    tff, 0)], 4);



    var bcls = ' button is-primary is-small is-outlined';

    return createVNode(1, "div",
    "br-grid columns", [createVNode(1, "div",
    "column", [createVNode(1, "button",
    'br-edit' + bcls, createVNode(1, "i",
    "fa fa-edit"), 2, { "onClick": this.butClick }), createVNode(1, "button",

    'br-delete' + bcls, createVNode(1, "i",
    "fa fa-trash"), 2, { "onClick": this.butClick })], 4), createVNode(1, "div",


    "grid-width columns", [
    this.fixed ? fixedTable : null,
    mainTable], 0, { "style": "width: 95%;" }), createVNode(1, "div",

    "br-scroll", createVNode(1, "div",
    "br-scroll-content"), 2, { "onScroll": this.onScroll.bind(this) })], 4, null, null, this.element);



  }}




/**
      * Grid render
      * @function
      * @param {object|string} formE - form element with data-grid attribut
      * @param {json} data - grid data
      * @param {object} args - arguments
      * @returns {object} grid object
      */
export var gridRender = (formE, data, args) => {
  if (formE) {
    var query = mainArgs(formE.getAttribute('data-query'));
    var gridStruct = formE.getAttribute('data-grid');
    if (gridStruct) {
      var grid = JSON.parse(gridStruct);
      grid.name = formE.getAttribute('name');
      grid.dummy = false;
      if (query) {
        grid.query = toJSON(query);
      }
      addGrid(grid);
      render(null, formE);
      render(normalizeProps(createComponentVNode(2, Grid, _objectSpread({ "grid":
        grid, "data": data }, args))),
      formE);

      return grid;
    }
  }
};




/* 
    *  Grid form
    */
var gridForm = /*#__PURE__*/function () {var _ref = _asyncToGenerator(function* (grid, data) {
    var formE;
    // edit form
    if (grid.form) {
      var par = { db: br.app, coll: 'forms', where: { name: grid.form } };
      var res = yield remote(par);
      if (res.err) return;

      render(null, br.dlg);
      render(createComponentVNode(2, Dialog, { "class":
        "br-dialog-form" }),

      br.dlg);


      e$(br.dlg, '.message-body').innerHTML = res[0].html;
      formE = e$(br.dlg, 'form');
      formE.className = 'br-grid-form';
      formE.setAttribute('name', 'grid-form');
      formE.setAttribute('data-for', grid.name);
      e$$(br.dlg, '.container').forEach(el => {
        if (!el.firstChild) {
          el.style.display = 'none';
        }
      });
      e$$(formE, '.is-7').forEach(el => el.classList.remove('is-7'));
      e$$(formE, 'textarea').forEach(el => el.parentElement.classList.add('text'));


      // dynamic form
    } else {
      var fields = [];
      grid.columns.forEach(f => {
        var ctrlClass = f.type === 'textarea' ? { class: 'text' } : null;
        var inputClass = 'is-small';
        var type = f.type;
        if (type === 'autocomplete') {
          type = null;
          inputClass += ' br-autocomplete';
        }
        fields.push(createComponentVNode(2, FieldColumn, { "labelAttr":
          { class: 'is-one-quarter is-small' }, "controlAttr":
          ctrlClass, "inputAttr":
          { type: type, name: f.name, class: inputClass }, children:
          f.header }));


      });

      render(null, br.dlg);
      render(createComponentVNode(2, Dialog, { "class":
        "br-dialog-form", children: createVNode(1, "form",
        "br-grid-form",
        fields, 0, { "name": "grid-form", "data-gridname": grid.name, "data-query": JSON.stringify(grid.query) }) }),


      br.dlg);


      formE = $('.br-grid-form');

      // set fields
      grid.columns.forEach(c => {
        var f = e$(formE, "[name=".concat(c.name, "]"));
        if (f) {
          switch (c.type) {
            case 'number':
              if (c.decimals) {
                f.setAttribute('data-decimals', c.decimals);
              }
              break;
            case 'select':
            case 'autocomplete':
              f.setAttribute('data-query', c.query);
              f.setAttribute('data-list', c.list);
              break;
            case 'file':
              f.classList.add('br-file');
              f.removeAttribute('type');
              break;
            case 'image':
              f.setAttribute('width', 128);
              break;
            default:}

        }
      });
    }

    br.dlg.style.top = '40px';
    br.dlg.style.left = '500px';

    formInit(formE);

    // update
    formUpdate(formE, data);
  });return function gridForm(_x, _x2) {return _ref.apply(this, arguments);};}();