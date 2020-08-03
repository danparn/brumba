import { createVNode, createComponentVNode, normalizeProps } from "../web_modules/inferno.js";function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {try {var info = gen[key](arg);var value = info.value;} catch (error) {reject(error);return;}if (info.done) {resolve(value);} else {Promise.resolve(value).then(_next, _throw);}}function _asyncToGenerator(fn) {return function () {var self = this,args = arguments;return new Promise(function (resolve, reject) {var gen = fn.apply(self, args);function _next(value) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);}function _throw(err) {asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);}_next(undefined);});};}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {var symbols = Object.getOwnPropertySymbols(object);if (enumerableOnly) symbols = symbols.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});keys.push.apply(keys, symbols);}return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i] != null ? arguments[i] : {};if (i % 2) {ownKeys(Object(source), true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));} else {ownKeys(Object(source)).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;} /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             * Brumba
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             * Copyright (c) 2012-2020 Dan Parnete
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             * This source code is licensed under the MIT license.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            */

import { render } from "../web_modules/inferno.js";
import MetisMenu from "../web_modules/metismenujs.js";
import { objLess, translate, toJSON, strSplit } from "./common.js";
import { Message } from "./inferno-bulma.js";
import { $, e$, br, remote, modified, createElement } from "./util.js";
import { findForm } from "./forms.js";




/* 
                                        *  Render to string
                                        */
export var renderToString = jsx => {
  var div = createElement('<div></div>');
  render(jsx, div);
  return div.innerHTML;
};



/* 
    *  Navbar
    */
export var Navbar = props => {
  var openSidebar = () => $("#br-sidebar").style.width = "300px";

  return createVNode(1, "nav", null, createVNode(1, "div",

  "br-navbar", [createVNode(1, "a",
  "br-bars", createVNode(1, "i", "fa fa-bars"), 2, { "onClick": openSidebar }),
  props.children], 0), 2);



};




/* 
    *  Sidebar
    */
export var Sidebar = props => {
  var closeSidebar = () => $("#br-sidebar").style.width = "0px";

  return createVNode(1, "nav",
  "sidebar-nav", [createVNode(1, "a",
  "closebtn", "\xD7", 16, { "onclick": closeSidebar }), createVNode(1, "ul",
  "metismenu",
  props.children, 0, { "id": "br-menu" })], 4, { "id": "br-sidebar" });



};

Sidebar.defaultHooks = {
  onComponentDidMount() {
    new MetisMenu("#br-menu");
  } };


export var closeSidebar = () => {
  $('#br-sidebar').style.width = "0px";
  var el = $('#br-menu a.active');
  if (el) el.classList.remove('active'); // deactivate
  var cm = $('.CodeMirror');
  if (cm) cm.CodeMirror.toTextArea();
  render(null, br.ws);
  var wo = br.wo;
  if (wo) {
    wo.removeAttribute('id');
    wo.name = '';
    wo.value = '';
  }
};




/* 
    *  Dialog
    */
export var Dialog = props => {
  return normalizeProps(createComponentVNode(2, Message, _objectSpread(_objectSpread({},
  props), {}, { "onClose": closeDialog })));

};

Dialog.defaultHooks = {
  onComponentDidMount(domNode) {
    var header = domNode.getElementsByClassName('message-header')[0];
    var dialog = domNode.parentNode;
    header.draggable = true;
    var offsetX, offsetY, pageX, pageY, screenX, screenY;

    header.addEventListener("dragstart", e => {
      offsetX = e.offsetX;
      offsetY = e.offsetY;
      pageX = e.pageX;
      pageY = e.pageY;
      screenX = e.screenX;
      screenY = e.screenY;
    }, false);

    header.addEventListener("dragover", e => {
      e.preventDefault();
    }, false);

    header.addEventListener("dragend", e => {
      e.preventDefault();
      dialog.style.left = pageX + (e.screenX - screenX) - offsetX + 'px';
      dialog.style.top = pageY + (e.screenY - screenY) - offsetY + 'px';
    }, false);
  } };


