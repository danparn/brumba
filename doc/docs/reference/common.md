## Members

<dl>
<dt><a href="#dateFormat">dateFormat</a></dt>
<dd><p>Date format, default &#39;dd/mm/yyyy&#39;.</p>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#err">err</a></dt>
<dd><p>Error codes.</p>
</dd>
<dt><a href="#hex24">hex24</a></dt>
<dd><p>hex24 regular expresion, used for for mongodb ObjectId() check.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#timezone">timezone()</a> ⇒ <code>number</code></dt>
<dd><p>Timezone.
<br>Based on the system timezone.</p>
</dd>
<dt><a href="#strCap">strCap(str)</a> ⇒ <code>string</code></dt>
<dd><p>Capitalize string</p>
</dd>
<dt><a href="#strSplit">strSplit(str, sep)</a> ⇒ <code>Array.&lt;string&gt;</code></dt>
<dd><p>Split string by separator, trim spaces and eliminates empty items</p>
</dd>
<dt><a href="#strGetBet">strGetBet(str, from, to, startIndex, include)</a> ⇒ <code>string</code></dt>
<dd><p>Get substring between delimiters.</p>
</dd>
<dt><a href="#strFindAny">strFindAny(str, pat, startIndex)</a> ⇒ <code>number</code></dt>
<dd><p>Find any of chars in pattern.</p>
</dd>
<dt><a href="#objEmpty">objEmpty(obj)</a> ⇒ <code>boolean</code></dt>
<dd><p>Is empty object?</p>
</dd>
<dt><a href="#objPick">objPick(obj, props)</a> ⇒ <code>object</code></dt>
<dd><p>Pick a selection of properties.</p>
</dd>
<dt><a href="#objLess">objLess(obj, props)</a> ⇒ <code>object</code></dt>
<dd><p>Pick all properties less then props list, recursively.</p>
</dd>
<dt><a href="#objDel">objDel(obj, props)</a></dt>
<dd><p>Delete properties of object.
<br>ATTENTION it will modify the original object.</p>
</dd>
<dt><a href="#objClone">objClone(obj)</a> ⇒ <code>object</code></dt>
<dd><p>Object clone</p>
</dd>
<dt><a href="#toJSON">toJSON(str)</a> ⇒ <code>json</code></dt>
<dd><p>Parse string to JSON. More forgiving then the JSON.parse()</p>
</dd>
</dl>

<a name="dateFormat"></a>

## dateFormat
Date format, default 'dd/mm/yyyy'.

<a name="err"></a>

## err
Error codes.

**Example**  
```js
export const err = {
  db: -1,       // database not found/opened
  coll: -2,     // collection not found
  unique: -3,   // not unique field
  count: -4,    // count error
  cursor: -5,   // cursor error
  ins: -6,      // insert error
  upd: -7,      // update error
  del: -8,      // delete error
  file: -9,     // file error
  dupl: -10,    // duplicate record
  param: -11,   // wrong parameters
  data: -12,    // wrong data
  gen: -13,     // generic
  srv: -14,     // server
  script: -15,  // script not found
  user: -16,    // user not authenticated
  trig: -17,    // trigger error
  sock: -18     // socket error
}
```
<a name="hex24"></a>

## hex24
hex24 regular expresion, used for for mongodb ObjectId() check.

<a name="timezone"></a>

## timezone() ⇒ <code>number</code>
Timezone.
<br>Based on the system timezone.

**Returns**: <code>number</code> - +-milliseconds  
<a name="strCap"></a>

## strCap(str) ⇒ <code>string</code>
Capitalize string

**Returns**: <code>string</code> - string  

| Param | Type |
| --- | --- |
| str | <code>string</code> | 

<a name="strSplit"></a>

## strSplit(str, sep) ⇒ <code>Array.&lt;string&gt;</code>
Split string by separator, trim spaces and eliminates empty items

**Returns**: <code>Array.&lt;string&gt;</code> - string array  

| Param | Type |
| --- | --- |
| str | <code>string</code> | 
| sep | <code>string</code> | 

<a name="strGetBet"></a>

## strGetBet(str, from, to, startIndex, include) ⇒ <code>string</code>
Get substring between delimiters.

**Returns**: <code>string</code> - string  

| Param | Type | Description |
| --- | --- | --- |
| str | <code>string</code> |  |
| from | <code>string</code> | from delimiter |
| to | <code>string</code> | to delimiter |
| startIndex | <code>number</code> | index to start, default 0 |
| include | <code>boolean</code> | if delimiters must be included in the return slice, default false |

<a name="strFindAny"></a>

## strFindAny(str, pat, startIndex) ⇒ <code>number</code>
Find any of chars in pattern.

**Returns**: <code>number</code> - Index of the first char found, -1 if non.  

| Param | Type | Description |
| --- | --- | --- |
| str | <code>string</code> |  |
| pat | <code>string</code> | pattern of chars |
| startIndex | <code>number</code> | index to start, default 0 |

<a name="objEmpty"></a>

## objEmpty(obj) ⇒ <code>boolean</code>
Is empty object?

**Returns**: <code>boolean</code> - bool  

| Param | Type |
| --- | --- |
| obj | <code>object</code> | 

<a name="objPick"></a>

## objPick(obj, props) ⇒ <code>object</code>
Pick a selection of properties.

**Returns**: <code>object</code> - New object containing only selected properties.  

| Param | Type | Description |
| --- | --- | --- |
| obj | <code>object</code> |  |
| props | <code>string</code> | comma separated property names |

<a name="objLess"></a>

## objLess(obj, props) ⇒ <code>object</code>
Pick all properties less then props list, recursively.

**Returns**: <code>object</code> - New object containing non excluded properties.  

| Param | Type | Description |
| --- | --- | --- |
| obj | <code>object</code> |  |
| props | <code>string</code> | comma separated property names |

<a name="objDel"></a>

## objDel(obj, props)
Delete properties of object.
<br>ATTENTION it will modify the original object.


| Param | Type | Description |
| --- | --- | --- |
| obj | <code>object</code> |  |
| props | <code>string</code> | comma separated property names |

<a name="objClone"></a>

## objClone(obj) ⇒ <code>object</code>
Object clone

**Returns**: <code>object</code> - New object, clone of the original.  

| Param | Type |
| --- | --- |
| obj | <code>object</code> | 

<a name="toJSON"></a>

## toJSON(str) ⇒ <code>json</code>
Parse string to JSON. More forgiving then the JSON.parse()

**Returns**: <code>json</code> - json  

| Param | Type |
| --- | --- |
| str | <code>string</code> | 

