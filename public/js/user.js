
$(document).ready(function(){ 

	$('.img_user_pic').height($('.marketing_account').height()*2/3)

	$('.contact_me').height($('.marketing_account').height()*2/10)

	$('.mini_pic_user').height($('.marketing_account').height()*1/10)

	$('ul.tabs').tabs();


	function display_tabs (hashName,thumbnail,title,view,file_id,tab) { console.log('eee')
		
		var html ='<tr class="this_file_'+file_id+'"><td><a href="/watch?media='+hashName+'"><img src="'+thumbnail+'">';
		html	+='<p>'+title+'</p></a></td><td><p>'+view+'</p></td><td>';
		html	+='<a href="'+file_id+'" class="delete_this_file"><i class="material-icons left">close</i></a></td></tr>';

		$('#tab_'+tab).append(html)
	}


	window.socket.emit('get_my_file')

	window.socket.on('get_my_file',function  (data) { 

		$('.this_list_progress').remove()
		
		var recent = data.recent;
		var popular= data.popular;

		if(recent.length<0){

			$('#recent,#popular').html('<div class="card-panel red-text text-darken-2">'+$('.user_note').attr('no_file')+'</div>');

		}else{

			for (var i = 0; i < recent.length; i++) {

				var this_entry = recent[i];

				display_tabs(this_entry.fileName,this_entry.thumbnail,this_entry.title,this_entry.view,this_entry.file_id,'recent')

			};

			for (var i = 0; i < popular.length; i++) {
				
				var this_entry = popular[i];

				display_tabs(this_entry.fileName,this_entry.thumbnail,this_entry.title,this_entry.view,this_entry.file_id,'popular')
			};
		}
	})


	$('.delete_this_file').on('click',function  () {
		
		window.socket.emit('delete_file',$(this).attr('href'))
	})

	window.socket.on('delete_file',function  (file_id) {
		
		$('.this_file_'+file_id).fadeOut()
	})



});
