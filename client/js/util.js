/*
 * Brumba
 *
 * © 2012-2013 Dan Parnete
 * Dual licensed under the MIT and GPL licenses.
*/

/* Error codes
*/
const
	err = {
		db: -1,
		coll: -2,
		unique: -3,
		count: -4,
		cursor: -5,
		ins: -6,
		upd: -7,
		del: -8,
		file: -9,
		dupl: -10,
		param: -11,
		data: -12,
		gen: -13,
		srv: -14,
		script: -15,
		user: -16
	},
	
	dateFormat = 'dd/mm/yy'


/*****************************************************
 *		String functions
 *****************************************************/

/* Counts ocureance of char
*/
function strCountChar( str, ch ) {
	var count = 0
	
	for ( var i=0; str[i]; i++ ) {
		if ( str[i] == ch )  count++
	}
	return count
}


/* Find one of any char in pat
*/
function strFindAny( str, pat, start ) {
	if ( str || pat ) {
		for ( var i=start || 0, len=str.length; i < len; i++ ) {
			for ( var j=0; j < pat.length; j++ ) {
				if ( str.charAt(i) == pat.charAt(j) )  return i
			}
		}
	}
	return -1
}


/* Get substring between delimiters
*/
function strGetBet( str, from, to, include ) {
	if ( str && from && to ) {
		var f = str.indexOf( from ),
			t = str.lastIndexOf( to )
		
		if ( f >= 0 && t > 0 ) {
			if ( include )  t += to.length
			else  f += from.length
			return str.substring(f, t)
		}
	}
	return ''
}


/* Delete substring between delimiters
*/
function strDelBet( str, from, to ) {
	if ( str && from && to ) {
		var s = str
		  , fl = from.length
		  , tl = to.length
		while ( true ) {
			var fi = s.indexOf( from )
			  , ti = s.indexOf( to, fi+fl )
			if ( fi >= 0 && ti > 0 ) {
				s = s.substr(0,fi) + s.substr(ti+tl)
			} else {
				return s
			}
		}
	}
	return str
}


/* Replace all substrings from with to
*/
function strRep( str, from, to ) {
	if ( str && from ) {
		var s = str,
			done = 0
		
		do {
			if ( s.indexOf( from ) >= 0 ) {
				s = s.replace( from, to )
			} else {
				done = 1
			}
		} while ( done <= 0 )
		return s
	}
	return str
}


/* Multiple replaces
 pat: [[from1,to1], [from2,to2], ...]
*/
/*function strMultiRep ( str, pat ) {
	for ( var i=pat.length-1; i >= 0; i-- ) {
		str = strRep( str, pat[i][0], pat[i][1] )
	}
	return str
}*/


/* Insert pat at pos
*/
function strIns( str, pat, pos ) {
	if ( str && pat )  return str.substring(0, pos).concat(pat).concat(str.substr(pos))
	return str
}


/* Capitalize string
*/
function strCapitalize( str ) {
	if ( str )  return str.substr(0, 1).toUpperCase().concat(str.substr(1))
	return str
}


/* Split and trim spaces
*/
function strSplit( str, sep ) {
	if ( str && sep ) {
		var sp = str.split( sep )
			, i = 0
		while ( i < sp.length ) {
			sp[i] = sp[i].trim()
			if ( sp[i].length == 0 )  sp.splice(i, 1)
			else  i++
		} 
		return sp
	}
	return null
}



/* DOM element
*/
function strElem( elem, text, attr ) {
	if ( elem ) {
		var s = '<' + elem
		if ( attr )
			for ( var a in attr ) {
				s += ' ' + a + '="' + attr[a] + '"'
			}
		if ( text && elem == 'label')
			s += '>' + text + '</' + elem + '>'
		else
			s += '/>'
		return s
	}
}



/* Date to string
time: hm (just hour and minute), else full time
*/
function strDate( date, time ) {
	var pad = function(n) { return n<10 ? '0'+n : n }
		, s
	
	if ( date ) {
		if ( typeof date == 'number' ) date = new Date(date)
		var d = date.getDate()
			, m = date.getMonth() + 1
		
		if ( dateFormat.charAt(0) == 'd' )  s = pad(d) + '/'+ pad(m) + '/'
		else  s = pad(m) + '/'+ pad(d) + '/'
		s += date.getFullYear()
		
		if ( time ) {
			s += ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes())
			if ( time != 'hm' ) s  += ':' + pad(date.getSeconds())
		}
	}
	return s
}


