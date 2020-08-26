/*
 * Brumba
 * Copyright (c) 2012-2020 Dan Parnete
 *
 * This source code is licensed under the MIT license.
*/

import { toJSON, strSplit, objEmpty } from "./common.js";
import { br } from "./util.js";
import { formRetrieve, formUpdate } from "./form.js";

var forms = [];
export var formsInit = () => {forms = [];};


/* 
                                             *  Add new form
                                             */
export var addForm = formE => {
  var name = formE.getAttribute('name');
  var form = {
    name: name,
    query: toJSON(mainArgs(formE.getAttribute('data-query'))),
    list: formE.getAttribute('data-list') };

  var i = forms.findIndex(f => f.name === name);
  if (i < 0) {
    forms.push(form);
  } else {
    forms[i] = form;
  }
  setMaster(form);
  return form;
};




/* 
    *  Add new grid
    */
export var addGrid = grid => {
  if (!findForm(grid.name)) {
    forms.push(grid);
    setMaster(grid);
  }
};




/**
    *  Find form
    * <br>Form = {
    * <br><ul><ui>name: 'fname',
    * <br><ui>query: {coll: 'cname', fields: 'fld1,fld2', where: {}, sort: {field:1}},
    * <br><ui>list: string,
    * <br><ui>fields: [{
    * <br><ul><ui>name: string,
    * <br><ui>type: string,
    * <br><ui>newval: val
    * <br></ul>},...]
    * <br><ui>data: {},
    * <br><ui>modified: false
    * <br></ul>}
    * @function
    * @param {string|object} arg
    * @returns {object} form
    */
export var findForm = arg => {
  if (!arg) return null;

  if (typeof arg !== 'string') {
    arg = arg.getAttribute('name');
  }
  return forms.find(f => f.name === arg);
};



/* 
    *  Get details
    */
export var getDetails = form => {
  var det = [];
  if (form) {
    forms.forEach(f => {
      if (f.master === form) {
        det.push(f);
      }
    });
  }
  return det;
};



/* 
    *  Find list form
    */
export var listForm = () => {
  return forms.find(f => f.list && f.query && f.query.coll && !f.query.findone);
};



/* 
    *  Set form's master
    */
export var setMaster = form => {
  if (form && form.query && !form.query.coll && !form.master) {
    var field = form.query.field || form.query.concat;

    if (form.query.master) {
      form.master = findForm(form.query.master);
      delete form.query.master;

    } else if (field) {
      var p = field.lastIndexOf('.');
      if (p > 0) {
        var coll = field.substring(0, p);
        forms.forEach(f => {
          var fc = f.query.field;
          if (f.query.concat) {
            if (f.query.coll) {
              fc = f.query.coll + '.' + f.query.concat;
            } else {
              fc = f.query.concat;
            }
          }
          if (f.query && (f.query.coll === coll || fc === coll)) {
            form.master = f;
            return;
          }
        });
      }

    } else if (objEmpty(form.query)) {
      form.master = listForm();
    }
  }
  //console.log(`form: ${form.name}  master: ${form.master ? form.master.name : 'null'}`)
};




/* 
    *  Refresh forms
    */
export var refreshForms = () => {
  forms.filter(r => r.query.coll || r.query.script).forEach(f => {
    if (f.columns) {
      f.externRefresh();
    } else if (f.data && f.data._id) {
      formRetrieve(f, f.data._id);
    } else {
      formUpdate(f, {});
    }
  });
};




/* 
    * Replace main arguments
    */
export var mainArgs = str => {
  if (str) {
    var qs = str.replace('$user', br.user);
    qs = qs.replace('$app', br.app);
    var uid = isNaN(br.userid) ? '"' + br.userid + '"' : br.userid;
    qs = qs.replace('$userid', uid);
    if (br.menuid) {
      qs = qs.replace('$menuid', br.menuid);
    }
    qs = qs.replace('$menuarg', br.menuarg || '_id');
    return qs;
  }
};