/*
 * Brumba
 * Copyright (c) 2012-2020 Dan Parnete
 *
 * This source code is licensed under the MIT license.
*/

import { render, Component, createRef } from 'web/inferno'
import { strSplit, objClone, toJSON, decimals, translate } from './common'
import { $, e$, e$$, br, remote, createElement, childIndex } from './util'
import { formInit, formUpdate, updateDetails, selectPopulate, selectFromArrayQuery, selectText, deleteRecord } from './form'
import { findForm, addGrid, refreshForms, mainArgs } from './forms'
import { FieldColumn } from './inferno-bulma'
import { Dialog, posDialog, renderToString, listArgs, openFile } from './components'


export let gridRefresh	// for extern call from formSave

/* 
 *  Grid
 */
export class Grid extends Component {
  constructor(props) {
    super(props)
    this.element = createRef()
    this.grid = props.grid
    this.rows = props.grid.rows || 10
    this.rowHeight = 0
    this.rec0 = 0
    this.count = 0
    this.limit = 100
    this.selected = []
    this.scroll = null
    this.dummy = props.grid.dummy || false	// not real data
    this.fixed = props.grid.fixed || 0
    this.cellClick = (props.cellClick || this.cellClick).bind(this)
    this.cellDblClick = this.cellDblClick.bind(this)
    this.butClick = this.butClick.bind(this)
    this.radioClick = props.radioClick
    this.butDel = null
    this.delVisible = false
    this.externRefresh = this.externRefresh.bind(this)
    this.grid.externRefresh = this.externRefresh
    this.rowClick = props.rowClick
    this.onMousewheel = this.onMousewheel.bind(this)
    this.state = {data: props.data || []}
    
    if (this.state.data.length > 0) {
      this.count = this.state.data.length
			this.dummy = false
		} else {
			this.fillDummy()
		}
  }
  
	// componentDidMount
  async componentDidMount() {
		const fh = e$(this.element.current, '.fixed th')
		if (fh) {
			const th = e$(this.element.current, '.table-container thead')
			fh.style.height = th.offsetHeight+'px'
		}
		this.butDel = e$(this.element.current, 'button.br-delete')
		this.scroll = e$(this.element.current, '.br-scroll')
    this.scrollSet()

    // retrieve
    if (this.grid.query) {
			if (!this.grid.readonly) {
				e$(this.element.current, 'button.br-edit').style.display = 'block'
			}
			await this.retrieve()
		} else {
			await this.selectData()
			this.setState({data: this.state.data})
		}
		
		// mouseup for scroll end
		this.scroll.addEventListener('mouseup', e => {
			if (this.scrollMode === 2) {
				this.scrollMode = 1
				this.onScroll(e)
			}
		})
  }
  
	// fillDummy
  fillDummy() {
		let r = {}
		for (let i=0; i < this.grid.columns.length; ++i) {
			r[this.grid.columns[i].name] = '\u200C'
		}
		let data = []
		for (let i=0; i < this.rows; ++i) {
			data.push(r)
		}
		this.state = {data: data}
		this.count = this.rows
		this.dummy = true
	}
  
  // scrollSet
  scrollSet() {
		if (!this.rowHeight) {
			this.rowHeight = this.scroll.scrollHeight / this.rows
			this.scroll.style.height = this.scroll.scrollHeight + 'px'
		}
		this.scroll.firstChild.style.height = Math.round(this.rowHeight * this.count) + 'px'
	}
	
  // onScroll
	onScroll(e) {
    e.stopPropagation()
    e.preventDefault()
		this.unselect()
		this.rec0 = Math.round(e.target.scrollTop / this.rowHeight)
		if (this.scrollMode === 1) {
			this.refresh()
			this.scrollMode = 0
		} else {
			this.scrollMode = 2 // moving
		}
	}
	
  // mouseWheel
	onMousewheel(e) {
    e.stopPropagation()
    e.preventDefault()
    this.scrollMode = 1
    if (this.scroll) {
			this.scroll.scrollTop -= e.wheelDelta / 2
		}
	}
	
	// externRefresh
	async externRefresh(data) {
		this.unselect()
		if (data) {
			this.dummy = false
			await this.selectData()
			await this.autocompleteData(data)
			this.setState({data: data})
		} else {
			this.retrieve()
		}
	}
	
