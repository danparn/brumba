/*
 * Brumba
 * Copyright (c) 2012-2020 Dan Parnete
 *
 * This source code is licensed under the MIT license.
*/

import { Component } from 'web/inferno'
import { objLess, objAddProp } from './common'



/* 
 *  Controlled
 */
class Controlled extends Component {
  constructor(props) {
    super(props)
    this.onChange = this.onChange.bind(this)
    this.state = {value: props.value || ''}
    this.className = props.class || ''
    this.attr = objLess(props, 'class')
    this.isNumber = false
    this.handlerChange = props.handlerChange
  }

  onChange(e) {
    let val = e.target.value
    if (this.isNumber && typeof e.target.value === 'string') {
      val = val.includes('.') ? parseFloat(val) : parseInt(val, 10)
    } else if (e.target.type === 'checkbox') {
      val = e.target.checked
    }
    this.setState({value: val})
    if (this.handlerChange) this.handlerChange(e, this.state.value)
  }
}



/* 
 *  Label
 */
export const Label = (props) => {
  const attr = objLess(props, 'class')
  return (
    <label class={`label ${props.class || ''}`.trim()} {...attr}>{props.children}</label>
  )
}



/* 
 *  Input
 */
export class Input extends Controlled{
  render() {
		const ckrad = 'checkbox,radio'.includes(this.attr.type)
    const cls = ckrad
                ? ''
                : (this.attr.type === 'button') 
                  ? 'button'
                  : 'input'
    const val = ckrad
                ? {checked: this.state.value} 
                : {value: this.state.value}
    const inp = <input class={`${cls} ${this.className}`.trim()} {...this.attr} {...val} 
              onInput={this.onChange} />
    if (this.attr.type === 'radio') {
			return (
				<label class="radio">
					{inp}
				</label>
			)
		} else {
			return inp
		}
  }
}



/* 
 *  Field
 */
export const Field = (props) => {
  const attr = objLess(props)
  const type = attr.inputAttr.type
  if (attr.inputAttr.type === 'input-button') attr.inputAttr.type = 'button'
  objAddProp(attr, 'fieldAttr.class', 'field', true)
  objAddProp(attr, 'controlAttr.class', 'control', true)
  const help = attr.inputAttr.help
              ? <div><p class="help is-danger">{attr.inputAttr.help}</p></div>
              : null
  const inputType = () => {
    switch (type) {
      case 'textarea':
        return <Textarea {...attr.inputAttr} />
      case 'select':
				return <Select {...attr.inputAttr} />
      case 'button':
        return <Button {...attr.inputAttr} />
     default:
        return <Input {...attr.inputAttr} />
    }
  }
  
  return (
    <div {...attr.fieldAttr}>
      <Label {...attr.labelAttr}>{props.children}</Label>
      <div {...attr.controlAttr}>
        {inputType()}
        {help}
      </div>
    </div>
  )
}



/* 
 *  Field column
 */
export const FieldColumn = (props) => {
  const attr = objLess(props)
  objAddProp(attr, 'fieldAttr.class', 'columns', true)
  objAddProp(attr, 'labelAttr.class', 'column', true)
  //objAddProp(attr, 'controlAttr.class', 'column', true)

  return (
    <Field {...attr} />
  )
}



/* 
 *  Select
 */
export class Select extends Controlled{
  constructor(props) {
    super(props)
    this.data = props.data || []
    this.isNumber = props.type === 'number'
  }

  render() {
    const options = this.data.map(o => (<option value={o.val}>{o.txt || o.val}</option>))
    const def = this.attr.default 
                    ? <option value="">{this.attr.default}</option>
                    : null
    return (
      <div class={`select ${this.className}`.trim()}>
        <select {...this.attr} value={this.state.value} onInput={this.onChange}>
          {def}
          {options}
        </select>
      </div>
    )
  }
}



/* 
 *  Textarea
 */
export class Textarea extends Controlled {
  render() {
    return (
      <textarea class={`textarea ${this.className}`.trim()} {...this.attr} value={this.state.value} 
                onInput={this.onChange} />
    )
  }
}



/* 
 *  Button
 */
export const Button = (props) => {
  return (
    <div class="component">
      <button class={`button ${props.class}`} type="button">{props.children}</button>
    </div>
  )
}



/* 
 *  Modal
 */
export const Modal = (props) => {
  return (
    <div class={`modal ${props.class}`}>
      <div class="modal-background"></div>
      <div class="modal-content box">
        {props.children}
      </div>
      <button class="modal-close is-large" aria-label="close"></button>
    </div>
  )
}




/* 
 *  Message
 */
export const Message = (props) => {
  const attr = objLess(props, 'class,onApplay')
  return (
    <article class={`message ${props.class || ''}`.trim()} {...attr}>
      <div class="message-header">
        <p>{props.title}</p>
        {props.onApplay
            ? <a onClick={props.onApplay}><i class="fa fa-share"></i><span>apply</span></a>
            : null}
        <button class="delete" aria-label="delete" onClick={props.onClose} />
      </div>
      <div class="message-body">
        {props.children}
      </div>
    </article>
  )
}




/*

*/
