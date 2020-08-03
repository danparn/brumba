/*
 * Brumba
 * Copyright (c) 2012-2020 Dan Parnete
 *
 * This source code is licensed under the MIT license.
*/

import { render } from 'web/inferno'
import sha256 from 'web/sha256'
import { Input, Modal } from './inferno-bulma'
import { objPick } from './common'


const Login = (props) => {
  
  // handleSubmit
  const handleSubmit = (e) => {
    e.preventDefault()
    
    // FormData
    const data = new FormData(e.target)
    let br = {}
    for (let k of data.keys()) {
      const val = data.get(k)
      if (val !== '') br[k] = val
    }

    // validation
    const checkRegexp = (text, regexp, msg) => {
      if (!regexp.test(text)) {
        alert(msg)
        return false
      } else {
        return true
      }
    }
    const s = ' may consist of a-z, 0-9, and underscores.'
    const isValid = checkRegexp(br.app, /([0-9a-zA-Z_])+$/i, 'Application' + s) &&
                    checkRegexp(br.db, /([0-9a-zA-Z_])+$/i, 'Database' + s) &&
                    checkRegexp(br.user, /^[a-z]([0-9a-z_.])+$/i, 'Username' + s) &&
                    checkRegexp(br.pass, /^.{6,16}$/, 'Password from 6 to 16 chars');
    if (!isValid) return

    // to localStore
    br.pass = br.pass ? sha256(br.pass) : ''
    if (localStorage) localStorage.setItem('br', JSON.stringify(br))

    // login
    const href = document.location.href,
          url = href.substring(0, href.lastIndexOf('/'))
    br.url = url
    login(br, props.name === 'ide')
  }

  const br = JSON.parse(localStorage.getItem('br')) || {}
  
  let elements = [
    <Input name="app" type="text" placeholder="application" value={br.app} />,
    <br />
  ]
  if (!(props.name === 'ide')) {
    elements.push(<Input name="db" type="text" placeholder="aatabase" value={br.db} />)
    elements.push(<br />)
  }
  elements.push(<Input name="user" type="text" placeholder="aser" value={br.user} />)
  elements.push(<br />)
  elements.push(<Input name="pass" type="password" placeholder="password" />)
  elements.push(<br />)
  if (!(props.name === 'ide')) {
    elements.push(<Input name="lang" type="text" placeholder="language" value={br.lang} />)
    elements.push(<br />)
  }
  elements.push(<button class="button is-primary">Login</button>)
  
  return (
    <Modal class="is-active br-login">
      <form class="container" onSubmit={handleSubmit}>
        {elements}
      </form>
    </Modal>
  )
}

export default Login;



/* 
 *  Login without UI
 */
export const login = (br, ide) => {
	const url = `${br.url}/login?&app=${br.app}&db=${br.db||br.app}&username=${br.user}&password=${br.pass}`
	delete br.pass
	fetch(url, {
		headers: {'Content-Type': 'application/json'}
	})
	.then(res => res.json())
	.then((data) => {
		Object.assign(br, objPick(data, 'usercode,userid,useradm,menu'))
		if (data.err) {
      alert('Login error')
		
		} else if (ide) {
			import('./ide.js')
			.then(module => {
				const Ide = module.default
				render(<Ide br={JSON.stringify(br)} />, document.getElementById('root'))
			})
			.catch(console.log)
		
		} else {
			import('./app.js')
			.then(module => {
				const App = module.default
				render(<App br={JSON.stringify(br)} />, document.getElementById('root'))
			})
			.catch(console.log)
		}
	})
	.catch(console.log)
}




