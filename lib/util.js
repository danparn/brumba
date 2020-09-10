function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};} /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * Brumba
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * Copyright (c) 2012-2020 Dan Parnete
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * This source code is licensed under the MIT license.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   */
import { err, objPick, strSplit, timezone, dateFormat } from "./common.js";
import { formInput } from "./form.js";


/** 
                                        * Globals - login info and other
                                        * <br>br = {
                                        * <br><ul><ui>app: 'applicationName'
                                        * <br><ui>db: 'databaseName'
                                        * <br><ui>usercode: '5f33f94ce1e692204f4d1697'
                                        * <br><ui>ws: DOM element - workspace container link, root
                                        * <br><ui>dlg: DOM element - dialogs container link
                                        * <br></ul>}
                                        */
export var br = {};


/** 
                     * Alias of document.querySelector
                     * <br>
                     * <br>import { $ } from '/lib/util.js'
                     * <br>const frm = $('form')
                     */
export var $ = document.querySelector.bind(document); // alias


/** 
 * Alias of document.querySelectorAll
 * <br>
 * <br>import { $$ } from '/lib/util.js'
 * <br>const frms = $$('form')
 */
export var $$ = document.querySelectorAll.bind(document); // alias


/** 
 * DOM element.querySelector syntax sugar
 * @function
 * @param {element} elem element to search on
 * @param {string} sel selector
 * @returns {element}
 */
export var e$ = (elem, sel) => elem ? elem.querySelector(sel) : null;


/** 
                                                                       * DOM element.querySelectorAll syntax sugar
                                                                       * @function
                                                                       * @param {element} elem element to search on
                                                                       * @param {string} sel selector
                                                                       * @returns {NodeList}
                                                                       */
export var e$$ = (elem, sel) => elem ? elem.querySelectorAll(sel) : [];


/** 
                                                                         * Name selector syntax sugar
                                                                         * <br>n$$('foo,bar') is an abbreviation of document.querySelectorAll('[name=foo],[name=bar]')
                                                                         * @function
                                                                         * @param {string} nameList - Coma separated names list
                                                                         * @returns {NodeList}
                                                                         */
export var n$$ = nameList => {
  var selector = '';
  strSplit(nameList, ',').forEach(name => selector += "[name=".concat(name, "],"));
  if (selector.length > 0) {
    selector = selector.substring(0, selector.length - 1);
    return document.querySelectorAll(selector);
  }
  return null;
};



export var decimalSeparator = 1.1.toLocaleString().substring(1, 2);




/** 
                                                                     * Remote. Fetch anvelope.
                                                                     * <br>Query parameters: par = {
                                                                     * <br><ul><ui>cmd: default 'GET' if coll, 'SRV' if script, 'REP' if report, 'POST' for data save, 'DEL' for delete
                                                                     * <br><ui>app: 'applicationName', default br.app (from login)
                                                                     * <br><ui>db: 'databaseName', default br.db (from login)
                                                                     * <br><ui>coll: 'collectionName'
                                                                     * <br><ui>script: 'scriptName.function', exludes coll
                                                                     * <br><ui>fields: 'fld1,fld2,...', returns only this fields; only with coll
                                                                     * <br><ui>concat: 'fieldName', returns only this embedded array field, merging all selected documents; only with coll; excludes fields
                                                                     * <br><ui>add: 'fld1,fld2,...', adds fields to concat result; only with concat
                                                                     * <br><ui>where: {_id: '...'}, query selector
                                                                     * <br><ui>sort: {fld1: 1, fld2: -1}, sort documents, 1 ascendin, -1 descending
                                                                     * <br><ui>args: {...}, more arguments if neaded
                                                                     * <br><ui>result: 'count', returns only the documents count
                                                                     * <br><ui>findOne: true, returns only one document
                                                                     * <br><ui>usercode: default br.usercode (from login)
                                                                     * <br></ul>}
                                                                     * <br>
                                                                     * @function
                                                                     * @param {object} par query parameters
                                                                     * @param {json} data data to send on server; only for POST
                                                                     * @param {string} type data type, default 'application/json'
                                                                     * @returns {Promise<json>}
                                                                     * @example
                                                                     * import { remote } from '/lib/util.js'
                                                                     * remote({coll: 'Patients', fields: 'firs_name,last_name', where:{active: true}, sort:{last_name: 1})
                                                                     * .then(res => {
                                                                     *   console.log(res)
                                                                     * })
                                                                     * .catch(console.log)
                                                                     * 
                                                                     * async function scr() {
                                                                     *   const data = await remote({script: 'demoSrv.formData'}).catch(console.log)
                                                                     *   console.log(data)
                                                                     * }
                                                                     */
