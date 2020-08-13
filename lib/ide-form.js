import { createVNode, createComponentVNode } from "../web_modules/inferno.js"; /*
                                                                                * Brumba
                                                                                * Copyright (c) 2012-2020 Dan Parnete
                                                                                *
                                                                                * This source code is licensed under the MIT license.
                                                                               */

import { render } from "../web_modules/inferno.js";
import { FieldColumn, Label, Button } from "./inferno-bulma.js";
import { strSplit, strCap, translate } from "./common.js";
import { br, $, $$, e$, e$$, remote, unselect, modified, createElement } from "./util.js";
import { renderToString, fileFromDb, fileUpload, imgLoad, confirmModal } from "./components.js";
import { properties, addRadio, toolsText } from "./ide-props.js";
import { pageWrapper } from "./page.js";
import { show } from "./basiccontext/basicContext.js";
import { reloadList } from "./ide.js";

/* 
                                        *  New form
                                        */
export var newForm = () => {
  var ws = br.ws;
  var wo = br.wo;
  wo.value = new Date().toLocaleString();
  wo.name = 'forms';
  render(null, ws);
  var frm = renderToString(createVNode(1, "form",
  "container is-fluid", [createVNode(1, "div",
  "columns", [createVNode(1, "div",
  "container column is-7"), createVNode(1, "div",
  "container column")], 4), createVNode(1, "div",

  "columns", [createVNode(1, "div",
  "container column is-7",
  newFields(toolsText()), 0), createVNode(1, "div",

  "container column")], 4)], 4, { "name": wo.value }));



  ws.innerHTML = pageWrapper(frm);
  e$$(ws, '.container').forEach(c => c.classList.add('br-borders'));

  $$('.field').forEach(el => fieldEvents(el));
  $$('.container').forEach(el => containerEvents(el));
  modified(true);
};



/* 
    *  New fields
    */
export var newFields = names => {
  var flds = strSplit(names, ',') || [];
  var fields = [];
  flds.forEach(name => {
    var n = name.indexOf(':');
    if (n > 0) name = name.substring(0, n);
    fields.push(createComponentVNode(2, FieldColumn, { "fieldAttr":
      { draggable: 'true' }, "labelAttr":
      { class: 'is-one-quarter' }, "inputAttr":
      { name: name, value: name, readonly: true }, children:
      strCap(name).replace(/_/gi, ' ') }));


  });
  return fields;
};



/* 
    *  Add fields
    */
export var addFields = () => {
  var container = $('form');
  if (container) {
    var fields = newFields(toolsText());
    fields.forEach(fld => {
      var el = createElement(renderToString(fld).replace('draggable', 'draggable="true"'));
      container.append(el);
      fieldEvents(el);
    });
  } else {
    alert('Form not found');
  }
};


/* 
    *  Set container events
    */
export var containerEvents = cont => {
  // select
  if (cont !== br.ws) {
    cont.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
      unselect();
      cont.classList.add('br-selected');
      if ($('.br-props')) {
        properties();
      }
    });
  }
  // drop
  cont.addEventListener('drop', e => {
    e.stopPropagation();
    e.preventDefault();
    if (dragged) {
      dragged.style.opacity = "";
      if (dragged.tagName === 'BUTTON') {
        e.target.appendChild(dragged.parentElement);
      } else {
        e.target.appendChild(dragged);
      }
      dragged = null;
      modified(true);
    }
  });
  // context menu
  cont.addEventListener('contextmenu', e => {
    e.preventDefault();

    var label = () => {
      var el = createElement(renderToString(createComponentVNode(2, Label, { "class": 'br-label', children: "Label" })));
      cont.append(el);
      itemEvents(el);
      modified(true);
    };

    var button = () => {
      var el = createElement(renderToString(createComponentVNode(2, Button, { "class": "is-primary", children: "Button" })));
      cont.append(el);
      itemEvents(el);
      modified(true);
    };

    var field = () => {
      var el = createElement(renderToString(newFields('field')[0]));
      cont.append(el);
      fieldEvents(el);
      modified(true);
    };

    var image = () => {
      var el = createElement("<figure class=\"image is-128x128\">\n\t\t\t\t\t<img src=\"https://bulma.io/images/placeholders/128x128.png\">\n\t\t\t\t</figure>");




      cont.append(el);
      itemEvents(el);
      modified(true);
    };

    var column = () => {
      var el = createElement(renderToString(createVNode(1, "div",
      "container column br-borders")));

      cont.parentElement.append(el);
      containerEvents(el);
    };

    var row = () => {
      var el = createElement(renderToString(createVNode(1, "div",
      "columns", [createVNode(1, "div",
      "container column is-7 br-borders"), createVNode(1, "div",
      "container column br-borders")], 4)));


      cont.append(el);
      el.querySelectorAll('.container').forEach(co => containerEvents(co));
    };

    var copy = () => {
      var msg = translate('A copy of this form will be create');
      var onOk = e => {
        var par = { coll: 'forms', where: { name: br.wo.value } };
        remote(par).then(res => {
          if (res.err) return;
          if (!res[0]) return alert(translate('Form not found'));
          var data = res[0];
          delete data._id;
          data.name += '_COPY';
          par.cmd = 'POST';
          delete par.where;
          remote(par, data).then(res => {
            if (res.err) return;
            reloadList();
          });
        });
      };

      confirmModal(msg, onOk);
    };

    show([
    { title: 'Add label', fn: label },
    { title: 'Add button', fn: button },
    { title: 'Add field', fn: field },
    { title: 'Add image', fn: image },
    {},
    { title: 'Add column', fn: column },
    { title: 'Add row', fn: row },
    {},
    { title: 'Copy', fn: copy }],
    e);
  });
};



