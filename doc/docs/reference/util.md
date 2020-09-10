## Members

<dl>
<dt><a href="#br">br</a></dt>
<dd><p>Brumba globals</p>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#$">$</a></dt>
<dd><p>Alias of document.querySelector</p>
</dd>
<dt><a href="#$$">$$</a></dt>
<dd><p>Alias of document.querySelectorAll</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#e$">e$(elem, sel)</a> ⇒ <code>element</code></dt>
<dd><p>DOM element.querySelector syntax sugar</p>
</dd>
<dt><a href="#e$$">e$$(elem, sel)</a> ⇒ <code>NodeList</code></dt>
<dd><p>DOM element.querySelectorAll syntax sugar</p>
</dd>
<dt><a href="#n$$">n$$(names)</a> ⇒ <code>NodeList</code></dt>
<dd><p>Name selector syntax sugar</p>
</dd>
<dt><a href="#remote">remote(par, data, type)</a> ⇒ <code>Promise.&lt;json&gt;</code></dt>
<dd><p>Remote. Fetch anvelope.</p>
</dd>
<dt><a href="#childIndex">childIndex(elem)</a> ⇒ <code>number</code></dt>
<dd><p>Child index in the children list</p>
</dd>
<dt><a href="#createElement">createElement(str)</a> ⇒ <code>element</code></dt>
<dd><p>Create DOM element from string HTML syntax</p>
</dd>
<dt><a href="#validate">validate(fields)</a> ⇒ <code>boolean</code> | <code>element</code></dt>
<dd><p>Validate inputs.</p>
</dd>
<dt><a href="#report">report(formName, reportName, args)</a></dt>
<dd><p>Report call.
<br>All form inputs are passed as arguments.</p>
</dd>
<dt><a href="#inputDate">inputDate(str)</a> ⇒ <code>string</code></dt>
<dd><p>Input date.
<br>Converst input to &#39;yyyy-mm-dd&#39; string. Separators accepted: . / -</p>
</dd>
<dt><a href="#clientScript">clientScript(scriptName, cb)</a></dt>
<dd><p>Client script.
<br>Dynamic import of a server saved module.</p>
</dd>
<dt><a href="#translate">translate(str, lang)</a> ⇒ <code>string</code></dt>
<dd><p>Translate string to lang</p>
</dd>
</dl>

<a name="br"></a>

## br
Brumba globals

**Example**  
```js
br = {
  app: 'applicationName',
  db: 'databaseName',
  usercode: '5f33f94ce1e692204f4d1697',
  ws: DOM element,							// workspace container link (root element)
  dlg: DOM element							// dialogs container link
}
```
<a name="$"></a>

## $
Alias of document.querySelector

**Example**  
```js
import { $ } from '/lib/util.js'

const frm = $('form')
```
<a name="$$"></a>

## $$
Alias of document.querySelectorAll

**Example**  
```js
import { $$ } from '/lib/util.js'

const forms = $$('form')
```
<a name="e$"></a>

## e$(elem, sel) ⇒ <code>element</code>
DOM element.querySelector syntax sugar


| Param | Type | Description |
| --- | --- | --- |
| elem | <code>element</code> | element to search on |
| sel | <code>string</code> | selector |

<a name="e$$"></a>

## e$$(elem, sel) ⇒ <code>NodeList</code>
DOM element.querySelectorAll syntax sugar


| Param | Type | Description |
| --- | --- | --- |
| elem | <code>element</code> | element to search on |
| sel | <code>string</code> | selector |

<a name="n$$"></a>

## n$$(names) ⇒ <code>NodeList</code>
Name selector syntax sugar


| Param | Type | Description |
| --- | --- | --- |
| names | <code>string</code> | Coma separated names list |

**Example**  
```js
n$$('foo,bar') is an abbreviation of document.querySelectorAll('[name=foo],[name=bar]')
```
<a name="remote"></a>

## remote(par, data, type) ⇒ <code>Promise.&lt;json&gt;</code>
Remote. Fetch anvelope.

**Returns**: <code>Promise.&lt;json&gt;</code> - promise  

