/*
 * Brumba
 * Copyright (c) 2012-2020 Dan Parnete
 *
 * This source code is licensed under the MIT license.
*/

import mongodb from 'mongodb'
import assert from 'assert'

const app = process.argv[2] === 'app'
const dbName = process.argv[3]
const url = process.argv[4] || 'localhost:27017'

const client = new mongodb.MongoClient('mongodb://'+url, {
	useNewUrlParser: true,
	useUnifiedTopology: true
})

run()

async function run() {
	try {
		await client.connect()
		database()
	}	catch(err) {
		console.log(err.stack)
	}
}


async function database() {
	const db = client.db(dbName)
	// check
	const stats = await db.command({'dbStats': 1}).catch(console.error)
	if (stats.dataSize > 0) {
		client.close()
		return console.log(`Database ${dbName} exists, try other name.`)
	}
	
	// _users
	let data = {username: 'admin', password: '57b5892eb115f4302e54748e7de9ac80e254f36a6a6b9e9dd90465ed7ef31992', admin: true}
	let res = await db.collection('_users').insertOne(data).catch(console.error)
	console.log(res.result)
	
	if (app) {	
		// menu
		data = {
			"menu" : "\"Setup\"\n\t\"Locales\" forms._locales\n\t\"Users Admin\" pages._users\n\"IDE\" IDE\n",
			"section" : "menu"
		}
		res = await db.collection('application').insertOne(data).catch(console.error)
		console.log(res.result)
		
		// forms
		data = {
			"_id" : mongodb.ObjectId("5eb3fb7f6c6254183c336b0f"),
			"name" : "_users",
			"html" : "<form name=\"_users\" data-grid=\"{&quot;rows&quot;:10,&quot;fixed&quot;:0,&quot;columns&quot;:[{&quot;name&quot;:&quot;username&quot;,&quot;header&quot;:&quot;Username&quot;},{&quot;name&quot;:&quot;password&quot;,&quot;header&quot;:&quot;Password&quot;,&quot;type&quot;:&quot;password&quot;},{&quot;name&quot;:&quot;name&quot;,&quot;header&quot;:&quot;Name&quot;},{&quot;name&quot;:&quot;usergroups&quot;,&quot;header&quot;:&quot;Usergroups&quot;},{&quot;name&quot;:&quot;group&quot;,&quot;header&quot;:&quot;Group&quot;,&quot;type&quot;:&quot;checkbox&quot;},{&quot;name&quot;:&quot;admin&quot;,&quot;header&quot;:&quot;Admin&quot;,&quot;type&quot;:&quot;checkbox&quot;},{&quot;name&quot;:&quot;disabled&quot;,&quot;header&quot;:&quot;Disabled&quot;,&quot;type&quot;:&quot;checkbox&quot;}],&quot;dummy&quot;:true}\" data-query=\"{\ncoll: &quot;_users&quot;\n}\"></form>"
		}
		res = await db.collection('forms').insertOne(data).catch(console.error)
		console.log(res.result)
		data = {
			"_id" : mongodb.ObjectId("5eb3fc626c6254183c336b11"),
			"name" : "_user-permissions",
			"html" : "<form name=\"_user-permissions\" data-grid=\"{&quot;rows&quot;:10,&quot;fixed&quot;:0,&quot;columns&quot;:[{&quot;name&quot;:&quot;form&quot;,&quot;header&quot;:&quot;Page&quot;,&quot;type&quot;:&quot;select&quot;,&quot;query&quot;:&quot;{script: \\&quot;menuItems\\&quot;}&quot;,&quot;list&quot;:&quot;form,menuitem&quot;},{&quot;name&quot;:&quot;read&quot;,&quot;header&quot;:&quot;Read&quot;,&quot;type&quot;:&quot;checkbox&quot;},{&quot;name&quot;:&quot;write&quot;,&quot;header&quot;:&quot;Write&quot;,&quot;type&quot;:&quot;checkbox&quot;},{&quot;name&quot;:&quot;delete&quot;,&quot;header&quot;:&quot;Delete&quot;,&quot;type&quot;:&quot;checkbox&quot;}]}\" data-query=\"{\nfield: &quot;_users.permissions&quot;\n}\"></form>"
		}
		res = await db.collection('forms').insertOne(data).catch(console.error)
		console.log(res.result)
		data = {
			"_id" : mongodb.ObjectId("5eca31984f5d7021e05cced1"),
			"name" : "_options",
			"html" : "<form name=\"_options\" data-grid=\"{&quot;rows&quot;:10,&quot;fixed&quot;:0,&quot;columns&quot;:[{&quot;name&quot;:&quot;description&quot;,&quot;header&quot;:&quot;Description&quot;},{&quot;name&quot;:&quot;code&quot;,&quot;header&quot;:&quot;Code&quot;}]}\" data-query=\"{\n  coll: '_options',\n  where: {type: '$menuid'},\n  sort: {$menuarg: 1}\n}\"></form>"
		}
		res = await db.collection('forms').insertOne(data).catch(console.error)
		console.log(res.result)
		data = {
			"_id" : ObjectId("5f44c9301043b2551a739474"),
			"name" : "_locales",
			"html" : "<form name=\"_locales\" data-grid=\"{&quot;rows&quot;:10,&quot;fixed&quot;:0,&quot;columns&quot;:[{&quot;name&quot;:&quot;default&quot;,&quot;header&quot;:&quot;default&quot;}],&quot;dummy&quot;:true}\" data-query=\"{\ndb: &quot;$app&quot;,\ncoll: &quot;_locales&quot;\n}\"></form>",
			"events" : "import { objClone } from '/lib/common.js'\nimport { $, remote, createElement } from '/lib/util.js'\nimport { findForm } from '/lib/forms.js'\nimport { gridRender } from '/lib/grid.js'\n\nconst gridE = $('.br-grid')\ngridE.before(createElement(`<input name=\"search_default\" style=\"margin-left: 35px;\" />`))\n\n$('[name=search_default]').addEventListener('change', e => {\n  //e.stopPropagation()\n  //e.preventDefault()\n  const val = e.target.value\n  const grid = findForm('_locales')\n  grid.query.where = {default: {'$regex': val, '$options': 'i'}}\n  grid.externRefresh()\n})"
		}
		res = await db.collection('forms').insertOne(data).catch(console.error)
		console.log(res.result)
		
		// pages
		data = {
			"_id" : mongodb.ObjectId("5eb3fc9e6c6254183c336b13"),
			"name" : "_users",
			"html" : "<div class=\"tile is-ancestor br-page\" name=\"_users\"><div class=\"tile\" data-form=\"5eb3fb7f6c6254183c336b0f\"></div><div class=\"tile\" data-form=\"5eb3fc626c6254183c336b11\"></div></div>",
			"css" : "form[name=_user-permissions] {\n  margin-left: 20px !important;\n}"
		}
		res = await db.collection('pages').insertOne(data).catch(console.error)
		console.log(res.result)
	}

	client.close()
}