  // refresh
	refresh() {
//console.log('refresh')
		this.unselect()
		for (let i=0, j=this.rec0; i < this.rows && j < this.count; ++i, ++j) {
			if (!this.state.data[j]) {
				let b = j,	bmax = j + this.limit
				do {++b} while (!this.state.data[b] && b < bmax)
				if (b < bmax) {
					let jmin = Math.max(b-this.limit, -1)
					do {--j} while (!this.state.data[j] && j > jmin)
				}
				this.retrieve(j)
				return
			}
		}
		this.setState({data: this.state.data})
	}
  
  // retrieve
  async retrieve(from) {
		if (this.inRetrieve) return
		if (!this.grid.query.coll) return
		this.inRetrieve = true
		const query = objClone(this.grid.query)
		let res
		let data
		
		// count
		if (!from) {
			query.result = 'count'
			res = await remote(query)
			if (res.err) return
			this.count = res.count
			data = []
			this.scrollSet()
			delete query.result
			if (this.count === 0) {
				this.fillDummy()
				return
			}
		}
		
		// retrieve data
		query.limit = this.limit
		if (from) {
			query.skip = from
		}
		from = from || 0
		res = await remote(query)
		if (res.err) return
//console.log(`retrieve ${res.length} from ${from}`)
		await this.selectData()
		await this.autocompleteData(res)								// autocomplete data
		data = data || this.state.data
		for (let i=0; i < res.length; ++i) {
			const rec = res[i]
			this.grid.columns.forEach(c => {
				const name = c.as || c.name
				let val
				if (c.name.includes('+')) {
					const multi = strSplit(c.name, '+')
					val = ''
					multi.forEach(f => {
						if (val.length > 0) val += ' '
						val += rec[f] || ''
					})
				} else if (rec[name]) {
					val = rec[name]
				}
				if (val) {
					rec[name] = val
				}
			})
			data[from+i] = rec
		}
		
		this.dummy = false
		this.unselect()
		this.setState({data: data})
		this.inRetrieve = false
	}
	
	// select data
	async selectData() {
		for (let n=0; n < this.grid.columns.length; ++n) {
			const c = this.grid.columns[n]
		//this.grid.columns.forEach(async c => {
			if (c.type === 'select' && c.query) {
				const q = toJSON(c.query)
				if (Array.isArray(q)) {
					c.data = q
				} else {
					const res = await remote(q).catch(alert)
					c.data = res
					if (c.list) {
						const flds = strSplit(c.list, ',')
						for (let i=0, len=c.data.length; i < len; ++i) {
							const r = c.data[i]
							r._txt = selectText(r, flds)
							if (flds[0] !== '_id') {
								r._id = r[flds[0]]
							}
						}
					}
				}
			}
		}
	}
	
	// autocomplete data
	async autocompleteData(data) {
		const auto = this.grid.columns.filter(c => c.type === 'autocomplete')
		for (let i=0; i < auto.length; ++i) {
			const c = auto[i]
			// ids
			let ids = []
			const list = strSplit(c.list, ',')
			for (let i=0, len=data.length; i < len; ++i) {
				const val = data[i][c.name]
				if (val) {
					const exists = c.data ? c.data.findIndex(r => r._id === val) > -1 : false
					if (!exists && !ids.includes(val)) {
						ids.push(val)
					}
				}
			}
			// column data
			if (ids.length && c.query) {
				const q = toJSON(c.query)
				const cond = {_id: {$in: ids}}
				q.where = q.where ? Object.assign(q.where, cond) : cond
				const res = await remote(q)
				if (res.err) return
				res.forEach(r => r._txt = listArgs(list, r))
				if (c.data) {
					c.data = c.data.concat(res)
				} else {
					c.data = res
				}
			}
		}
	}

	// unselect
	unselect() {
		delete this.grid.data
		this.selected.forEach(r => r.classList.remove('is-selected'))
		this.selected.length = 0
		if (this.delVisible) {
			this.butDel.style.display = 'none'
			this.delVisible = false
			if (this.grid.data) delete this.grid.data
		}
	}
	
	// cellClick
  cellClick(e) {
		this.unselect()
		let id
		const rname = e.target.parentElement.getAttribute('name')
		e$$(this.element.current, `tr[name=${rname}]`).forEach(r => {
			r.classList.add('is-selected')
			this.selected.push(r)
			if (r.id) id = r.id
		})
		this.grid.data = this.state.data.find(r => r._id === id)
		if (!this.grid.readonly) {
			if (id && !this.delVisible) {
				this.butDel.style.display = 'block'
				this.delVisible = true
			}
			const gform = $('.br-grid-form')
			if (gform) {
				formUpdate(gform, this.grid.data || {})
			}
		}
		updateDetails(this.grid)
    if (this.rowClick) {
			this.rowClick(this.selected)
		}
  }

