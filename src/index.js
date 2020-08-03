/*
 * Brumba
 * Copyright (c) 2012-2020 Dan Parnete
 *
 * This source code is licensed under the MIT license.
*/

import { render } from 'web/inferno'
import Login from './login'
import { login } from './login'

const br = JSON.parse(sessionStorage.getItem('br')) || {}

if (br.user) {
	login(br)
} else {
	const href = document.location.href
	const root = document.getElementById('root')
	if (href.endsWith('ide')) {
		render(<Login name="ide" />, root)
	} else {
		render(<Login />, root)
	}
	document.querySelector('[name=pass]').focus()
}



