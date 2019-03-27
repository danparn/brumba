/*
 * Brumba
 *
 * © 2012-2019 Dan Parnete
 * Dual licensed under the MIT and GPL licenses.
 * 
 * 
 * Util is a library used on both server and browser 
 */



/* Error codes
*/
const
	err = {
		db: -1,			// database not found/opened
		coll: -2,			// collection not found
		unique: -3,	// not unique field
		count: -4,		// count error
		cursor: -5,		// cursor error
		ins: -6,			// insert error
		upd: -7,		// update error
		del: -8,			// delete error
		file: -9,			// file error
		dupl: -10,		// duplicate record
		param: -11,	// wrong parameters
		data: -12,		// wrong data
		gen: -13,		// generic
		srv: -14,		// server
		script: -15,	// script not found
		user: -16,		// user not authenticated
		trig: -17,		// trigger error
		sock: -18		// socket error
	},
	
	dateFormat = 'dd/mm/yy'			// default date format




/*****************************************************
 *								String functions
 *****************************************************/

// @flow
/**
 * Counts ocureance of a char in a string
 * @param {string} str the base string
 * @param {char} ch the char to look for
 * @returns {number} how many times.
 */
function strCountChar(str, ch) {
	let count = 0
	
	for (let i=0; str[i]; i+=1) {
		if (str[i] === ch) count += 1
	}
	return count
}


/* Find one of any char in the pattern
*/
function strFindAny(str, pat, start) {
	if (str || pat) {
		for (let i=start || 0, len=str.length; i < len; i+=1) {
			for (let j=0; j < pat.length; j+=1) {
				if (str.charAt(i) === pat.charAt(j)) return i
			}
		}
	}
	return -1
}


/* Get substring between delimiters
*/
function strGetBet(str, from, to, include) {
	if (str && from && to) {
		let f = str.indexOf(from),
			t = str.lastIndexOf(to)
		
		if (f >= 0 && t > 0 && t > f) {
			if (include) t += to.length
			else  f += from.length
			return str.substring(f, t)
		}
	}
	return ''
}


/* Delete substring between delimiters
*/
function strDelBet(str, from, to) {
	if (str && from && to) {
		let s = str
		const fl = from.length,
			  tl = to.length		
		while (true) {
			const fi = s.indexOf(from),
				  ti = s.indexOf(to, fi+fl)
			if (fi >= 0 && ti > 0) {
				s = s.substr(0, fi) + s.substr(ti+tl)
			} else {
				return s
			}
		}
	}
	return str
}


/* Replace all substrings from with to
*/
function strRep(str, from, to) {
	if (str && from) {
		let s = str,
			done = false,
			p = 0
		const flen = from.length,
			  tlen = to.length
		
		while (!done) {
			p = s.indexOf(from, p)
			if (p >= 0) {
				s = s.substr(0,p) + to + s.substr(p+flen)
				p += tlen
			} else {
				done = true
			}
		}
		return s
	}
	return str
}


/* Insert pat at pos
*/
function strIns(str, pat, pos) {
	if (str && pat) return str.substring(0, pos).concat(pat).concat(str.substr(pos))
	return str
}


/* Capitalize string
*/
function strCapitalize(str) {
	if (str) return str.substr(0, 1).toUpperCase().concat(str.substr(1))
	return str
}


/* Split and trim spaces
*/
function strSplit(str, sep) {
	if (str && sep) {
		let sp = str.split( sep ),
			i = 0
		while (i < sp.length) {
			sp[i] = sp[i].trim()
			if (sp[i].length === 0) sp.splice(i, 1)
			else i += 1
		} 
		return sp
	}
	return null
}



/* DOM element
*/
function strElem(elem, text, attr) {
	if (elem) {
		let s = '<' + elem
		if (attr) {
			for (let a in attr) {
				s += ' ' + a + '="' + attr[a] + '"'
			}
		}
		if (text && elem === 'label') {
			s += '>' + text + '</' + elem + '>'
		} else {
			s += '/>'
		}
		return s
	}
}



/* Date to string
time: hm (just hour and minute), else full time
*/
function strDate(date, time) {
	let s
	if (date) {
		if (!(date instanceof Date)) date = new Date(date)
		const d = date.getDate(),
			  m = date.getMonth() + 1
		
		if (dateFormat.charAt(0) == 'd') s = pad(d) + '/'+ pad(m) + '/'
		else s = pad(m) + '/'+ pad(d) + '/'
		s += date.getFullYear()
		
		if (time) {
			s += ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes())
			if (time !== 'hm') s += ':' + pad(date.getSeconds())
		}
	}
	return s
}