export var remote = (par, dat, type) => {
  // getMsg
  var getMsg = error => {
    var msg;
    switch (error) {
      case err.db:msg = 'database not found: ' + par.db;break;
      case err.coll:msg = 'collection not found: ' + par.coll;break;
      case err.unique:msg = 'value not unique';break;
      case err.count:msg = 'count error';break;
      case err.cursor:msg = 'cursor error';break;
      case err.ins:msg = 'ins error';break;
      case err.upd:msg = 'update error';break;
      case err.del:msg = 'delete error';break;
      //case err.file: msg = 'file error'; break
      case err.dupl:msg = 'duplicate record';break;
      case err.param:msg = 'wrong parameters';break;
      case err.data:msg = 'wrong data';break;
      case err.gen:msg = 'generic error';break;
      case err.srv:msg = 'server error';break;
      case err.script:msg = 'script not found: ' + par.script;break;
      case err.user:msg = 'user not authenticated';break;
      case err.trig:msg = 'trigger error';break;
      case err.sock:msg = 'socket error';break;
      default:}

    return msg;
  };

  //loading(true)
  var timer = setTimeout(() => {
    loading(true);
  }, 500);

  if (!par.cmd) {
    if (par.script) {
      par.cmd = 'SRV';
    } else {
      par.cmd = 'GET';
    }
  }
  Object.assign(par, objPick(br, 'app,usercode'));
  if (!par.db) {
    par.db = br.db || br.app;
  }
  if (!par.db) return alert('Database not specified');

  return fetch(br.url + '/brumba?' + JSON.stringify(par), {
    method: dat ? 'post' : 'get',
    headers: { 'Content-Type': type || 'application/json' },
    body: type ? dat : JSON.stringify(dat) }).

  then(res => res.json()).
  then(data => {
    clearTimeout(timer);
    loading(false);
    if (data.err && data.err !== err.file) {
      if (!data.msg) {
        var msg = getMsg(data.err);
        if (msg) data.msg = msg;
      }
      alert(JSON.stringify(data));
    }
    return data;
  }).
  catch(e => {
    clearTimeout(timer);
    alert(e);
    return { err: err.srv, msg: 'remote error' };
  });
};




/*
    * Loading indicator toggle
    */
export var loading = flag => {
  if (flag) {
    $('body').append(createElement("<a class=\"button is-loading is-primary is-outlined is-large\">loading...</a>"));


  } else {
    $$('.is-loading').forEach(el => el.remove());
  }
};




/*
    * Modified
    */
export var modified = flag => {
  var save = $('#br-save');
  if (flag) {
    save.classList.add('modified');
  } else {
    save.classList.remove('modified');
  }
};



/*
    * Unselect
    */
export var unselect = () => $$('.br-selected').forEach(elem => elem.classList.remove('br-selected'));



/** 
                                                                                                       * Child index in the children list
                                                                                                       * @function
                                                                                                       * @param {element} elem - child element
                                                                                                       * @returns {number}
                                                                                                       */
export var childIndex = elem => {
  var i = 0;
  var child = elem;
  while (child = child.previousElementSibling) {++i;}
  return i;
};




/** 
    * Create DOM element from string HTML syntax
    * @function
    * @param {string} str - html syntax
    * @returns {element}
    */
export var createElement = str => {
  var div = document.createElement('div');
  div.innerHTML = str.trim();
  return div.firstChild;
};




/*
    * Create style
    */
export var createStyle = (css, isPage) => {
  var cls = isPage ? ' br-page-css' : '';
  $('head').append(createElement("<style class=\"br-css".concat(cls, "\">").concat(css, "</style>")));
};



/*
    * Load CSS
    */
export var loadCSS = href => {
  //if (!$(`link[href="${href}"]`)) {
  $('head').append(createElement("<link rel=\"stylesheet\" href=\"".concat(href, "\" type=\"text/css\" />")));
  //}
};





/** 
    * Validate inputs.
    * <br>If fields parameter undefined, all fields of the form are validated.
    * <br>All specified fields are considered required, some has type check.
    * <br>Returns the non valid element, or true if all valid.
    * @function
    * @param {string} fields - comma separated fields list
    * @returns {boolean|element}
    */
export var validate = fields => {
  // valid
  var valid = input => {
    switch (input.type) {
      case 'email':
        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(input.value)) return false;
        break;
      case 'password':
        if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/.test(input.value)) return false;
        break;
      default:
        if (input.value === '') return false;}

    return true;
  };

  if (fields) {
    var flds = strSplit(fields, ',');
    for (var i = 0; i < flds.length; ++i) {
      var input = $("[name=".concat(flds[i], "]"));
      if (!valid(input)) return input;
    }
  } else {
    var inputs = $$('input,select,textarea');
    for (var _i = 0; _i < inputs.length; ++_i) {
      var _input = inputs[_i];
      if (!_input.disabled && !valid(_input)) return _input;
    }
  }
  return true;
};





