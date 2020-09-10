## Functions

<dl>
<dt><a href="#formRetrieve">formRetrieve(form, id)</a></dt>
<dd><p>Form: retrieve, then update.</p>
</dd>
<dt><a href="#formUpdate">formUpdate(formE, data)</a></dt>
<dd><p>Form: data update</p>
</dd>
<dt><a href="#formInput">formInput(form, fields, required)</a> ⇒ <code>object</code> | <code>null</code></dt>
<dd><p>Form input. Collect input data.</p>
</dd>
<dt><a href="#formSave">formSave(formE)</a></dt>
<dd><p>Form save. Save modified data</p>
</dd>
</dl>

<a name="formRetrieve"></a>

## formRetrieve(form, id)
Form: retrieve, then update.


| Param | Type | Description |
| --- | --- | --- |
| form | <code>object</code> | form object |
| id | <code>string</code> | document id |

<a name="formUpdate"></a>

## formUpdate(formE, data)
Form: data update


| Param | Type |
| --- | --- |
| formE | <code>element</code> | 
| data | <code>json</code> | 

<a name="formInput"></a>

## formInput(form, fields, required) ⇒ <code>object</code> \| <code>null</code>
Form input. Collect input data.

**Returns**: <code>object</code> \| <code>null</code> - collected data, null if errors  

| Param | Type | Description |
| --- | --- | --- |
| form | <code>object</code> \| <code>string</code> | form or formName |
| fields | <code>string</code> | comma separated fields list |
| required | <code>boolean</code> | required fields |

<a name="formSave"></a>

## formSave(formE)
Form save. Save modified data


| Param | Type |
| --- | --- |
| formE | <code>element</code> | 

