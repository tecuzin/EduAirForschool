
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


	static search_on_media_library(term,call_back) {

	}
}




module.exports = Elastic;