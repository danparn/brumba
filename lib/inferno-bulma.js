import { createVNode, createComponentVNode, normalizeProps } from "../web_modules/inferno.js";function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {var symbols = Object.getOwnPropertySymbols(object);if (enumerableOnly) symbols = symbols.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});keys.push.apply(keys, symbols);}return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i] != null ? arguments[i] : {};if (i % 2) {ownKeys(Object(source), true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));} else {ownKeys(Object(source)).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;} /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           * Brumba
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           * Copyright (c) 2012-2020 Dan Parnete
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           * This source code is licensed under the MIT license.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          */

import { Component } from "../web_modules/inferno.js";
import { objLess, objAddProp } from "./common.js";



/* 
                                                    *  Controlled
                                                    */
class Controlled extends Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.state = { value: props.value || '' };
    this.className = props.class || '';
    this.attr = objLess(props, 'class');
    this.isNumber = false;
    this.handlerChange = props.handlerChange;
  }

  onChange(e) {
    var val = e.target.value;
    if (this.isNumber && typeof e.target.value === 'string') {
      val = val.includes('.') ? parseFloat(val) : parseInt(val, 10);
    } else if (e.target.type === 'checkbox') {
      val = e.target.checked;
    }
    this.setState({ value: val });
    if (this.handlerChange) this.handlerChange(e, this.state.value);
  }}




/* 
      *  Label
      */
export var Label = props => {
  var attr = objLess(props, 'class');
  return normalizeProps(createVNode(1, "label",
  "label ".concat(props.class || '').trim(), props.children, 0, _objectSpread({}, attr)));

};



/* 
    *  Input
    */
export class Input extends Controlled {
  render() {
    var ckrad = 'checkbox,radio'.includes(this.attr.type);
    var cls = ckrad ?
    '' :
    this.attr.type === 'button' ?
    'button' :
    'input';
    var val = ckrad ?
    { checked: this.state.value } :
    { value: this.state.value };
    var inp = normalizeProps(createVNode(64, "input", "".concat(cls, " ").concat(this.className).trim(), null, 1, _objectSpread(_objectSpread(_objectSpread({}, this.attr), val), {}, { "onInput":
      this.onChange })));
    if (this.attr.type === 'radio') {
      return createVNode(1, "label",
      "radio",
      inp, 0);


    } else {
      return inp;
    }
  }}




/* 
      *  Field
      */
export var Field = props => {
  var attr = objLess(props);
  var type = attr.inputAttr.type;
  if (attr.inputAttr.type === 'input-button') attr.inputAttr.type = 'button';
  objAddProp(attr, 'fieldAttr.class', 'field', true);
  objAddProp(attr, 'controlAttr.class', 'control', true);
  var help = attr.inputAttr.help ? createVNode(1, "div", null, createVNode(1, "p",
  "help is-danger", attr.inputAttr.help, 0), 2) :
  null;
  var inputType = () => {
    switch (type) {
      case 'textarea':
        return normalizeProps(createComponentVNode(2, Textarea, _objectSpread({}, attr.inputAttr)));
      case 'select':
        return normalizeProps(createComponentVNode(2, Select, _objectSpread({}, attr.inputAttr)));
      case 'button':
        return normalizeProps(createComponentVNode(2, Button, _objectSpread({}, attr.inputAttr)));
      default:
        return normalizeProps(createComponentVNode(2, Input, _objectSpread({}, attr.inputAttr)));}

  };

  return normalizeProps(createVNode(1, "div", null, [normalizeProps(createComponentVNode(2, Label, _objectSpread(_objectSpread({},

  attr.labelAttr), {}, { children: props.children }))), normalizeProps(createVNode(1, "div", null, [

  inputType(),
  help], 0, _objectSpread({}, attr.controlAttr)))], 4, _objectSpread({}, attr.fieldAttr)));



};



/* 
    *  Field column
    */
export var FieldColumn = props => {
  var attr = objLess(props);
  objAddProp(attr, 'fieldAttr.class', 'columns', true);
  objAddProp(attr, 'labelAttr.class', 'column', true);
  //objAddProp(attr, 'controlAttr.class', 'column', true)

  return normalizeProps(createComponentVNode(2, Field, _objectSpread({},
  attr)));

};



/* 
    *  Select
    */
export class Select extends Controlled {
  constructor(props) {
    super(props);
    this.data = props.data || [];
    this.isNumber = props.type === 'number';
  }

  render() {
    var options = this.data.map(o => createVNode(1, "option", null, o.txt || o.val, 0, { "value": o.val }));
    var def = this.attr.default ? createVNode(1, "option", null,
    this.attr.default, 0, { "value": "" }) :
    null;
    return createVNode(1, "div",
    "select ".concat(this.className).trim(), normalizeProps(createVNode(256, "select", null, [

    def,
    options], 0, _objectSpread(_objectSpread({}, this.attr), {}, { "value": this.state.value, "onInput": this.onChange }))), 2);



  }}




/* 
      *  Textarea
      */
export class Textarea extends Controlled {
  render() {
    return normalizeProps(createVNode(128, "textarea",
    "textarea ".concat(this.className).trim(), null, 1, _objectSpread(_objectSpread({}, this.attr), {}, { "value": this.state.value, "onInput":
      this.onChange })));

  }}




/* 
      *  Button
      */
export var Button = props => {
  return createVNode(1, "div",
  "component", createVNode(1, "button", "button ".concat(
  props.class), props.children, 0, { "type": "button" }), 2);


};



/* 
    *  Modal
    */
export var Modal = props => {
  return createVNode(1, "div", "modal ".concat(
  props.class), [createVNode(1, "div",
  "modal-background"), createVNode(1, "div",
  "modal-content box",
  props.children, 0), createVNode(1, "button",

  "modal-close is-large", null, 1, { "aria-label": "close" })], 4);


};




/* 
    *  Message
    */
export var Message = props => {
  var attr = objLess(props, 'class,onApplay');
  return normalizeProps(createVNode(1, "article",
  "message ".concat(props.class || '').trim(), [createVNode(1, "div",
  "message-header", [createVNode(1, "p", null,
  props.title, 0),
  props.onApplay ? createVNode(1, "a", null, [createVNode(1, "i",
  "fa fa-share"), createVNode(1, "span", null, "apply", 16)], 4, { "onClick": props.onApplay }) :
  null, createVNode(1, "button",
  "delete", null, 1, { "aria-label": "delete", "onClick": props.onClose })], 0), createVNode(1, "div",

  "message-body",
  props.children, 0)], 4, _objectSpread({}, attr)));



};




/*
   
   */