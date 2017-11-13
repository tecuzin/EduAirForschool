
$(document).ready(function(){ 

	//Put pub in articles
	window.pub_article()

	//Insert suggestions
	window.suggestion()

	if(window.is_desktop()){
		$('.field').addClass('container');
	}


	$('.suggestion_vid').css('min-height','')
	$('.commentor').css('width','')

	

});
