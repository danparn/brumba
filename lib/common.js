/*
 * Brumba
 * Copyright (c) 2012-2020 Dan Parnete
 *
 * This source code is licensed under the MIT license.
*/

/**
    *  Error codes
    */
export var err = {
  db: -1, // database not found/opened
  coll: -2, // collection not found
  unique: -3, // not unique field
  count: -4, // count error
  cursor: -5, // cursor error
  ins: -6, // insert error
  upd: -7, // update error
  del: -8, // delete error
  file: -9, // file error
  dupl: -10, // duplicate record
  param: -11, // wrong parameters
  data: -12, // wrong data
  gen: -13, // generic
  srv: -14, // server
  script: -15, // script not found
  user: -16, // user not authenticated
  trig: -17, // trigger error
  sock: -18 // socket error
};


/**
    *  Date format, default 'dd/mm/yyyy'.
    */
export var dateFormat = 'dd/mm/yyyy';



/** 
                                       *  hex24 regular expresion, used for for mongodb ObjectId() check.
                                       */
export var hex24 = new RegExp('^[0-9a-fA-F]{24}$'); // check for hex string of 24 chars



/** 
 * Timezone, based on the system timezone.
 * @function
 * @returns {number} +-milliseconds
 */
export var timezone = () => new Date().getTimezoneOffset() * -60000;




/*
                                                                      * Set decimals
                                                                      */
export var decimals = (value, dec) => Number(Math.round(value + 'e' + dec) + 'e-' + dec);



/** 
                                                                                           * Capitalize string
                                                                                           * @function
                                                                                           * @param {string} str
                                                                                           * @returns {string}
                                                                                           */
export var strCap = str => str.charAt(0).toUpperCase() + str.slice(1);



/** 
                                                                        * Split string by separator, trim spaces and eliminates empty items
                                                                        * @function
                                                                        * @param {string} str
                                                                        * @param {string} sep
                                                                        * @returns {string[]}
                                                                        */
export var strSplit = (str, sep) => {
  if (str && sep) {
    var list = str.split(sep),
    i = 0;
    while (i < list.length) {
      list[i] = list[i].trim();
      if (list[i].length === 0) {
        list.splice(i, 1);
      } else {
        i += 1;
      }
    }
    return list;
  }
  return null;
};




/** 
    * Get substring between delimiters
    * @function
    * @param {string} str
    * @param {string} from - from delimiter
    * @param {string} to - to delimiter
    * @param {number} startIndex - index to start, default 0
    * @param {boolean} include - if delimiters must be included in the return slice, default false
    * @returns {string}
    */
export var strGetBet = (str, from, to, startIndex, include) => {
  if (str && from && to) {
    var f = str.indexOf(from, startIndex || 0);
    var t = str.indexOf(to, f + from.length);

    if (f >= 0 && t > 0) {
      if (include) {
        t += to.length;
      } else {
        f += from.length;
      }
      return str.substring(f, t);
    }
  }
  return '';
};



/** 
    * Find any of chars in pattern
    * @function
    * @param {string} str
    * @param {string} pat - pattern of chars
    * @param {number} startIndex - index to start, default 0
    * @returns {number} Index of the first char found, -1 if non.
    */
export var strFindAny = (str, pat, startIndex) => {
  if (str && pat) {
    for (var i = startIndex || 0, len = str.length; i < len; ++i) {
      for (var j = 0; j < pat.length; ++j) {
        if (str.charAt(i) === pat.charAt(j)) {
          return i;
        }
      }
    }
  }
  return -1;
};







/** 
    * Is empty object?
    * @function
    * @param {object} obj
    * @returns {boolean}
    */
export var objEmpty = obj => {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) return false;
  }
  return true;
};



/** 
    * Pick a selection of properties.
    * @function
    * @param {object} obj
    * @param {string} props - comma separated property names
    * @returns {object} New object containing only selected properties.
    */
export var objPick = (obj, props) => {
  var newobj = {};
  if (obj && props) {
    // string props
    if (typeof props === 'string') {
      var propList = strSplit(props, ',');
      propList.forEach(k => {
        if (obj[k]) {
          newobj[k] = obj[k];
        }
      });
      // function
    } else if (typeof props === 'function') {
      for (var k in obj) {
        if (props(k)) {
          newobj[k] = obj[k];
        }
      }
    }
  }
  return newobj;
};



/** 
    * Pick all properties less then props list, recursively.
    * @function
    * @param {object} obj
    * @param {string} props - comma separated property names
    * @returns {object} New object containing non excluded properties.
    */
export var objLess = (obj, props) => {
  var newobj = {};
  if (obj && typeof obj === 'object') {
    var propList = props ? props.split(',') : [];

    for (var p in obj) {
      if (!propList.includes(p)) {
        if (Array.isArray(obj[p])) {
          newobj[p] = obj[p];
        } else if (obj[p] && typeof obj[p] === 'object') {
          var op = objLess(obj[p], props);
          if (op !== {}) {
            newobj[p] = op;
          }
        } else {
          newobj[p] = obj[p];
        }
      }
    }
  }
  return newobj;
};



/** 
    * Delete properties of object. ATTENTION it will modify the original object.
    * @method
    * @param {object} obj
    * @param {string} props - comma separated property names
    */
export var objDel = (obj, props) => {
  if (obj && props) {
    var propList = props.split(',');
    propList.forEach(k => {
      delete obj[k];
    });
  }
};



/*
    * Add multilevel properties to object
    */
export var objAddProp = (obj, prop, value, append) => {
  if (obj && prop && value) {
    var propTree = prop.split('.');
    var o = obj;
    for (var i = 0; i < propTree.length; ++i) {
      var p = propTree[i];
      if (i < propTree.length - 1) {
        if (!o[p]) {
          o[p] = {};
        }
        o = o[p];
      } else if (o[p]) {
        if (append) {
          o[p] += ' ' + value;
        } else {
          o[p] = value;
        }
      } else {
        o[p] = value;
      }
    }
  }
};



/** 
    * Object clone
    * @function
    * @param {object} obj
    * @returns {object} New object, clone of the original.
    */
export var objClone = obj => {
  if (obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  return obj;
};



/** 
    * Parse string to JSON. More forgiving then the JSON.parse()
    * @function
    * @param {string} str
    * @returns {json}
    */
export var toJSON = str => {
  if (str) {
    var s = str.replace(/'+/g, '"');
    var p = 0;
    var i, c;
    while (true) {
      p = s.indexOf(':', p);
      if (p < 0) {
        try {
          return JSON.parse(s);
        } catch (e) {
          console.log(s);
          console.log('toJSON: parse error: ' + e);
          return null;
        }
      }
      i = p - 1;
      do {c = s.charAt(i--);} while (
      ',{"'.indexOf(c) < 0 && i >= 0);
      if (',{'.indexOf(c) >= 0) {
        s = s.substring(0, i + 2) + '"' + s.substring(i + 2, p).trim() + '"' + s.substring(p);
      }
      ++p;
    }
  }
  return null;
};






/*
    * Set field values on formula
    */
export var formulaValues = (form, formula) => {
  if (!form || !formula || formula.trim().length === 0) return null;

  var op = ', *+/-()';
  var b = 0,e = 0,expr = '';
  while (b > -1) {
    b = formula.indexOf('#', b);
    if (b > -1) {
      e = strFindAny(formula, op, b);
      if (e < 0) {
        e = formula.length;
      }
      var fname = formula.substring(b, e);
      formula = formula.replace(fname, form[fname.substr(1)] || '0');
      ++b;
    }
  }
  return formula;
};