/* Current DateTime in db format
*/
function strNowDateTime() {
	const dt = new Date()
	return dt.getFullYear() + '-' + pad(dt.getMonth()+1) + '-' + pad(dt.getDate()) + ' ' + dt.toLocaleTimeString()
}



/* Time from milliseconds to string
*/
function strTime(time, sec) {
	let ret = ''
	if (time >= 0) {
		if (time < 2678400000) {	// 1 feb 1970
			let s = time / 1000
			const h = Math.floor(s/3600)
			s -= h * 3600
			const m = Math.floor(s/60)
			ret = pad(h) + ':' + pad(m)
			if (sec) {
				s -= m * 60
				ret += ':' + pad(s)
			}
		} else {
			const dt = new Date(time)
			ret = pad(dt.getHours()) + ':' + pad(dt.getMinutes())
			if (sec) ret += pad(dt.getSeconds())
		}
	}
	return ret
}


/* Date to XML format
*/
function strDateXml(date, time) {
	let s
	if (date) {
		if (!(date instanceof Date)) date = new Date(date)
		const d = date.getDate(),
			  m = date.getMonth() + 1
		s = date.getFullYear() + '-' + pad(m) + '-' + pad(d)
		if (time) {
			s += 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds())
		}
	}
	return s
}



/* Capitalize string
*/
function strCap(str) {
	return str.charAt(0).toUpperCase() + str.slice(1)
}











/*****************************************************
 *							Miscellaneous functions
 *****************************************************/

/* Get week number
*/
// This script is released to the public domain and may be used, modified and 
// distributed without restrictions. Attribution not necessary but appreciated. 
// Source: http://weeknumber.net/how-to/javascript 
// Returns the ISO week of the date.
Date.prototype.getWeek = function() { 
	var date = new Date(this.getTime()); 
	date.setHours(0, 0, 0, 0); 
	// Thursday in current week decides the year. 
	date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7); 
	// January 4 is always in week 1. 
	var week1 = new Date(date.getFullYear(), 0, 4); 
	// Adjust to Thursday in week 1 and count number of weeks from date to week1. 
	return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7); 
}




/* Set decimals
*/
function decimals(value, dec) {
  return Number(Math.round(value+'e'+dec)+'e-'+dec);
}



/* To zero hour
*/
function timeToZeroHour(time, tzone, asObj) {
	let dt
	if (time instanceof Date) {
		dt = time
	} else if (time > 0) {
		if (tzone) time += tzone - timezone()
		dt = new Date(time)
	} else {
		return time
	}
	
	dt.setHours(0)
	dt.setMinutes(0)
	dt.setSeconds(0)
	dt.setMilliseconds(0)
	if (asObj) return dt
	else return dt.getTime()
}



/* Timezone
*/
function timezone() {
	const d = new Date()
	return d.getTimezoneOffset() * -60000
}

function toTimezone(data, fields) {
	if (data && fields) {
		const fld = strSplit(fields, ','),
			  tz = timezone()
		for (let i=0, len=data.length; i < len; i+=1) {
			let rec = data[i]
			if (rec) {
				for (let j=0; j < fld.length; j+=1) {
					if (rec[fld[j]]) {
						rec[fld[j]] += tz
					}
				}
			} 
		}
	}
}



/* Convert buffer to zero ended string
*/
function bufString(buf, start, end) {
	let e = start
	while (buf[e] !== 0x0 && e < end) e += 1
	return buf.toString('utf8', start, e)
}



/* Is numeric value
*/
function isNumberStr(str) {
  return !isNaN(parseFloat(str)) && isFinite(str)
}



/* Merge objects
*/
function objMerge(obj1, obj2) {
	let obj3 = {}
	for (var k in obj1)  obj3[k] = obj1[k]
	for (var k in obj2)  obj3[k] = obj2[k]
	return obj3
}



/* Extend objects with some fields
*/
function objExtendFields(obj, ext, fields) {
	if (obj && ext && fields) {
		const f = strSplit(fields, ',')
		for (let i=0; i < f.length; i+=1)
			if (ext[f[i]]) obj[f[i]] = ext[f[i]]
	}
}



/* Object has this fields
*/
function objHasFields(obj, fields) {
	if (obj && typeof obj == 'object' && typeof fields == 'string') {
		const sp = strSplit(fields, ',')
		for (let i=0; i < sp.length; i+=1) {
			if (!(sp[i] in obj)) return false
		}
		return true
	}
	return false
}



/* Clone JSON
*/
function cloneJSON(json) {
	return JSON.parse(JSON.stringify(json))
}



