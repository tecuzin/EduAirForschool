
"use strict"; 
var elasticsearch 	= require('elasticsearch');

//Init elastic search .The Librarian
var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'error'
});

var index_db 	= 'eduair';
var type_bd		= 'file';



class Elastic{

	static add_new_file(content,call_back){ 

		if(content.format=='.pdf'){

			add_pdf_file(content,function  (results) {
				
				call_back(results)
			})
		}else{

			if(content.type=='image'){

				clean_text_extrated (content,function  (content_with_text_cleaned) {

					client.index({ 

				  		index: index_db,

				  		type: 'file',

				  		id:content._id.toString(),
			  
				  		body:content_with_text_cleaned

						},function(err,resp,status) {
			    	
			    			call_back({'statu':'ok','message':resp})
					})
				})
			}else{

				client.index({ 

			  		index: index_db,

			  		type: 'file',

			  		id:content._id.toString(),
		  
			  		body:content

					},function(err,resp,status) {
		    	
		    			call_back({'statu':'ok','message':resp})
				})
			}
		}
	}



	static set_file_description(file_description,Callback){ 

		if(file_description.format=='.pdf'){

			//We process it as a PDf file
			set_file_description_for_pdf (file_description,function  (results) {
				
				Callback({'statu':'success','content':results})
			})
		}else{

			client.update({ 

			  	index: index_db,

			  	type: 'file',

			  	id:file_description._id.toString(),

			  	body:{
			  		doc:{
				  		"title":file_description.title,
				  		"description":file_description.description,
				  		"tags":file_description.tags
			  		},
			  		doc_as_upsert: true
			  	}
		  
			  	

			},function(err,resp,status) {
		    	
		    	if(!err){

		    		Callback({'statu':'success','content':resp})
		    	}else{

		    		Callback({'statu':'fail','message':'Oups! There is problem. Please contact the administrator'})

		    		console.log(err)
		    	}
			})
		}
	}


	static search_on_media_library(term,call_back) {

	}
}




module.exports = Elastic;


//This function is to extract any page of the pdf file
function add_pdf_file (content,Callback) { 

	var finalContent = content;
	var this_is_text = content.text_extracted; 
	var id_file_mongoDB = content._id;
	
	//We loop the number of the pages of the content
	var page_number = 0;

	for (var i = 0; i < this_is_text.length; i++) { 

		page_number++ ;//we increment the page number starting by 1.

		finalContent.text_page = this_is_text[i].trim().replace(/[\r\n]/g, '');

		finalContent.page_number = page_number;

		delete finalContent.text_extracted;

		finalContent.id_file_mongoDB = id_file_mongoDB;

		delete finalContent._id;

		index_this_page(finalContent)

		if(this_is_text.length==i+1){ 

			Callback({'statu':'ok','message':'PDF file of '+page_number+' page(s) indexed'})
		}
		
	};
}


function clean_text_extrated (content,Callback) {
	
	content.text_extracted = content.text_extracted.trim().replace(/[\r\n]/g, ''); //We remove any newline on the text on the image

	Callback(content)
}


function index_this_page (finalContent) { 
	

	client.index({ 

		index: index_db,

		type: 'file',
	  
		body:finalContent

		},function(err,resp,status) {
	    	
	    	if(err){
	    		console.log(err)
	    	}

	})
}


function set_file_description_for_pdf (file_description,Callback) { 
	
	//We select all the pdf files having the same entry "id_file_mongoDB"
	client.search({ 

	  	index: index_db,

	  	type: 'file',

	  	body:{
	  		query:{
	  			'match':{'id_file_mongoDB':file_description._id.toString()}
	  		}
	  	}

		},function(err,response,status) {
	    	
	    	if(!err){

	    		if(response.hits.total>0){ //We loop it

	    			for (var i = 0; i < response.hits.hits.length; i++) {
	    				
	    				//we update document
	    				client.update({ 

						  	index: index_db,

						  	type: 'file',

						  	id:response.hits.hits[i]._id,

						  	body:{
						  		doc:{
							  		"title":file_description.title,
							  		"description":file_description.description,
							  		"tags":file_description.tags
						  		},
						  		doc_as_upsert: true
						  	}
						},function(err,resp,status) {
					    	
					    	if(err){

					    		console.log(err)
					    	}
						})


						if(response.hits.hits.length-1==i){

							Callback({'statu':'success','message':'all pages are perfectly indexed'})
						}
	    			}
	    		}else{

	    			Callback({'statu':'fail','message':'Oups! There is problem. Please contact the administrator'})

	    			console.log(err)
	    		}

	    	}else{

	    		Callback({'statu':'fail','message':'Oups! There is problem. Please contact the administrator'})

	    		console.log(err)
	    	}
	})
}