	// cellDblClick
  cellDblClick(e) {
		const i = childIndex(e.target)
		if (this.grid.columns[i].type === 'file') {
			openFile(e.target.textContent)
		} else if (this.grid.columns[i].type === 'image') {
			openFile(null, e.target.id)
		}
	}

	 // butClick
	butClick(e) {
		e.preventDefault()
		const but = e.target.closest('button')
		const id = this.selected[0] ? this.selected[this.selected.length-1].id : null
		gridRefresh = this.externRefresh
		// delete
		if (but.classList.contains('br-delete')) {
			const par = {where: {_id: id}}
			if (this.grid.query.coll) {
				par.coll = this.grid.query.coll
			} else if (this.grid.query.field) {
				const p = this.grid.query.field.indexOf('.')
				par.coll = this.grid.query.field.substring(0, p)
				par.field = this.grid.query.field.substring(p+1)
			}
			deleteRecord(par, res => {
				if (!res.err) {
					refreshForms()
				}
			})
		
		// edit
		} else {
			const rec = id ? this.state.data.find(r => r._id === id) : {}
			gridForm(this.grid, rec)
		}
	}
    
 // render
  render() {
    // header
    let ths = []
    let thf = []
    for (let i=0; i < this.grid.columns.length; ++i) {
      if (i < this.fixed) {
        thf.push(<th>{this.grid.columns[i].header}</th>)
      } else {
        ths.push(<th>{this.grid.columns[i].header}</th>)
      }
    }
    // body
    let trs = []
    let trf = []
    for (let j=0; j < this.rows; ++j) {
			let rec = this.state.data[this.rec0+j]
			if (!rec) rec = {}
			if (rec) {
	      let tds = []
	      let tdf = []
	      for (let i=0; i < this.grid.columns.length; ++i) {
					const col = this.grid.columns[i]
					const name = col.as || col.name
					let id
					let val = rec[name]
//console.log(`col=${col.name}  type=${col.type}  val=${val}  dummy=${this.dummy}`)
					if (!this.dummy && !this.grid.dummy && val !== undefined && !this.grid.ide) {
						switch (col.type) {
							case 'number':
								if (col.decimals) {
									const dec = parseInt(col.decimals, 10)
									const sp = (val+'').split('.')
									if (dec === 0) {
										val = sp[0]
									} else {
										val = sp[0] + '.' + (sp[1] ? sp[1].substring(0, dec).padEnd(dec,'0') : '00')
									}
								}
								break
							case 'date':
								val = (new Date(val)).toLocaleString().substring(0, 10)
								break
							case 'checkbox':
								val = val ? 'x' : val		// 
								break
							case 'datetime-local':
								val = (new Date(val)).toLocaleString()
								val = val.substring(0, val.length-3).replace(',', '')
								break
							case 'select':
							case 'autocomplete':
								if (col.data) {
									const rc = col.data.find(r => r._id === val)
									if (rc) {
										val = rc._txt
									}
								}
								break
							case 'password':
								val = val.length ? '**' : null
								break
							case 'image':
								id = val.length ? val : null
								val = val.length ? '�' : null
								break
							case 'color':
								val = <input class="input" type="color" value={val} disabled />
								break
							case 'radio':
								val = <input type="radio" value={val} onClick={this.radioClick} />
								break
							default:
						}
					}
					let cls = col.align ? `align-${col.align}` : ''
					cls += (col.type === 'textarea' ? ' text' : '')
					cls = cls.trim()
					if (cls.length === 0) cls = null
					const td = <td class={cls} id={id}>{val || '\u200C'}</td>
	        if (i < this.fixed) {
	          tdf.push(td)
	        } else {
	          tds.push(td)
	        }
	      }
	      const Tr = (props) => {
					return <tr id={props.id || null} name={'row'+j} onClick={this.cellClick} onDblClick={this.cellDblClick}>{props.children}</tr>
				}
	      trf.push(<Tr>{tdf}</Tr>)
	      trs.push(<Tr id={rec._id}>{tds}</Tr>)
			}
    }
    // footer
    let tfs = []
    let tff = []
    if (this.grid.footer) {
      for (let i=0; i < this.grid.columns.length; ++i) {
				const td = <td>{this.grid.footer[this.grid.columns[i].name] || ''}</td>
        if (i < this.fixed) {
          tff.push(td)
        } else {
          tfs.push(td)
        }
      }
    }
  
    const cls = "table is-bordered is-striped is-narrow is-hoverable"
    const mainTable =
      <div class="table-container">
        <table class={cls} onMousewheel={this.onMousewheel}>
          <thead>
            {ths}
          </thead>
          <tbody>
            {trs}
          </tbody>
          <tfoot>
            {tfs}
          </tfoot>
        </table>
      </div>
    const fixedTable = 
      <table class={cls+' fixed'}>
        <thead>
          {thf}
        </thead>
        <tbody>
          {trf}
        </tbody>
        <tfoot>
          {tff}
        </tfoot>
      </table>
      
    const bcls = ' button is-primary is-small is-outlined'
  
    return (
      <div class="br-grid columns" ref={this.element}>
				<div class="column">
					<button class={'br-edit'+bcls} onClick={this.butClick}>
							<i class="fa fa-edit"></i>
					</button>
					<button class={'br-delete'+bcls} onClick={this.butClick}>
							<i class="fa fa-trash"></i>
					</button>
				</div>
				<div class="grid-width columns" style="width: 95%;">
	        {this.fixed ? fixedTable : null}
	        {mainTable}
        </div>
        <div class="br-scroll" onScroll={this.onScroll.bind(this)}>
					<div class="br-scroll-content"></div>
        </div>
      </div>
    )
  }
}