export var closeDialog = e => {
  var dlg = br.dlg;
  // remenber pos
  var art = dlg.firstChild;
  if (localStorage && art) {
    var pos = { top: dlg.style.top, left: dlg.style.left };
    if (art.className.includes('br-props')) {
      localStorage.setItem('br.dialogPos.props', JSON.stringify(pos));
    } else if (art.className.includes('br-css')) {
      localStorage.setItem('br.dialogPos.css', JSON.stringify(pos));
    } else if (art.className.includes('br-events')) {
      localStorage.setItem('br.dialogPos.events', JSON.stringify(pos));
    }
  }

  render(null, dlg);
};

export var posDialog = type => {
  closeDialog();
  if (localStorage && type) {
    //localStorage.removeItem('br.dialogPos.props')
    var pos = { top: '60px', left: '200px' };
    switch (type) {
      case 'props':
        pos = localStorage.getItem('br.dialogPos.props') || { top: '100px', left: '700px' };
        break;
      case 'css':
        pos = localStorage.getItem('br.dialogPos.css') || { top: '60px', left: '600px' };
        break;
      default:
        pos = localStorage.getItem('br.dialogPos.events') || pos;}

    if (typeof pos === 'string') {
      pos = JSON.parse(pos);
    }
    br.dlg.style.top = pos.top;
    br.dlg.style.left = pos.left;
  }
};





/* 
    *  List box
    */
export var ListBox = props => {
  var items = [];
  props.data.forEach(r => {
    items.push(createVNode(1, "a", "list-item", r.text, 0, { "id": r.id, "onClick": props.onClick }));
  });

  return createComponentVNode(2, Dialog, { "id":
    props.id, "title": props.title, children: createVNode(1, "div",
    "columns", createVNode(1, "div",
    "column", createVNode(1, "div",
    "list is-hoverable",
    items, 0), 2), 2) });





};





/* 
    *  File from database
    */
export var fileFromDb = (par, cb) => {
  var onClick = e => {
    cb({ id: e.target.id, filename: e.target.textContent });
    render(null, br.dlg);
  };

  var q = { cmd: 'GET', db: par.db || br.db, coll: 'fs.files' };
  if (par.type) q.where = { contentType: { $regex: '^' + par.type } };
  remote(q).then(res => {
    if (res.err) return;
    var dat = [];
    res.forEach(r => {
      dat.push({ id: r._id, text: r.filename });
    });

    render(createComponentVNode(2, ListBox, { "data":
      dat, "title": "File from database", "onClick": onClick }),
    br.dlg);

  });
};





/* 
    *  File upload
    */
export var fileUpload = (db, cb) => {
  var f = createElement('<input type="file" style="display: none" />');
  $('body').append(f);

  f.addEventListener('change', e => {
    var file = f.files[0];
    var par = { cmd: 'FILE', mode: 'r', db: db, filename: file.name };
    remote(par).then(res => {
      if (res.err || res.lastModified !== file.lastModified) {
        par = Object.assign(par, {
          mode: 'w',
          options: {
            contentType: file.type,
            metadata: {
              lastModified: file.lastModified } } });



        remote(par, file, file.type).then(res => {
          res.filename = file.name;
          f.remove();
          cb(res);
        });
      } else {
        res.filename = file.name;
        cb(res);
      }
    });
  });

  f.click();
};




/* 
    *  Image load
    */
export var imgLoad = (db, img) => {
  if (db && img) {
    var id = img.getAttribute('data-id');
    if (id) {
      var par = { cmd: 'FILE', mode: 'r', db: db, _id: id, usercode: br.usercode };
      img.firstElementChild.setAttribute('src', '/brumba?' + JSON.stringify(par));
    }
  }
};



/* 
    *  Confirm modal
    */
