var fs = require('fs'),
	M = require( './mongo' )

var db = 'dan'

var forms = []
M.get( {db: db, coll: 'forms'}, function(res) {
	filter(res)
	getPages()
})


function getPages() {
	M.get( {db: db, coll: 'pages'}, function(res) {
		filter(res)
		fs.writeFileSync( 'sysforms.json', JSON.stringify(forms) )
		process.exit(0)
	})
}

function filter(res) {
	if ( res.err )  return console.log( res )
	else {
		for ( var i=0; i < res.length; i++ ) {
			if ( res[i].name.charAt(0) == '_' ) {
console.log( res[i].name )
				forms.push( res[i] )
			}
		}
	}
}