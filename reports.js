var M = require('./mongo')

exports.cli_proc_header = cli_proc_header

function cli_proc_header( par, callback ) {
	console.log('cli_proc_header')
	par.coll = 'Clienti'
	if ( par.args.cliente ) par.where = {_id: par.args.cliente}
	else par.sort = {codice: 1}
	console.log(par)
	M.get(par, function(res) {
		callback(res)
	})
}
