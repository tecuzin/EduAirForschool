
"use strict"; 

////////////////////////////Connection for MongoDb//////////////////////////////

var db_connection 	= require('../config/db');

var MongoObjectID 	= require("mongodb").ObjectID;
////////////////////////////Connection for MongoDb//////////////////////////////

var Elastic = require('../models/Elastic');//Model file for Elastic search






var path 		 	= require('path');
var date			= new Date();






class Intello{

	
	static add_new_file (content,call_back){ 

		db_connection(function(err, db){ 

			if(err){

				console.log(err)

	        	call_back({'statu':'problem','message':'fatal_error in db_connection'})

			}else{
				var text_extracted 			= content.text_extracted;
				content.create_at 			= date.getTime();
				content.user_id				= 'anonyme';
				content.view 				= 0;
				content.last_view			= 0;
				content.text_extracted 		= null;
 				
			    db.collection("user_file").insert(content,(err, results)=> {

					if(err){

						console.log(err)

					} else{

						content 	= results.ops[0];

						console.log(content.pages)
						console.log(content)

						if(content.pages!=undefined){

							content.text_extracted	= JSON.parse(JSON.stringify(text_extracted))
						}

						 

						Elastic.add_new_file(content,function  (response) {
							
							call_back({'statu':'ok','results':response})
						})
					}
				})
			}
    	})
	}





	static set_file_view (content,call_back){ 

		db_connection(function(error, db){ 

			if(error){

				console.log(error)

	        	call_back({'statu':'problem','message':'fatal_error in db_connection'})

			}else{
				var objToFind     = { _id: new MongoObjectID(content.file_id) }; // Objet qui va nous servir pour effectuer la recherche

				db.collection("user_file").update(objToFind,{ $set: {last_view: date.getTime()}},{ $inc: { view: 1 } },(error,results)=>{

					if(error){
		        		console.log(error)

	        			call_back({'statu':'problem','message':'file no inserted'})

		        	}else{

		        		call_back({'statu':results})
		        	}
				})
			}
    	});
	}




	static get_file (content,call_back){ 

		db_connection(function(err, db){ 

			if(err){

				console.log(err)

	        	call_back({'statu':'problem'})

			}else{
				var objToFind     = { _id: new MongoObjectID(content.file_id) }; // Objet qui va nous servir pour effectuer la recherche
						
				db.collection("user_file").findOne(objToFind, function(error, result) {
		    		
		    		if (error) {
		    			console.log(error)

		    			call_back({'statu':'problem','message':'I have a problem to get file'})
		    		}else{
		    			call_back(result)
		    		}
				});
			}
    	});
	}




	static delete_file (content,call_back){ 

		db_connection(function(err, db){ 

			if(err){

				console.log(err)

	        	call_back({'statu':'problem'})

			}else{

				db.collection('user_file', {}, function(err, file) {

			        file.remove({_id: ObjectID(content.file_id)}, function(err, result) {

			            if (err) {
			                console.log(err);

		    				call_back({'statu':'problem','message':'I have a problem to delete file on database'})

			            }else{
			            	call_back(result);
			            }
			        });
    			});
    		}
    	});
	}
}


module.exports = Intello;