
"use strict"; 
var elasticsearch 	= require('elasticsearch');

//Init elastic search .The Librarian
var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});

var index_db 	= 'eduair';
var type_bd		= 'file';



class Elastic{

	static add_new_file(content,call_back){

		client.index({ 

		  	index: index_db,

		  	type: 'file',

		  	id:content._id.toString(),
	  
		  	body:content

		},function(err,resp,status) {
	    	
	    	call_back(resp)

		})
	}


	static set_file_description(file_description,Callback){

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


	static search_on_media_library(term,call_back) {

	}
}




module.exports = Elastic;