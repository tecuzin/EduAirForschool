
$(document).ready(function(){ 

	//Put pub in articles
	window.pub_article()


	if(window.is_desktop()){
		$('.field').addClass('container');
	}


	$('.suggestion_vid').css('min-height','')
	$('.commentor').css('width','')


	window.socket.emit('get_suggestion',$('title').text())
	

	window.socket.on('get_suggestion',function  (data) { 

		//display_suggestion(title,url,description,first_letter,image,file_length,view,from,type)

		if(data.media.total!=0 || data.wikipedia.length!=0){

			var media_data = data.media.hits;
		
			for (var i = 0; i < media_data.length; i++) {

				switch(media_data[i]._source.media){

					case 'audio_video':
						var file_length = window.convertTime(media_data[i]._source.duration)
					break;

					case 'text':
					 	var file_length = media_data[i]._source.page_number+'/'+ media_data[i]._source.pages+' Pages';
					break;

					case 'image':
						var file_length = window.formatBytes(media_data[i]._source.size)
					break;
				}

				var url_thumbnail 	= media_data[i]._source.thumbnail.split('private/');
		    	url_thumbnail		= url_thumbnail[1];

				window.display_suggestion(media_data[i]._source.title,media_data[i]._source.hashName,media_data[i]._source.description,'',url_thumbnail,file_length,media_data[i]._source.view,'','media')
			}


			for (var i = 1; i < data.wikipedia.length; i++) {

				window.display_suggestion(data.wikipedia[i][0],data.wikipedia[i][1],data.wikipedia[i][2],data.wikipedia[i][0].charAt(0),'','','','','wikipedia')
			}

		}else{

			$('.suggestion,.suggestion_vid').hide()
			$('.suggestion,.suggestion_vid').removeClass('s12 m4 l4')

			$('.field').removeClass('s12 m8 l8')
			$('.field').addClass('s12 m12 l12')
		}
		
	})



	// var type_file =['wikipedia','file'];

	// function demo () {
	// 	for (var i = 0; i <10; i++) {

	// 		var title = 'Bellow to generate a number to send to your corre dhhdh';
	// 		var description ='Payclass truncate to the tag which  ss truncate to the tag which conta ss truncatjdjjddhhd dhhddgd dggd gdgd';
	// 		var first_letter = 'T';
	// 		var image = 'image.jpg';
	// 		var file_length ='23 636';
	// 		var view = '34M';
	// 		var from ='Il y a 2 ans';
			
	// 		var type = type_file[Math.floor((Math.random() * 2) + 0)];
	// 		if(type=='wikipedia'){
	// 			display_suggestion(title,description,first_letter,false,file_length,view,from,type)

	// 		}else{
	// 			display_suggestion(title,description,false,image,file_length,view,from,type)
	// 		}
	// 	};
	// }
	

});
