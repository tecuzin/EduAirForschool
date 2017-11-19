
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

				client.index({ 

			  		index: index_db,

			  		type: 'file',

			  		id:results.id_file_mongoDB.toString(),
		  
			  		body:results

					},function(err,resp,status) {

						if(err){
							console.log(err)
							call_back({'statu':'fail'})
						}else{
							call_back({'statu':'ok','message':'PDF file of '+results.pages+' page(s) indexed'})
						}
				})
			})
		}else{

			if(content.type=='image'){

				clean_text_extrated (content,function  (content_with_text_cleaned) {console.log(content_with_text_cleaned)

					content.id_file_mongoDB = content._id;
					delete content._id;

					client.index({ 

				  		index: index_db,

				  		type: 'file',

				  		id:content.id_file_mongoDB.toString(),
			  
				  		body:content_with_text_cleaned

						},function(err,resp,status) { 

							if(err){
								console.log(err)
								call_back({'statu':'fail'})
							}else{
								call_back({'statu':'ok','message':resp})
							}
					})
				})
			}else{

				content.id_file_mongoDB = content._id;
				delete content._id;

				client.index({ 

			  		index: index_db,

			  		type: 'file',

			  		id:content.id_file_mongoDB.toString(),
		  
			  		body:content

					},function(err,resp,status) {
		    	
		    			if(err){
		    				console.log(err)
		    				call_back({'statu':'fail'})
							
						}else{
							call_back({'statu':'ok','message':resp})
						}
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



	static get_suggestion_media(search_string,Callback){

		get_suggestion_media(search_string,function  (results) {
			
			Callback(results)
		})
	}

}




module.exports = Elastic;


//This function is to extract any page of the pdf file
function add_pdf_file (content,Callback) {

	var finalContent 	=  new Object(); 

	finalContent.id_file_mongoDB 	= content._id;
	finalContent.text_page			= content.text_extracted;
	finalContent.fileName 			= content.fileName;
	finalContent.media 				= content.media;
	finalContent.type 				= content.type;
	finalContent.hashName 			= content.hashName;
	finalContent.thumbnail			= content.thumbnail;
	finalContent.size				= content.size;
	finalContent.pages				= content.pages;
	finalContent.format				= content.format;
	finalContent.create_at			= content.create_at;
	finalContent.user_id			= content.user_id;
	finalContent.view				= content.view;
	finalContent.last_view			= content.last_view;
	finalContent.title				= content.title;
	finalContent.description		= content.description;
	finalContent.tags				= content.tags;

	client.create({
	  	index: 'myindex',
	  	type: 'mytype',
	  	id: '1',
	  	body: {
	    	title: 'Test 1',
	    	tags: ['y', 'z'],
	    	published: true,
	    	published_at: '2013-01-01',
	    	counter: 1
	  	}
	}, function (error, response) {
	  // ...
	});

	Callback(finalContent)

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
        							multi_match : {  
        								fields : ["title"],
        								query : data.term,
        								fuzziness : "AUTO",
        								boost:0.5
        							}
						    	}
						    ],
						    filter: [
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

				call_back(response.hits)
			}
		}
	)
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
        							multi_match : {  
        								fields : ["title"],
        								query : data.term,
        								fuzziness : "AUTO",
        								boost:0.5
        							}
						    	}
						    ],
						    filter: [
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

				call_back(response.hits)
			}
		}
	)
}


function get_suggestion_media (search_string,Callback) { 
	
	client.search({
	  	index: 	index_db,
	  	type: 	"file",
	  	body:{
	  			size: 20,
    			from: 0,
    			query:{

			  		bool: {
						must: [
						      {
						        query_string: {
						          	query: search_string,
						          	fields : ["title^5","tags^4","description^4"],
              						use_dis_max : true
						        }
						      }
						    ],
						    should: [
						    	{
								    match_phrase: {
	            						"title" : search_string
	        						}
	        					},
        						{
        							multi_match : {  
        								fields : ["title"],
        								query : search_string,
        								fuzziness : "AUTO",
        								boost:0.5
        							}
						    	}
						    ]
					}
				},
			  	rescore:{
			  		window_size:50,
			  		query:{
			  			rescore_query:{
						    match_phrase : {
            					"title" : search_string
        					}
			  			}
			  		}
	  			} 	
		}
	},function(error, response,status) { 
			
			if (error) {
				console.log(error)
			}else{

				Callback(response.hits)
			}
		}
	)
}