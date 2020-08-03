import { createComponentVNode } from "../web_modules/inferno.js"; /*
                                                                   * Brumba
                                                                   * Copyright (c) 2012-2020 Dan Parnete
                                                                   *
                                                                   * This source code is licensed under the MIT license.
                                                                  */

import { render } from "../web_modules/inferno.js";
import Login from "./login.js";
import { login } from "./login.js";

var br = JSON.parse(sessionStorage.getItem('br')) || {};

if (br.user) {
  login(br);
} else {
  var href = document.location.href;
  var root = document.getElementById('root');
  if (href.endsWith('ide')) {
    render(createComponentVNode(2, Login, { "name": "ide" }), root);
  } else {
    render(createComponentVNode(2, Login), root);
  }
  document.querySelector('[name=pass]').focus();
}