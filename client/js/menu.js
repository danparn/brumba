/*
 * Brumba
 *
 * © 2012-2014 Dan Parnete
 * Dual licensed under the MIT and GPL licenses.
*/

function accordionMenu( callback ) {
	$('.accordion ul li[data-item]').addClass('menu-item')
	
	var submenu = $('.accordion>li>ul')
		, head = $('.accordion>li>a')
		, inter = $('.accordion ul li ul')
		, interhead = inter.parent().find('>a').addClass('inter-menu')
	
	head.on('click', function(ev) {
		ev.preventDefault()
		if ( !$(this).hasClass('active') ) {
			submenu.slideUp(0)
			$(this).next().stop(true,true).slideToggle(0)
			head.removeClass('active')
			$(this).addClass('active')
		}
	})
	
	interhead.on('click', function(ev) {
		ev.preventDefault()
		if ( !$(this).hasClass('active') ) {
			inter.slideUp(0)
			$(this).next().stop(true,true).slideToggle(0)
			interhead.removeClass('active')
			$(this).addClass('active')
		}
	})

	$('.accordion li[data-item]').click( function() {
		$('.accordion li.selected-menu').removeClass('selected-menu')
		$(this).addClass('selected-menu')
		callback( $(this).attr('data-item') )
	})
}