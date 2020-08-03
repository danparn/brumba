/*
 * Brumba
 * Copyright (c) 2012-2020 Dan Parnete
 *
 * This source code is licensed under the MIT license.
*/

import mongodb from 'mongodb'
import assert from 'assert'

const url = 'localhost:17270'
const dbName = process.argv[2]

const client = new mongodb.MongoClient('mongodb://'+url, {
	useNewUrlParser: true,
	useUnifiedTopology: true
})
client.connect(err => {
	assert.equal(null, err)
  const db = client.db(dbName);
	const user = {username: 'admin', password: '57b5892eb115f4302e54748e7de9ac80e254f36a6a6b9e9dd90465ed7ef31992', admin: true}
  db.collection('_users').insertOne(user, (err, res) => {
    assert.equal(null, err)
    assert.equal(1, res.insertedCount)

    client.close()
  })
})