/*
    * Substitutes retrieve arguments
    */
export var substArgs = (where, elem) => {
  if (where) {
    var dat = page.forms[0].dataset[0];
    var ok = true;
    for (k in where) {
      if (typeof where[k] === 'string' && where[k].charAt(0) === '#') {
        var v = null;
        if (elem) {
          v = fieldVal(elem.parent().find(where[k]));
        }
        if (!v && dat) {
          v = dat[where[k].substr(1)];
        }
        if (v) {
          where[k] = v;
        } else {
          delete where[k];
          ok = false;
        }
      }
    }
    return ok;
  }
  return false;
};




/** 
    * Report call. All form inputs are passed as arguments.
    * @method
    * @param {string} formName
    * @param {string} reportName
    * @param {object} args - more arguments
    */
export var report = (formName, reportName, args) => {
  if (formName) {
    var par = {
      cmd: 'REP',
      app: br.app,
      db: br.db,
      args: { report: reportName, timezone: timezone() },
      usercode: br.usercode };

    Object.assign(par.args, formInput(formName));
    if (args) {
      Object.assign(par.args, args);
    }
    window.open('/brumba?' + JSON.stringify(par));
  }
};




/** 
    * Input date to 'yyyy-mm-dd' string. Separators accepted: . / -
    * <br>'1.1.17' will be converted to '2017-01-01'
    * <br>'1.1' will be converted to 'currentYear-01-01'
    * <br>'1' will be converted to 'currentYear-currentMonth-01'
    * @function
    * @param {string} str - imput string
    * @returns {string}
    */
export var inputDate = str => {
  var pad = n => n < 10 ? '0' + n : n;
  var dayFirst = dateFormat.startsWith('d');
  var sep = str.includes('.') ? '.' : str.includes('-') ? '-' : '/';
  var now = new Date();
  var [d, m, y] = strSplit(str, sep);
  m = m ? parseInt(m, 10) : now.getMonth() + 1;
  y = y ? parseInt(y, 10) : now.getFullYear();
  if (y < 100) {
    y += y > 50 ? 1900 : 2000;
  }
  return "".concat(y, "-").concat(pad(dayFirst ? m : d), "-").concat(pad(dayFirst ? d : m));
};




/*
    * Create script
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




/** 
    * Client script. Dynamic import of a server saved module.
    * <br>It's methods canot be imported as usual, but called by module.method()
    * <br>
    * @method
    * @param {string} scriptName
    * @param {callback} cb
    * @example
    * import { clientScript } from '/lib/util.js'
    * clientScript('scriptName', mod => {
    *   mod.methodName()
    *   ...
    * })
    */
export var clientScript = /*#__PURE__*/function () {var _ref = _asyncToGenerator(function* (scriptName, cb) {
    yield remote({ script: scriptName + '._just_load' }).catch();
    var module = yield import("/scripts/".concat(br.app, "/").concat(scriptName, ".js")).catch(alert);
    if (cb) cb(module);
  });return function clientScript(_x, _x2) {return _ref.apply(this, arguments);};}();




/** 
                                                                                       * Translate string to lang
                                                                                       * @function
                                                                                       * @param {string} str
                                                                                       * @param {json} lang
                                                                                       * @returns {string}
                                                                                       */
export var translate = str => {
  if (br.locales) {
    var t = br.locales.find(r => r.default === str);
    if (t) {
      return t[br.lang] || str;
    }
  }
  return str;
};


/*
    * Translate all
    */
export var translateAll = htmlStr => {
  var htm = createElement(htmlStr);
  // label, button
  e$$(htm, 'label, button').forEach(el => {
    if (!el.classList.contains('radio')) {
      el.textContent = translate(el.textContent);
    }
  });
  // input
  e$$(htm, 'input').forEach(el => {
    ['placeholder', 'help'].forEach(attr => {
      if (el.hasAttribute(attr)) {
        el.setAttribute(attr, translate(el.getAttribute(attr)));
      }
    });
    if (el.type === 'button') {
      el.value = translate(el.value);
    }
  });
  // grid
  var attr = 'data-grid';
  var transGrid = el => {
    var grid = JSON.parse(el.getAttribute(attr));
    grid.columns.forEach(c => c.header = translate(c.header));
    el.setAttribute(attr, JSON.stringify(grid));
  };
  if (htm.hasAttribute(attr)) {
    transGrid(htm);
  }
  e$$(htm, attr).forEach(el => transGrid(el));
  // tab
  e$$(htm, '.tab span').forEach(el => el.textContent = translate(el.textContent));
  return htm.outerHTML;
};