
$(document).ready(function(){ 

	//Put pub in articles
	window.pub_video();

	// //Insert suggestions
	// window.suggestion()

	//Resize video for responsive
	if(window.is_tablet()){ 
		$('video').width($('.video_airedu').width())
	}

	if(window.is_desktop()){
		$('.player').addClass('container');
	}


	

	//Demo ['image';views,'Timestamp,'autor_name_linked','autor','id_autor','subsription_link','number_of_subscriptions','download_link','share_link']
	var infos 	= 
	{
		'image':$('.media_data').attr('fileName'),
		'views':$('.media_data').attr('views'),
		'autor_name_linked':'Epiphany',
		'subsription_link':'essai',
		'number_of_subscriptions':673,
		'download_link':'ici',
		'share_link':'click',
		'timestamp':moment.unix($('.media_data').attr('timestamp')*1/1000).fromNow(),
		'autor':'Gabriel',
		'id_autor':$('.media_data').attr('autor_id'),
		'title':$('.media_data').attr('title')
	}
	var type_media ='video';
	var if_wikipedia = false;
	window.infobox(infos,type_media,if_wikipedia)



	

});