/* String to JSON
*/
function toJSON(str) {
	if (str) {
		let s = strRep(str, "'", '"'),
			p = 0,
			i, c
		while (true) {
			p = s.indexOf(':', p)
			if (p < 0) {
				try	{
					return JSON.parse(s)
				} catch (e) {
					console.log( s )
					console.log( 'toJSON: parse error: ' + e )
					return null
				}
			}
			i = p-1
			do c = s.charAt(i--)
			while (',{"'.indexOf(c) < 0 && i >= 0)
			if (',{'.indexOf(c) >= 0) {
				s = s.substring(0,i+2) + '"' + s.substring(i+2,p).trim() + '"' + s.substr(p)
			}
			p += 1
		}
	}
	return null
}



/* Distance between two geo points
*/
function geoDist(p1, p2) {
	const R = 6371, // earth rad
		  dLat = (p2.latitude - p1.latitude).toRad(),
		  dLon = (p2.longitude-p1.longitude).toRad(),
		  lat1 = p1.latitude.toRad(),
		  lat2 = p2.latitude.toRad(),
	
		  a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * 
																Math.cos(lat1) * Math.cos(lat2),
		  c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
	return R * c
}



/* Translate
*/
function translate(str, lang, languages) {
	if (!str) return
	
	let s = str,
		hasCol = false
	const langData = languages || ((typeof br !== 'undefined') ? br.langData : null)
	if (lang && langData && langData[0]) {
		if (s.charAt(s.length-1) === ':') {
			hasCol = true
			s = s.substr(0, s.length-1)
		}
		for (let i=0,len=langData.length; i < len; i+=1) {
			if (langData[i].default === s) {
				const t = langData[i]
				if (t[lang]) s = t[lang]
			}
		}
		if (hasCol) s += ':'
	}
	if (s.charAt(1) === '#') s = s.substr(2)
	return s
}



/* Set field values on formula
*/
function formulaValues(form, formula) {
	if (!form || !formula || formula.trim().length === 0) return null
	
	const op = ', *+/-()'
	let b = 0, e = 0, expr = ''
	while (b > -1) {
		b = formula.indexOf('#', b)
		if (b > -1) {
			e = strFindAny(formula, op, b)
			if (e < 0) e = formula.length
			const fname = formula.substring(b,e)
			let v = null
			if (form.jquery) {
				const fld = form.find(fname)
				if (fld[0]) v = fieldVal(fld)
				else v = fieldVal(page.forms[0].tag.find(fname))	// master field
			} else {
				v = form[fname.substr(1)] || '0'
			}
			formula = formula.replace(fname, v)
			b += 1
		}
	}
	return formula
}




/* Read line
*/
function readln(str) {  
	this.str = str
	this.off = 0
	this.end = false
} 

readln.prototype.read = function () { 
	const p = this.str.indexOf('\n', this.off)
	let ln = ''
	if (p < 0) {
		ln = this.str.substr(this.off)
		this.end = true
	} else {
		ln = this.str.substring(this.off, p)
		this.off = p + 1
	}
	if (ln.charAt(ln.length-1) === '\r') ln = ln.substring(0, ln.length-1)
	return ln
}






/* GroupBy and sum
*/
function groupSum(dat, groupFields, sumFields, extraFields) {  
	const gf =  groupFields.split(','),
		  sf =  sumFields.split(',')
			
	const reducer = (acc, obj) => {
		const o = _.find(acc, (r) => {
			let found = true
			for (let i=0; found && i < gf.length; i++1) {
				const f = gf[i]
				if (obj[f] != r[f]) found = false
			}
			return found
		})
		if (o) {
		   for (let i=0; i < sf.length; i+=1) {
				const f = sf[i]
			    o[f] += obj[f]
		   }
		} else {
			let newObj = {}
			objExtendFields(newObj, obj, groupFields+','+sumFields+','+extraFields)
			acc.push(newObj)
		}
		return acc
	}
		
	return dat.reduce(reducer, [])
}




function pad(n) {
	return (n<10) ? '0'+n : ''+n
}






export {
	err,
	strFindAny,
	strCountChar,
	strGetBet,
	strDelBet,
	strRep,
	strIns,
	strDate,
	strTime,
	strDateXml,
	strSplit,
	bufString,
	isNumberStr,
	objMerge,
	objHasFields,
	objExtendFields,
	cloneJSON,
	toJSON,
	timezone,
	timeToZeroHour,
	translate,
	formulaValues,
	readln,
	decimals,
	strCap,
	groupSum
}
