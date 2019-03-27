/*
 * Brumba
 *
 * © 2012-2016 Dan Parnete
 * Dual licensed under the MIT and GPL licenses.
*/

$(function() {
	if ( bowser.msie ) {
		$('body').empty()
		alert('Internet Explorer not supported.\nPlease use Google Chrome or Mozilla Firefox.')
		return
	}
	
	var app = $('#app')
		, db = $('#db')
		, user = $('#user')
		, pass = $('#password')
		, lang = $('#lang')
		, tips = $('.validateTips')
		, ide = $('.idelogin').length > 0

	function updateTips( t ) {
		tips.text(t).addClass('ui-state-highlight')
		setTimeout(function() {
			tips.removeClass('ui-state-highlight', 1500);
		}, 500);
	}

	function checkRegexp( o, regexp, n ) {
		if ( !(regexp.test(o.val())) ) {
			o.addClass('ui-state-error')
			updateTips(n)
			return false
		} else {
			return true
		}
	}
	
	$('#dialog-form').dialog({
		autoOpen: true,
		height: 400,
		width: 350,
		modal: true,
		buttons: {
			'Login': function() {
				var bValid = true
					, s = ' may consist of a-z, 0-9, underscores, begin with a letter.'

				bValid = bValid && checkRegexp(app, /^[a-z]([0-9a-z_-])+$/i, 'Application' + s);
				bValid = bValid && checkRegexp(db, /^[a-z]([0-9a-z_-])+$/i, 'Database' + s);
				bValid = bValid && checkRegexp(user, /^[a-z]([0-9a-z_.])+$/i, 'Username' + s);
				// From jquery.validate.js (by joern), contributed by Scott Gonzalez: http://projects.scottsplayground.com/email_address_validation/
				bValid = bValid && checkRegexp(pass, /^.{6,16}$/, 'Password from 6 to 16 chars');
//lower- and upper-case characters, numbers, and punctuation marks

				if ( bValid ) {
					if ( localStorage ) {
						localStorage.setItem('br.app', app.val())
						if ( db.val() ) localStorage.setItem('br.db', db.val())
						localStorage.setItem('br.username', user.val())
						if ( typeof lang.val() != 'undefined' ) localStorage.setItem('br.lang', lang.val())
						sessionStorage.setItem('br.app', app.val())
						sessionStorage.setItem('br.db', db.val())
						sessionStorage.setItem('br.username', user.val())
						sessionStorage.setItem('br.lang', lang.val())
					}
					$(this).dialog('close');
					
					var par = {
							app: app.val(),
							db: (ide) ? app.val() : db.val(),
							username: user.val(),
							password: sha256_digest(pass.val())
						}
					$.ajax({
						url: '/login?' ,
						timeout: 10000,
						data: par,
						success: function(data) {
							if ( data.usercode ) {
								sessionStorage.setItem('br.usercode', data.usercode)
								sessionStorage.setItem('br.userid', data.userid)
								sessionStorage.setItem('br.useradm', data.useradm)
								sessionStorage.setItem('br.menu', filterMenu(data.menu))
								window.location = (ide) ? '/ide.html' : '/default.html'
							} else {
								$('body').html('<H1>Login error</H1>')
							}
						}
					})
				}
			}
		}
	})
	
	if ( localStorage ) {
		app.val(localStorage.getItem('br.app'))
		db.val(localStorage.getItem('br.db'))
		user.val(localStorage.getItem('br.username'))
		lang.val(localStorage.getItem('br.lang'))
	}

	$('#password').focus()

	var pressed = false
	$('form *').keypress(function(e) {
		if ( !pressed && ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) ) {
			pressed = true
			$('.ui-button-text-only').click()
		}
	})
})



function filterMenu( menu ) {
	var m = $(menu)
		, done = false
	while ( !done ) {
		done = true
		m.find('li').each( function() {
			var el = $(this)
			if ( !el.attr('data-item') && el.find('li').length == 0 ) {
				el.remove()
				done = false
			}
		})
	}
	return $('<div>').append(m.clone()).html()
}

