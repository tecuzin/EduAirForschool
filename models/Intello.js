
"use strict"; 

////////////////////////////Connection for MongoDb//////////////////////////////

var db_connection 	= require('../config/db');

var MongoObjectID 	= require("mongodb").ObjectID;
////////////////////////////Connection for MongoDb//////////////////////////////

var Elastic = require('../models/Elastic');//Model file for Elastic search

var request = require('request');
var cheerio = require('cheerio');






var path 		 	= require('path');
var date			= new Date();






class Intello{


	static verify_if_the_file_name_exist(hashName,Callback){

		db_connection(function(err, db){ 

			if(err){

				console.log(err)

			}else{
 				db.collection("user_file").find({'hashName':hashName}).toArray((err, results)=> { 

		        	if(err){
		        		console.log(err)
		        	}else{

		        		if(results.length==0){

		        			var verdict = true;

			        		Callback(verdict)
		        		}else{
				        	var verdict = false;

			        		Callback(verdict)
		        		}
		        	}
				});
			}
    	});
	}

	
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

						if(content.pages!=undefined || content.type=='image'){

							content.text_extracted	= text_extracted;
							// content.text_extracted	= JSON.parse(JSON.stringify(text_extracted))
						}

						 
						Elastic.add_new_file(content,function  (response) { 
							
							call_back({'statu':'ok','last_inserted_id_on_mongoDb':results.insertedIds[0]})
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


			
	static search(data,Callback){ 

		//First of all, I record the search term
		record_search(data)

		//In wich library should I search
		var library = data.library;

		switch(library){

			case 'wikipedia':

				request(data.protocol+data.ip_server+':'+data.zim_port+'/search?content='+data.zim_wikipedia+'&pattern='+data.term+'&start='+data.start+'&end='+data.end, function (error, response, html) {
  					
  					if (!error && response.statusCode == 200) { 
    					
    					var $ = cheerio.load(html);

    					if($('.header').text().indexOf('No result were found')==-1){ //IF we have results

				        	//1 We get the number of results
					        var total_results = $(".results ul li").length;

					        var all_results = [];

					        for (var i = 0; i < total_results; i++) {

					        	var this_results = [];//Results should be [title,link,cite]

					        	this_results.push($('.results ul li a').eq(i).text())
					        	this_results.push($('.results ul li a').eq(i).attr('href').replace(data.zim_wikipedia,'wp'))
					        	this_results.push($('.results ul li cite').eq(i).text())

					        	all_results.push(this_results)

					        	if(total_results -1==i){ 

					        		var wikipedia = {'search_string':data.term,'all_results':all_results};

					        		////////////we get the start and the end of the pagination///////////////////////////////
					        		var pagination = $('.header').text().replace(/[\r\n]/g, '').split(' ');

					        		pagination = pagination[9];

					        		pagination = pagination.split('-');

					        		var start = pagination[0]*1-1+20;

					        		var end   = pagination[1]*1+20;
					        		////////////we get the start and the end of the pagination///////////////////////////////
					        		
					        		Callback({'statu':'ok','wikipedia':wikipedia,'library':library,'search_string':data.term,'start':start,'end':end})
					        	}
				        	}
				        }else{

				        	Callback({'statu':'fail','library':library,'search_string':data.term,'message':'no_result'})
				       	}

  					}else{

  						Callback({'statu':'fatal_error'})
				    		
				    	console.log(error)
  					}
				});

			break;

			case 'image':
				data.media ='image';
				Elastic.search_these_media(data,function (results) {
					
					Callback({'statu':'ok','results':results,'library':library,'search_string':data.term,'start':data.start+20,'end':data.end+20})
				})
			break;

			case 'audio_video':
				data.media ='audio_video';
				Elastic.search_these_media(data,function (results) {
					
					Callback({'statu':'ok','results':results,'library':library,'search_string':data.term,'start':data.start+20,'end':data.end+20})
				})
			break;

			case 'document':
				data.media='text';
				Elastic.search_these_media(data,function (results) {
					
					Callback({'statu':'ok','results':results,'library':library,'search_string':data.term,'start':data.start+20,'end':data.end+20})
				})
			break;
		}
	}


	static get_sample_image(data,Callback){

		Elastic.get_sample_image(data,function (results) {
					
			Callback(results)
		})	
	}
}


module.exports = Intello;





function record_search (data) {
	
	//If it's a new term ToDo

	//Else, nothing
}