/**
 * Grid render
 * @function
 * @param {object|string} formE - form element with data-grid attribut
 * @param {json} data - grid data
 * @param {object} args - arguments
 * @returns {object} grid object
 */
export const gridRender = (formE, data, args) => {
	if (formE) {
		const query = mainArgs(formE.getAttribute('data-query'))
		const gridStruct = formE.getAttribute('data-grid')
		if (gridStruct) {
			const grid = JSON.parse(gridStruct)
			grid.name = formE.getAttribute('name')
			grid.dummy = false
			if (query) {
				grid.query = toJSON(query)
			}
			addGrid(grid)
			render(null, formE)
			render(
				<Grid grid={grid} data={data} {...args} />,
				formE
			)
			return grid
		}
	}
}




/* 
 *  Grid form
 */
const gridForm = async (grid, data) => {
	let formE
  // edit form
  if (grid.form) {
		const par = {db: br.app, coll: 'forms', where: {name: grid.form}}
		const res = await remote(par)
		if (res.err) return
	  
	  render(null, br.dlg)
	  render(
			<Dialog class="br-dialog-form">
			</Dialog>,
			br.dlg
	  )
	  
	  e$(br.dlg, '.message-body').innerHTML = res[0].html
	  formE = e$(br.dlg, 'form')
	  formE.className = 'br-grid-form'
	  formE.setAttribute('name', 'grid-form')
	  formE.setAttribute('data-for', grid.name)
	  e$$(br.dlg, '.container').forEach(el => {
			if (!el.firstChild) {
				el.style.display = 'none'
			}
		})
	  e$$(formE, '.is-7').forEach(el => el.classList.remove('is-7'))
	  e$$(formE, 'textarea').forEach(el => el.parentElement.classList.add('text'))
		
	
	// dynamic form
	} else {
	  let fields = []
	  grid.columns.forEach(f => {
			const ctrlClass = f.type === 'textarea'	? {class: 'text'} : null
			let inputClass = 'is-small'
			let type = f.type
			if (type === 'autocomplete') {
				type = null
				inputClass += ' br-autocomplete'
			}
	    fields.push(
	      <FieldColumn labelAttr={{class: 'is-one-quarter is-small'}}
										controlAttr={ctrlClass}
	                  inputAttr={{type: type, name: f.name, class: inputClass}}>
	        {f.header}
	      </FieldColumn>
	    )
	  })
	
	  render(null, br.dlg)
	  render(
			<Dialog class="br-dialog-form">
				<form class="br-grid-form" name="grid-form" data-gridname={grid.name} data-query={JSON.stringify(grid.query)}>
					{fields}
				</form>
			</Dialog>,
			br.dlg
	  )
	
		formE = $('.br-grid-form')

		// set fields
		grid.columns.forEach(c => {
			const f = e$(formE, `[name=${c.name}]`)
			if (f) {
				switch (c.type) {
					case 'number':
						if (c.decimals) {
							f.setAttribute('data-decimals', c.decimals)
						}
						break
					case 'select':
					case 'autocomplete':
						f.setAttribute('data-query', c.query)
						f.setAttribute('data-list', c.list)
						break
					case 'file':
						f.classList.add('br-file')
						f.removeAttribute('type')
						break
					case 'image':
						f.setAttribute('width', 128)
						break
					default:
				}
			}
		})
	}

	br.dlg.style.top = '40px'
	br.dlg.style.left = '500px'
			
	formInit(formE)
	
	// update
	formUpdate(formE, data)
}