export var confirmModal = (message, okHandler, color) => {
  var close = e => br.dlg.innerHTML = '';
  color = color || 'is-primary';

  render(null, br.dlg);
  br.dlg.innerHTML = "\n\t\t<div class=\"modal is-active\">\n\t\t\t<div class=\"modal-background\"></div>\n\t\t\t<div class=\"modal-card\">\n\t\t\t\t<header class=\"modal-card-head\">\n\t\t\t\t\t<p class=\"modal-card-title\">Confirmation needed</p>\n\t\t\t\t\t<button class=\"delete\" aria-label=\"close\"></button>\n\t\t\t\t</header>\n\t\t\t\t<section class=\"modal-card-body\">\n\t\t\t\t\t".concat(








  message, "\n\t\t\t\t</section>\n\t\t\t\t<footer class=\"modal-card-foot\">\n\t\t\t\t\t<button class=\"button ").concat(


  color, " mod-ok\">Ok</button>\n\t\t\t\t\t<button class=\"button mod-close\">Cancel</button>\n\t\t\t\t</footer>\n\t\t\t</div>\n\t\t</div>\n\t");





  e$(br.dlg, '.mod-ok').addEventListener('click', e => {okHandler();close();});
  e$(br.dlg, '.mod-close').addEventListener('click', close);
  e$(br.dlg, '.delete').addEventListener('click', close);
};






/* 
    *  Autocomplete
    */
export var autocomplete = (input, form) => {
  var auto = createElement("\n\t\t<div class=\"dropdown br-autocomplete is-active\">\n\t\t\t<div class=\"dropdown-trigger br-autocomplete\">\n\t\t\t</div>\n\t\t\t<div class=\"dropdown-menu\" role=\"menu\">\n\t\t\t\t<div class=\"dropdown-content\">\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t");









  input.parentNode.replaceChild(auto, input);
  e$(auto, '.dropdown-trigger').append(input);
  var content = e$(auto, '.dropdown-content');
  content.style.display = 'none';

  input.addEventListener('change', e => {
    content.innerHTML = '';
    if (input.value.length > 2) {
      var query = toJSON(input.getAttribute('data-query'));
      var list = strSplit(input.getAttribute('data-list'), ',');
      if (query && list) {
        if (!query.where) query.where = {};
        var regex = {
          '$regex': input.value,
          '$options': 'i' };

        if (list[1].charAt(0) === '+') {
          var fld0 = {};
          fld0[list[0]] = regex;
          var fld1 = {};
          fld1[list[1].substring(1)] = regex;
          query.where.$or = [fld0, fld1];
        } else {
          query.where[list[0]] = regex;
        }
        query.limit = 100;
        remote(query).then(res => {
          if (res.err) return;
          if (res.length === 100) {
            notification(translate("\n\t\t\t\t\t\t\tToo many records, only the first 100 returned. Please try to write more characters.\n\t\t\t\t\t\t"));


          }
          res.forEach(r => {
            var txt = listArgs(list, r);
            var a = createElement("\n\t\t\t\t\t\t\t<a id=".concat(
            r._id, " href=\"#\" class=\"dropdown-item\">").concat(txt, "</a>\n\t\t\t\t\t\t"));

            content.append(a);

            a.addEventListener('click', e => {
              content.style.display = 'none';
              var rec = res.find(r => r._id + '' === e.target.id + '');
              var fld = form.fields.find(f => f.name === input.getAttribute('name'));
              if (fld && rec) {
                fld.newval = rec._id;
                input.value = e.target.textContent;
                if (query.extra) {
                  extraFields(query.extra, rec, input);
                }
              } else {
                alert("fld: ".concat(fld, "  rec: ").concat(rec));
              }
            });
          });
          content.style.display = 'block';
        });
      }
    } else {
      alert(translate('Minimum 3 characters please'));
    }
  });

  input.addEventListener('focusout', e => {
    if (!(e.relatedTarget && e.relatedTarget.classList.contains('dropdown-item'))) {
      content.style.display = 'none';
    }
  });

};





/* 
    *  listArgs
    */
export var listArgs = (list, rec) => {
  var txt = rec[list[0]];
  var add = (sep, val) => txt += rec[val] ? sep + rec[val] : '';

  for (var i = 1; i < list.length; ++i) {
    if (list[i].charAt(0) === '+') {
      add(' ', list[i].substring(1));
    } else {
      add(' - ', list[i]);
    }
  }
  return txt;
};





/* 
    *  autocompleteText
    */
