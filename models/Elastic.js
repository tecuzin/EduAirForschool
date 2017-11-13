
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


	static search_these_media(data,call_back) {

		search_all_media(data,function  (results) {
			
			call_back(results)
		})	
	}


	static get_sample_image(data,call_back) {

		get_sample_image(data,function  (results) {
			
			call_back(results)
		})	
	}

}




module.exports = Elastic;


//This function is to extract any page of the pdf file
function add_pdf_file (content,Callback) { 

	var this_is_text 	= content.text_extracted; 
	var id_file_mongoDB = content._id;

	var body_bulk = [];
	
	//We loop the number of the pages of the content
	var page_number = 0;

	for (var i = 0; i < this_is_text.length; i++) { 

		var finalContent 	=  new Object();

		finalContent.fileName 	= content.fileName;
		finalContent.media 		= content.media;
		finalContent.type 		= content.type;
		finalContent.hashName 	= content.hashName;
		finalContent.thumbnail	= content.thumbnail;
		finalContent.size		= content.size;
		finalContent.pages		= content.pages;
		finalContent.format		= content.format;
		finalContent.create_at	= content.create_at;
		finalContent.user_id	= content.user_id;
		finalContent.view		= content.view;
		finalContent.last_view	= content.last_view;
		finalContent.title		= content.title;
		finalContent.description= content.description;
		finalContent.tags		= content.tags;
		finalContent.text_page	= this_is_text[i].trim().replace(/[\r\n]/g, '').replace(/[^\x21-\x7E]+/g, ' ').replace(/^\s+|\s+$/g, '');
		finalContent.page_number= page_number++;
		finalContent.id_file_mongoDB= id_file_mongoDB;

		delete finalContent.text_extracted; 

		body_bulk.push({index:{}},finalContent);

		if(this_is_text.length==i+1){

			index_bulk_pdf(body_bulk);

			Callback({'statu':'ok','message':'PDF file of '+page_number+' page(s) indexed'})
		}
	}
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



function index_bulk_pdf (body_bulk) { 
	

	client.bulk({ 

		index: index_db,

		type: 'file',
	  
		body:body_bulk

		},function(err,resp,status) {
	    	
	    	if(err){
	    		console.log(err)
	    	}

	})
}





function search_all_media(data,call_back) {
	
	client.search({
	  	index: 	index_db,
	  	type: 	"file",
	  	body:{
	  			size: 20,
    			from: data.start,
    			query:{

			  		bool: {
						must: [
						      {
						        query_string: {
						          	query: data.term,
						          	fields : ["text_page", "title^5","tags^4","description^4"],
              						use_dis_max : true
						        }
						      }
						    ],
						    should: [
						    	{
								    match_phrase: {
	            						"title" : data.term
	        						}
	        					},
        						{
        						fuzzy_like_this: {
							          	like_text: data.term,
							          	fields : ["title"],
							          	max_query_terms:5,
							          	boost:0.5
						        	}
						    	}
						    ]
					}
				},
				filter : {
			        bool : {
			            must : [
			                { term:  { "media": data.media }} 
			            ]
			        }
	        	},
			  	rescore:{
			  		window_size:50,
			  		query:{
			  			rescore_query:{
						    match_phrase : {
            					"title" : data.term
        					}
			  			}
			  		}
	  			} 	
		}
	},function(error, response,status) { 
			
			if (error) {
				console.log(error)
			}else{

				if(data.media=='document'){
					
					keep_search_string_hightLighted(response.hits,function  (results) { 
					
						call_back(results)
					})
				}else{

					call_back(response.hits)
				}
			}
		}
	)
}


function keep_search_string_hightLighted (results,call_back) {

	//je commence la boucle
	var all_results 	= results.hits;
	var final_results 	= new Object();
	final_results 		= all_results;

	for(var i = 0; i < all_results.length; i++) {

		var my_text =  final_results[i]._source.text_page;

		delete final_results[i]._source.text_page;
		
		if(my_text.length>=100){ 

			final_results[i]._source.text_page = my_text.substr(0, 100);

		}else{ 
			final_results[i]._source.text_page = my_text;
		}
		
		if(all_results.length-1==i){

			call_back(final_results)
		}
	}
	
}




function get_sample_image(data,call_back) {
	
	client.search({
	  	index: 	index_db,
	  	type: 	"file",
	  	body:{
	  			size: 5,
    			from: 0,
    			query:{

			  		bool: {
						must: [
						      {
						        query_string: {
						          	query: data.term,
						          	fields : ["text_page", "title^5","tags^4","description^4"],
              						use_dis_max : true
						        }
						      }
						    ],
						    should: [
						    	{
								    match_phrase: {
	            						"title" : data.term
	        						}
	        					},
        						{
        						fuzzy_like_this: {
							          	like_text: data.term,
							          	fields : ["title"],
							          	max_query_terms:5,
							          	boost:0.5
						        	}
						    	}
						    ]
					}
				},
				filter : {
			        bool : {
			            must : [
			                { term:  { "media": 'image' }} 
			            ]
			        }
	        	},
			  	rescore:{
			  		window_size:50,
			  		query:{
			  			rescore_query:{
						    match_phrase : {
            					"title" : data.term
        					}
			  			}
			  		}
	  			} 	
		}
	},function(error, response,status) { 
			
			if (error) {
				console.log(error)
			}else{

				if(data.media=='document'){
					
					keep_search_string_hightLighted(response.hits,function  (results) { 
					
						call_back(results)
					})
				}else{

					call_back(response.hits)
				}
			}
		}
	)
}