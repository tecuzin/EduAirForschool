
$(document).ready(function(){ 

	//Put pub in articles
	window.pub_video();


	
	if(window.is_desktop()){
		$('.player').addClass('container');
	}

	$('.img_target').attr('width','100%')


	

	//Demo ['image';views,'Timestamp,'autor_name_linked','autor','id_autor','subsription_link','number_of_subscriptions','download_link','share_link']
	var infos  =
	{
		'image':$('.media_data').attr('fileName'),
		'views':$('.media_data').attr('views')+' <i class="material-icons">visibility</i>',
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
	var type_media ='pdf';
	var if_wikipedia = false;
	window.infobox(infos,type_media,if_wikipedia)



	$('.my_pic_comment').attr('src',window.get_user_pic('user_id')) //dipsplay picture user side of of comment

	window.get_file_comments($('.media_data').attr('MongoDbFileId'))

	window.socket.emit('get_suggestion',$('.media_data').attr('title'))

	

	

	//We display the number of page
	function display_page_number () { 
		
		var pages = $('.media_data').attr('pages')*1;

		for (var i = 2; i < pages; i++) { 

			$('.page_pdf_display').append('<div class="has_it_page_'+i+' z-depth-4 my_pdf_page" response="no" style="height: '+$('.has_it_page_1').height()+'px;background-color:#FFFFFF;" page="'+i+'"></div><br>')
		};

		if($('.media_data').attr('pages')*1==i){ 

			//Loading page by page
			$('.my_pdf_page').on('scrollSpy:enter', function() { console.log($(this).attr('response'))
		
				//We verify if the div as a page
				if($(this).attr('response')=='no'){ //If not

					//We get the page
					take_image_pdf_page (window.user_id,$(this).attr('page'),$('.media_data').attr('fileName'))

					//We display the loader inside the div to wait the page
					$(this).html('<center>'+ $('.loader_page').html()+'</center>')
				}
			})

			$('.my_pdf_page').scrollSpy();
		}
	}



	

	



	//We display the first page
	take_image_pdf_page(window.user_id,1,$('.media_data').attr('fileName'))
	$('.has_it_page_1').html('<center>'+ $('.loader_page').html()+'</center>')


	function take_image_pdf_page (user_id,page,file_hashName) { 
		
		window.socket.emit('get_pdf_page',{'user_id':user_id,'page':page,'hashName':file_hashName})
	}


	display_other_page = false;

	window.socket.on('get_pdf_page',function (page) { //{image,page}

		var img = $('<img />', { 
			class:'page_'+page.page,
			src: page.image,
			width: "100%"
		});
		
		$('.has_it_page_'+page.page).html(img)
		$('.has_it_page_'+page.page).attr('response','yes')

		if(display_other_page==false){ //We wait a time to display other pages

			setTimeout(function  () {//We display pages template afer a small time based on the first page
		
				display_page_number()
			},1000)

			display_other_page = true;
		}
	})




});
