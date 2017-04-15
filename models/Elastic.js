
"use strict"; 
var elasticsearch 	= require('elasticsearch');

//Init elastic search .The Librarian
var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});





class Elastic{

	static add_user (content,call_back){

		var this_user = content.ops[0];

		client.hmset('user:'+this_user._id, content.ops[0],(err, reply)=>{
		 	content.user_form_pass	= undefined;
		 	content.is_connect		= undefined;
			call_back(content)

		 	client.expire('user:'+this_user._id, TTL_session); 
		});
	}
}


module.exports = Elastic;