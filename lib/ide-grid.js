import { createComponentVNode } from "../web_modules/inferno.js"; /*
                                                                   * Brumba
                                                                   * Copyright (c) 2012-2020 Dan Parnete
                                                                   *
                                                                   * This source code is licensed under the MIT license.
                                                                  */

import { render } from "../web_modules/inferno.js";
import { strSplit, strCap } from "./common.js";
import { $, $$, br, modified } from "./util.js";
import { properties, toolsText } from "./ide-props.js";
import { pageWrapper } from "./page.js";
import { Grid } from "./grid.js";
import { show } from "./basiccontext/basicContext.js";




/* 
                                                        *  New grid
                                                        */
export var newGrid = () => {
  var grid = {
    rows: 10,
    fixed: 0,
    columns: [] };

  var ws = br.ws;
  var wo = br.wo;
  wo.value = new Date().toLocaleString();
  wo.name = 'forms';
  wo.modified = true;
  render(null, ws);
  ws.innerHTML = pageWrapper('<form name="' + wo.value + '" />');

  var text = toolsText();
  var flds = strSplit(text, ',') || [];
  if (flds.length) {
    flds.forEach(f => {
      var fd = strSplit(f, ':');
      grid.columns.push({
        name: fd[0],
        header: fd[1] || strCap(fd[0]).replace(/_/g, ' ') });

    });
    gridRender(grid, $('form'));
  }
};



/* 
    *  Grid render
    */
export var gridRender = (grid, root, nomodif, noevents) => {
  //console.log(`gridRender: nomodif=${nomodif}  noevents=${noevents}`)
  var data = [];
  var rdata = {};
  var footer = {};
  grid.columns.forEach(c => {
    rdata[c.name] = c.name;
    if (c.total) footer[c.name] = c.name;
  });
  grid.dummy = true;
  for (var i = 0; i < grid.rows; ++i) {
    data.push(rdata);
  }
  if (footer !== {}) grid.footer = footer;

  var cellClick = e => {
    e.stopPropagation();
    e.preventDefault();
    e.target.classList.add('is-selected');
    if ($('.br-props')) properties(e.target, grid);
  };

  render(null, root);
  render(createComponentVNode(2, Grid, { "grid":
    grid, "data": data, "cellClick": cellClick }),
  root);


  // events
  var form = $('form');
  if (!noevents) {
    form.addEventListener('click', e => {
      e.preventDefault();
      $$('.is-selected').forEach(el => el.classList.remove('is-selected'));
      if ($('.br-props')) properties(form, grid);
    });
    form.addEventListener('contextmenu', e => {
      e.preventDefault();

      var add = () => {
        grid.columns.push({
          name: 'field',
          header: 'Field' });

        rdata['field'] = 'field';
        gridRender(grid, root, nomodif, true);
      };

      var remove = () => {
        var c = $('.is-selected');
        if (c) {
          grid.columns = grid.columns.filter(r => r.name !== c.textContent);
          gridRender(grid, root, nomodif, true);
        }
      };

      show([
      { title: 'Add column', fn: add },
      { title: 'Remove column', fn: remove }],
      e);

    });
  }

  delete grid.data;
  delete grid.footer;
  form.setAttribute('data-grid', JSON.stringify(grid));
  if ($('.br-props')) properties(form, grid);
  if (!nomodif) modified(true);
};