
$(document).ready(function(){ 

	



	function get_all_files () {
		
		$.ajax({

            url: '/get_all_files',

            type: 'POST',

            processData: false,

            contentType: false,

            dataType: 'json',

            error: function  (err) {
              console.log(err)
            },
            success: function(data){ console.log(data)

            	if(data.statu && data.files){

            		manage_result(data.files)
            	}else{

            		$('.recommended-grids').html('<center><img src="assets/img/new.png" /></center>')
            	}
                
            }
        })
	}
	get_all_files();



	var number_of_files_to_display_at_home_page = 50;
	var index_of_number_of_files_to_display_at_home_page = 0;

	function manage_result (files) {

		if(files.length>0 && index_of_number_of_files_to_display_at_home_page < number_of_files_to_display_at_home_page){

			var rand = files[Math.floor(Math.random() * files.length)]; //We get radom index

			//We display it
			display_this_file(rand)

			//And we remove it
			files.splice(rand, 1)

			//We increment index
			index_of_number_of_files_to_display_at_home_page++

			//And we call the function again
			manage_result(files)
		}
	}


	function display_this_file (file) {

		$('.this_is_loader').remove()//We remove the loading image

		if(file.thumbnail!=undefined){



			var url_thumbnail 	= file.thumbnail.split('private/');

			url_thumbnail		= url_thumbnail[1];

			switch(file.media){

				case 'audio_video':
					var file_length = window.convertTime(file.duration)
				break;

				case 'text':
				 	var file_length =file.pages+' Pages';
				break;

				case 'image':
					var file_length = window.formatBytes(file.size)
				break;
			}
			
			var html ='<div class="col-md-3 resent-grid recommended-grid"><div class="resent-grid-img recommended-grid-img">';
			html	+='<a href="/watch?media='+file.hashName+'"><img src="assets_media/'+url_thumbnail+'" alt="" /></a>';
			html	+='<div class="time small-time"><p class="label label-primary">'+file_length+'</p></div></div>';
			html	+='<div class="resent-grid-info recommended-grid-info video-info-grid">';
			html	+='<h5><a href="/watch?media='+file.hashName+'" class="title">'+file.title+'</a></h5>';
			html	+='<ul><li><p class="author author-info"><a href="#" class="author">'+window.get_user_name(file.user_id)+'</a></p></li>';
			html 	+='<li class="right-list"><p class="views views-info">'+file.view+'</p></li></ul></div></div>';

			$('.recommended-grids').append(html)

			console.log($('.recommended-grid').length % 4)

			if($('.recommended-grid').length % 4 ==0){

				$('.recommended-grids').append('<div class="clearfix"> </div><br>')
			}
		}
	}



	
});
