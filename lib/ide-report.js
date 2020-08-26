/*
 * Brumba
 * Copyright (c) 2012-2020 Dan Parnete
 *
 * This source code is licensed under the MIT license.
*/

import { $, $$, br, modified, unselect, createElement } from "./util.js";
import { itemEvents, imgContext } from "./ide-form.js";
import { properties } from "./ide-props.js";
import { show } from "./basiccontext/basicContext.js";



/* 
                                                        *  New report
                                                        */
export var newReport = () => {
  var ws = br.ws;
  var wo = br.wo;
  wo.value = new Date().toLocaleString();
  wo.name = 'reports';

  ws.innerHTML = "<form class=\"br-report br-form\" style=\"font:11px arial;\">\n  <div name=\"header\" class=\"br-band br-header\" style=\"height: 20px;\"><label class=\"watermark\">header</label></div>\n  <div name=\"detail\" class=\"br-band br-detail\" style=\"height: 20px;\"><label class=\"watermark\">detail</label></div>\n  <div name=\"total\" class=\"br-band br-total\" style=\"height: 20px;\"><label class=\"watermark\">total</label></div>\n  <div name=\"footer\" class=\"br-band br-footer\" style=\"height: 40px;\"><label class=\"watermark\">footer</label><label class=\"br-label\" for=\"_date\" style=\"top:10px;left:5px;\" draggable=\"true\">Date:</label><input class=\"br-field\" name=\"_date\" style=\"top:10px;left:50px;\" type=\"text\" draggable=\"true\" readonly=\"true\" value=\"_date\"><label class=\"br-label\" for=\"_page\" style=\"top: 10px; left: 495px;\" draggable=\"true\">Page:</label><input class=\"br-field\" name=\"_page\" style=\"top: 10px; left: 545px; width: 30px;\" type=\"text\" readonly=\"true\" value=\"_page\"></div>\n</form>";







  $$('.br-band').forEach(bandEvents);
  reportEvents();
  modified(true);
};



/* 
    *  New report
    */
export var openReport = rec => {
  //console.log(rec)
  var ws = br.ws;
  var wo = br.wo;
  ws.innerHTML = rec.html;
  reportEvents();
  $$('.br-band').forEach(bandEvents);
  $$('.br-label,.br-field').forEach(setElement);
};




/* 
    *  Report events
    */
var reportEvents = () => {
  var report = $('.br-report');

  // click
  report.addEventListener('click', e => {
    if ($('.br-props')) {
      properties();
    }
  });

  // context menu
  report.addEventListener('contextmenu', e => {
    e.preventDefault();

    var group = () => {
      var detail = $('.br-detail');
      var band = createElement(
      '<div class="br-band br-group" name="group" style="height:20px;"><label class="watermark">group</label></div>');

      detail.before(band);
      bandEvents(band);
    };

    var copy = () => {
      confirmModal('A copy of this report will be create', e => {
        var par = { coll: 'reports', where: { name: br.wo.value } };
        remote(par).then(res => {
          if (res.err) return;
          if (!res[0]) return alert('Report not found');
          var data = res[0];
          delete data._id;
          data.name += '_COPY';
          par.cmd = 'POST';
          delete par.where;
          remote(par, data).
          then(res => {
            if (res.err) return;
            reloadList();
          }).
          catch(console.error);
        });
      });
    };

    show([
    { title: 'Add group', fn: group },
    {},
    { title: 'Copy', fn: copy }],
    e);
  });

  // workspace events
  var move = false;
  br.ws.addEventListener('mousedown', e => {
    e.stopPropagation();
    e.preventDefault();
    move = true;
  });
  br.ws.addEventListener('mouseover', e => {
    e.stopPropagation();
    e.preventDefault();
    if (move && e.ctrlKey && isSelectable(e.target)) {
      e.target.classList.add('br-selected');
    }
  });
  br.ws.addEventListener('mouseup', e => {
    e.stopPropagation();
    e.preventDefault();
    move = false;
  });
  br.ws.addEventListener('dblclick', unselect);
};




/* 
    *  Set report
    */
var setElement = el => {
  el.setAttribute('draggable', 'true');
  if (el.classList.contains('br-field')) {
    el.setAttribute('readonly', 'true');
    if (el.tagName === 'TEXTAREA') {
      el.textContent = el.name;
    } else {
      el.setAttribute('value', el.name);
    }
  }
  if (el.tagName === 'IMG') {
    imgContext(el);
  }
  itemEvents(el);
};





/* 
    *  Drag and drop
    */
var dragged, startX, startY;

document.addEventListener("dragstart", e => {
  e.stopPropagation();
  if (isSelectable(e.target)) {
    dragged = e.target;
    startX = e.pageX;
    startY = e.pageY;
  } else {
    //e.preventDefault()
  }
}, false);

document.addEventListener("dragend", e => {
  if (dragged) {// in case of no drop
    dragged.style.opacity = "";
    dragged = null;
  }
}, false);


/* 
            *  Set band events
            */
var bandEvents = bandE => {
  // unselect
  bandE.addEventListener('click', e => {
    e.stopPropagation();
    e.preventDefault();
    if ($('.br-props')) {
      properties(bandE);
    }
  });
  // select
  bandE.addEventListener('dblclick', e => {
    e.stopPropagation();
    e.preventDefault();
    unselect();
    bandE.classList.add('br-selected');
  });
  // drop
  bandE.addEventListener('drop', e => {
    e.stopPropagation();
    e.preventDefault();
    if (dragged) {
      dragged.style.opacity = "";
      if (bandE === dragged.parentElement) {
        var deltaX = e.pageX - startX;
        var deltaY = e.pageY - startY;
        if (dragged.classList.contains('br-selected')) {
          $$('.br-selected').forEach(el => {
            el.style.left = el.offsetLeft + deltaX + 'px';
            el.style.top = el.offsetTop + deltaY + 'px';
          });
        } else {
          dragged.style.left = dragged.offsetLeft + (e.pageX - startX) + 'px';
          dragged.style.top = dragged.offsetTop + (e.pageY - startY) + 'px';
        }
      } else {
        if (dragged.classList.contains('br-selected')) {
          $$('.br-selected').forEach(el => bandE.appendChild(el));
        } else {
          bandE.appendChild(dragged);
        }
      }
      dragged = null;
      modified(true);
    }
  });
  // context menu
  bandE.addEventListener('contextmenu', e => {
    e.preventDefault();
    var left = e.offsetX;
    var top = e.offsetY;

    var add = el => {
      bandE.append(el);
      setElement(el);
      modified(true);
    };

    var label = () => {
      add(createElement("<label class=\"br-label\" style=\"left:".concat(
      left, "px; top:").concat(top, "px\">Label</label>")));

    };

    var field = () => {
      add(createElement("<input class=\"br-field\" name=\"field\" style=\"left:".concat(
      left, "px; top:").concat(top, "px\" value=\"field\" />")));

    };

    var image = () => {
      var el = createElement("<img src=\"https://bulma.io/images/placeholders/128x128.png\" style=\"left:".concat(
      left, "px; top:").concat(top, "px\">"));

      add(el);
      imgContext(el);
    };

    show([
    { title: 'Add label', fn: label },
    { title: 'Add field', fn: field },
    { title: 'Add image', fn: image }],
    e);
  });
};



/* 
    *  Is selectable element
    */
var isSelectable = elem => 'LABEL,INPUT,SELECT,TEXTAREA,IMG'.includes(elem.tagName) &&
!elem.classList.contains('message-header');