/* Current DateTime in db format
*/
function strNowDateTime() {
	function pad(n) { return n<10 ? '0'+n : n }
	var dt = new Date()
	return dt.getFullYear() + '-' + pad(dt.getMonth()) + '-' + pad(dt.getDate()) + ' ' + dt.toLocaleTimeString()
}



/* Time from milliseconds to string
*/
function strTime( time, sec ) {
	var pad = function(n) { return n<10 ? '0'+n : n }
		, ret = ''
	if ( time > 0 ) {
		var dt = new Date(time)
		if ( dt.getFullYear() > 1970 ) {
			ret = pad(dt.getHours()) + ':' + pad(dt.getMinutes())
			if ( sec ) ret += pad(dt.getSeconds())
		} else {
			var s = time / 1000
				, h = Math.floor(s/3600)
			s -= h * 3600
			var m = Math.floor(s/60)
			ret = pad(h) + ':' + pad(m)
			if ( sec ) {
				s -= m * 60
				ret += ':' + pad(s)
			}
		}
	}
	return ret
}

// 









/*****************************************************
 *		Miscellaneous functions
 *****************************************************/


/* Is numeric value
*/
function isNumber( str ) {
  return !isNaN(parseFloat(str)) && isFinite(str)
}


/* Is valid object
*/
function objValid( obj ) {
	if ( !Array.isArray(obj) ) obj = [obj]
	for ( var i=0; i < obj.length; i++ )
		if ( typeof obj[i] != 'object' ) return false
	return true
}


/* Is empty object
*/
function isEmpty( obj ) {
	for ( var p in obj )  return false
	return true
}


/* Empty the object
*/
function empty( obj ) {
	for ( var p in obj ) {
		delete obj[p]
	}
}



/* Merge objects
*/
function objMerge( obj1, obj2 ) {
	var obj3 = {}
	for ( var k in obj1 )  obj3[k] = obj1[k]
	for ( var k in obj2 )  obj3[k] = obj2[k]
	return obj3
}



/* Extend objects
*/
function objExtend( obj, ext ) {
	if ( obj )
		for ( var k in ext )
			if ( ext[k] ) obj[k] = ext[k]
}


/* Extend objects with some fields
*/
function objExtendFields( obj, ext, fields ) {
	if ( obj && ext && fields ) {
		var f = strSplit(fields, ',')
		for ( var i=0; i < f.length; i++ )
			if ( ext[f[i]] ) obj[f[i]] = ext[f[i]]
	}
}



/* Return selected object fields
*/
function objFields( obj, fields ) {
	var sp = fields.split( ',' )
		, o = {}
	if ( obj )
		for ( var i=0; i < sp.length; i++ )
			if ( obj[sp[i]] ) o[sp[i]] = obj[sp[i]]
	return o
}



/* Object has this fields
*/
function objHasFields( obj, fields ) {
	if ( typeof obj == 'object' && typeof fields == 'string' ) {
		var sp = strSplit(fields, ',')
		for ( var i=0; i < sp.length; i++ )
			if ( ! (sp[i] in obj) ) return false
		return true
	}
	return false
}




/* Clone JSON
*/
function cloneJSON( json ) {
	return JSON.parse( JSON.stringify(json) )
}



/* String to JSON
*/
function toJSON( str ) {
	if ( str ) {
		var s = strRep(str, "'", '"')
			, p = 0
			, i, c
		while ( true ) {
			p = s.indexOf(':', p)
			if ( p < 0 ) {
				try	{
					return JSON.parse(s)
				} catch (e) {
					console.log( s )
					console.log( 'JSON.parse error: ' + e )
					return null
				}
			}
			i = p-1
			do c = s.charAt(i--)
			while ( ',{"'.indexOf(c) < 0 && i >= 0 )
			if ( ',{'.indexOf(c) >= 0 ) {
				s = s.substring(0,i+2) + '"' + s.substring(i+2,p).trim() + '"' + s.substr(p)
			}
			p++ 
		}
	}
	return null
}








if ( typeof module != 'undefined' && module.exports ) {
	// export for node
	exports.err = err
	exports.strFindAny = strFindAny
	exports.strCountChar = strCountChar
	exports.strGetBet = strGetBet
	exports.strDelBet = strDelBet
	exports.strRep = strRep
	exports.strIns = strIns
	exports.strDate = strDate
	exports.strTime = strTime
	exports.strSplit = strSplit
	exports.objMerge = objMerge
	exports.objExtend = objExtend
	exports.objExtendFields = objExtendFields
	exports.objFields = objFields
	exports.objHasFields = objHasFields
	exports.objValid = objValid
	exports.cloneJSON = cloneJSON
	exports.toJSON = toJSON
	exports.isEmpty = isEmpty
}