/* 
    *  Set field events
    */
export var fieldEvents = field => {
  // drop
  field.addEventListener('drop', e => {
    e.stopPropagation();
    e.preventDefault();
    if (dragged && dragged.classList.contains('field')) {
      var targetField = e.target.closest('.field');
      if (targetField === dragged) {
        dragged = null;
        return;
      }
      while (dragged.firstChild) {
        targetField.appendChild(dragged.firstChild);
      }
      dragged.remove();
      dragged = null;
      /*let divColumns = e$(targetField, '.columns')
                      if (!divColumns) {
                        divColumns = createElement('<div class="column columns" />')
                        e.target.parentElement.replaceWith(divColumns)
                        divColumns.append(e.target.parentElement)
                      }
                      e$(divColumns, '.column.control').classList.remove('column')
                      divColumns.append(dragged.firstChild)
                      divColumns.append(dragged.firstChild)
                      if (dragged.childNodes.length === 0) {
                        dragged.parentNode.removeChild(dragged)
                      }*/
      modified(true);
    }
  });
  // select
  field.querySelectorAll('label,input,select,textarea').forEach(el => {
    itemEvents(el);
  });
};



/* 
    *  Set item events
    */
export var itemEvents = item => {
  // selected
  item.addEventListener('click', e => {
    e.stopPropagation();
    e.preventDefault();
    var sel = 'br-selected';
    if (e.ctrlKey) {
      item.classList.toggle(sel);
    } else {
      unselect();
      item.classList.add(sel);
    }
    if ($('.br-props')) {
      properties(e.target);
    }
  });
  // context menu
  if (item.tagName === 'FIGURE') {
    imgContext(item);
  } else if (item.type === 'radio') {
    item.addEventListener('contextmenu', e => {
      e.preventDefault();

      var add = () => {
        addRadio(item.parentElement.parentElement, item.name);
      };

      var remove = () => {
        if (item.parentElement.childElementCount > 4) {
          item.parentElement.lastElementChild.remove();
          item.parentElement.lastElementChild.remove();
        }
      };

      show([
      { title: 'Add radio', fn: add },
      { title: 'Remove radio', fn: remove }],
      e);
    });
  }
};




/* 
    *  Set image context menu
    */
export var imgContext = img => {
  img.addEventListener('contextmenu', e => {
    e.preventDefault();

    var file = () => {
      fileUpload(br.app, res => {
        if (res.err) return alert('Cannot upload file');
        img.setAttribute('data-id', res.newid || res._id);
        imgLoad(br.app, img);
      });
    };

    var database = () => {
      fileFromDb({ db: br.app }, res => {
        img.setAttribute('data-id', res.id);
        imgLoad(br.app, img);
      });
    };

    show([
    { title: 'From file', fn: file },
    { title: 'From database', fn: database }],
    e);
  });
};





/* 
    *  Drag and drop from Mozilla example
    */
var dragged;


/* events fired on the draggable target */
/*document.addEventListener("drag", function(event) {
                                           
                                           }, false);*/

document.addEventListener("dragstart", e => {
  if ('DIV,BUTTON,LABEL'.includes(e.target.tagName) &&
  !e.target.classList.contains('message-header')) {
    dragged = e.target; // store a ref. on the dragged elem
    if (dragged.classList.contains('br-dialog')) {
      e.target.style.opacity = 0.001; // make it transparent
    } else {
      e.target.style.opacity = .2; // make it transparent
    }
  }
}, false);

document.addEventListener("dragend", e => {
  if (e.target.tagName === 'DIV') {
    e.target.style.opacity = ""; // reset the transparency
  }
}, false);



/* events fired on the drop targets */
document.addEventListener("dragover", e => {
  e.preventDefault(); // prevent default to allow drop
}, false);