export var autocompleteText = /*#__PURE__*/function () {var _ref = _asyncToGenerator(function* (input, form) {
    var query = toJSON(input.getAttribute('data-query'));
    var fld = form.fields.find(f => f.name === input.getAttribute('name'));
    var rec = fld.data ? fld.data.find(r => r._id === form.data[fld.name]) : null;
    // read data
    if (!fld.data || !rec) {
      var id = { _id: form.data[fld.name] };
      query.where = query.where ? Object.assign(query.where, id) : id;
      var res = yield remote(query);
      if (res.err) return;
      if (!res[0]) return alert(translate('autocomplete _id not found ' + input.value));
      if (fld.data) {
        fld.data.push(res[0]);
        rec = res[0];
      } else {
        fld.data = res;
        rec = fld.data.find(r => r._id === form.data[fld.name]);
      }
    }
    if (rec) {
      input.value = listArgs(strSplit(input.getAttribute('data-list'), ','), rec);
      if (query.extra) {
        extraFields(query.extra, rec, input);
      }
    }
  });return function autocompleteText(_x, _x2) {return _ref.apply(this, arguments);};}();




/* 
                                                                                           *  extraFields
                                                                                           */
var extraFields = (extraStr, rec, input) => {
  var formE = input.closest('form');
  var form = findForm(formE);
  var extra = strSplit(extraStr, ',');
  extra.forEach(f => {
    if (rec[f]) {
      e$(formE, "[name=".concat(f, "]")).value = rec[f];
      if (form.data) form.data[f] = rec[f];
    }
  });
};







/* 
    *  Notification
    */
export var notification = message => {
  var notif = createElement("\n\t\t<div class=\"notification is-danger\">\n\t\t\t<button class=\"delete\"></button>\n\t\t</div>\n\t");




  notif.append(createElement('<p>' + message + '</p>'));
  e$(notif, 'button').addEventListener('click', e => notif.remove());
  $('body').append(notif);
};





/* 
    *  Input image load
    */
export var inputImageLoad = (elem, id) => {
  if (id) {
    var par = {
      cmd: 'FILE',
      db: br.db,
      mode: 'r',
      _id: id,
      w: Math.round(elem.width),
      usercode: br.usercode };

    elem.setAttribute('src', '/brumba?' + JSON.stringify(par));
  }
};





/* 
    *  Input type file or image
    */
export var inputFile = (elem, image) => {
  elem.setAttribute('alt', ' ');

  // click
  elem.addEventListener('click', e => {
    openFile(elem.value, image ? elem.value : null);
  }, false);

  // right click
  elem.addEventListener('contextmenu', e => {
    e.preventDefault();
    fileUpload(br.db, res => {
      if (res.err) return alert('Cannot upload file');
      if (image) {
        var val = res.newid || res._id;
        elem.value = val;
        inputImageLoad(elem, val);
      } else {
        elem.value = res.filename;
      }
      elem.dispatchEvent(new Event('change'));
    });
  }, false);
};



/* 
    *  Open file
    */
export var openFile = (filename, id) => {
  var par = {
    cmd: 'FILE',
    db: br.db,
    mode: 'r',
    usercode: br.usercode };

  if (id) {
    par._id = id;
  } else {
    par.filename = filename;
  }
  window.open('/brumba?' + JSON.stringify(par));
};






/* 
    *  Context menu
    */
/*export const contextMenu = (input, options) => {
       	const cm = createElement(`
       		<div class="dropdown br-contextmenu is-active">
       			<div class="dropdown-trigger">
       			</div>
       			<div class="dropdown-menu" role="menu">
       				<div class="dropdown-content">
       				</div>
       			</div>
       		</div>
       	`)
       	const parent = input.parentNode
       	parent.replaceChild(cm, input)
       	e$(cm, '.dropdown-trigger').append(input)
       	
       	
       	const content = e$(cm, '.dropdown-content')
       	content.style.display = 'none'
       
       	content.innerHTML = ''
       	options.forEach(o => {
       		const a = createElement(`
       			<a class="dropdown-item">${o.title}</a>
       		`)
       		a.onclick = o.fn
       		content.append(a)
       	})
       	content.style.display = 'block'
       	
       	
       	
       }
       
       const contextMenuClose = e => {
       console.log('contextMenuClose')
       	const cm = $('.br-contextmenu')
       	if (cm) {
       		const input = e$(cm, 'input')
       		if (input) {
       			cm.parentNode.replaceChild(input, cm)
       		}
       	}
       }
       
       $('body').addEventListener('click', contextMenuClose)
       */