| Param | Type | Description |
| --- | --- | --- |
| par | <code>object</code> | query parameters |
| data | <code>json</code> | data to send on server; only for POST |
| type | <code>string</code> | data type, default 'application/json' |

**Example**  
```js
Query parameters: par = {
  cmd: default 'GET' if coll, 'SRV' if script, 'REP' if report, 'POST' for data save, 'DEL' for delete
  app: 'applicationName', default br.app (from login)
  db: 'databaseName', default br.db (from login)
  coll: 'collectionName'
  script: 'scriptName.function', exludes coll
  fields: 'fld1,fld2,...', returns only this fields; only with coll
  concat: 'fieldName', returns only this embedded array field, merging all selected documents; only with coll; excludes fields
  add: 'fld1,fld2,...', adds fields to concat result; only with concat
  where: {_id: '...'}, query selector, optional
  sort: {fld1: 1, fld2: -1}, sort documents, 1 ascendin, -1 descending, optional
  args: {...}, more arguments if neaded, optional
  result: 'count', returns only the documents count, optional
  findOne: true, returns only one document, optional
  usercode: default br.usercode (from login)
}
```
**Example**  
```js
import { remote } from '/lib/util.js'

remote({coll: 'Patients', fields: 'firs_name,last_name', where:{active: true}, sort:{last_name: 1})
.then(res => {
  console.log(res)
})
.catch(console.log)

async function scr() {
  const data = await remote({script: 'demoSrv.formData'}).catch(console.log)
  console.log(data)
}
```
<a name="childIndex"></a>

## childIndex(elem) ⇒ <code>number</code>
Child index in the children list

**Returns**: <code>number</code> - index  

| Param | Type | Description |
| --- | --- | --- |
| elem | <code>element</code> | child element |

<a name="createElement"></a>

## createElement(str) ⇒ <code>element</code>
Create DOM element from string HTML syntax

**Returns**: <code>element</code> - element  

| Param | Type | Description |
| --- | --- | --- |
| str | <code>string</code> | html syntax |

<a name="validate"></a>

## validate(fields) ⇒ <code>boolean</code> \| <code>element</code>
Validate inputs.

**Returns**: <code>boolean</code> \| <code>element</code> - true/element

If fields parameter undefined, all fields of the form are validated.
<br>All specified fields are considered required, some has type check.
<br>Returns the non valid element, or true if all valid.  

| Param | Type | Description |
| --- | --- | --- |
| fields | <code>string</code> | comma separated fields list |

<a name="report"></a>

## report(formName, reportName, args)
Report call.
<br>All form inputs are passed as arguments.


| Param | Type | Description |
| --- | --- | --- |
| formName | <code>string</code> |  |
| reportName | <code>string</code> |  |
| args | <code>object</code> | more arguments |

<a name="inputDate"></a>

## inputDate(str) ⇒ <code>string</code>
Input date.
<br>Converst input to 'yyyy-mm-dd' string. Separators accepted: . / -

**Returns**: <code>string</code> - string  

| Param | Type | Description |
| --- | --- | --- |
| str | <code>string</code> | imput string |

**Example**  
```js
'1.1.17' will be converted to '2017-01-01'
'1.1' will be converted to 'currentYear-01-01'
'1' will be converted to 'currentYear-currentMonth-01'
```
<a name="clientScript"></a>

## clientScript(scriptName, cb)
Client script.
<br>Dynamic import of a server saved module.


| Param | Type |
| --- | --- |
| scriptName | <code>string</code> | 
| cb | <code>callback</code> | 

**Example**  
```js
Dynamic import of a server saved module.
It's methods canot be imported as usual, but called by module.method()

import { clientScript } from '/lib/util.js'

clientScript('scriptName', mod => {
  mod.methodName()
  ...
})
```
<a name="translate"></a>

## translate(str, lang) ⇒ <code>string</code>
Translate string to lang

**Returns**: <code>string</code> - string  

| Param | Type |
| --- | --- |
| str | <code>string</code> | 
| lang | <code>json</code> | 

