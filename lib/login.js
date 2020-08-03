import { createVNode, createComponentVNode } from "../web_modules/inferno.js"; /*
                                                                                * Brumba
                                                                                * Copyright (c) 2012-2020 Dan Parnete
                                                                                *
                                                                                * This source code is licensed under the MIT license.
                                                                               */

import { render } from "../web_modules/inferno.js";
import sha256 from "../web_modules/sha256.js";
import { Input, Modal } from "./inferno-bulma.js";
import { objPick } from "./common.js";


var Login = props => {

  // handleSubmit
  var handleSubmit = e => {
    e.preventDefault();

    // FormData
    var data = new FormData(e.target);
    var br = {};
    for (var k of data.keys()) {
      var val = data.get(k);
      if (val !== '') br[k] = val;
    }

    // validation
    var checkRegexp = (text, regexp, msg) => {
      if (!regexp.test(text)) {
        alert(msg);
        return false;
      } else {
        return true;
      }
    };
    var s = ' may consist of a-z, 0-9, and underscores.';
    var isValid = checkRegexp(br.app, /([0-9a-zA-Z_])+$/i, 'Application' + s) &&
    checkRegexp(br.db, /([0-9a-zA-Z_])+$/i, 'Database' + s) &&
    checkRegexp(br.user, /^[a-z]([0-9a-z_.])+$/i, 'Username' + s) &&
    checkRegexp(br.pass, /^.{6,16}$/, 'Password from 6 to 16 chars');
    if (!isValid) return;

    // to localStore
    br.pass = br.pass ? sha256(br.pass) : '';
    if (localStorage) localStorage.setItem('br', JSON.stringify(br));

    // login
    var href = document.location.href,
    url = href.substring(0, href.lastIndexOf('/'));
    br.url = url;
    login(br, props.name === 'ide');
  };

  var br = JSON.parse(localStorage.getItem('br')) || {};

  var elements = [createComponentVNode(2, Input, { "name":
    "app", "type": "text", "placeholder": "application", "value": br.app }), createVNode(1, "br")];


  if (!(props.name === 'ide')) {
    elements.push(createComponentVNode(2, Input, { "name": "db", "type": "text", "placeholder": "aatabase", "value": br.db }));
    elements.push(createVNode(1, "br"));
  }
  elements.push(createComponentVNode(2, Input, { "name": "user", "type": "text", "placeholder": "aser", "value": br.user }));
  elements.push(createVNode(1, "br"));
  elements.push(createComponentVNode(2, Input, { "name": "pass", "type": "password", "placeholder": "password" }));
  elements.push(createVNode(1, "br"));
  if (!(props.name === 'ide')) {
    elements.push(createComponentVNode(2, Input, { "name": "lang", "type": "text", "placeholder": "language", "value": br.lang }));
    elements.push(createVNode(1, "br"));
  }
  elements.push(createVNode(1, "button", "button is-primary", "Login", 16));

  return createComponentVNode(2, Modal, { "class":
    "is-active br-login", children: createVNode(1, "form",
    "container",
    elements, 0, { "onSubmit": handleSubmit }) });



};

export default Login;



/* 
                       *  Login without UI
                       */
export var login = (br, ide) => {
  var url = "".concat(br.url, "/login?&app=").concat(br.app, "&db=").concat(br.db || br.app, "&username=").concat(br.user, "&password=").concat(br.pass);
  delete br.pass;
  fetch(url, {
    headers: { 'Content-Type': 'application/json' } }).

  then(res => res.json()).
  then(data => {
    Object.assign(br, objPick(data, 'usercode,userid,useradm,menu'));
    if (data.err) {
      alert('Login error');

    } else if (ide) {
      import("./ide.js").
      then(module => {
        var Ide = module.default;
        render(createComponentVNode(2, Ide, { "br": JSON.stringify(br) }), document.getElementById('root'));
      }).
      catch(console.log);

    } else {
      import("./app.js").
      then(module => {
        var App = module.default;
        render(createComponentVNode(2, App, { "br": JSON.stringify(br) }), document.getElementById('root'));
      }).
      catch(console.log);
    }
  }).
  catch(console.log);
};