
"use strict"; 
var fs 	= require('fs');

var path = require("path");

var ffmpeg = require('ffmpeg');

var thumbler = require('video-thumb');

var Mp4Convert = require('mp4-convert');

var  path = require('path');

const md5File = require('md5-file'); //Generate the hash of a file

var crypto = require('crypto'); //Generate a random hash

var exec = require('child_process').exec;																																								

var mime = require('mime');//Get type mime of file

var PDFImage = require("pdf-image").PDFImage;//Get a shoot for a PDF file

var filepreview = require('filepreview');

var textract = require('textract');//To extract text to file

var utf8 = require('utf8');

var Intello = require('../models/Intello');//Model file for Elastic search and database

var temp_directory =path.join(__dirname, '..', 'private/temp/');//Define the temporary directory when a new file is uploaded

var media_library =path.join(__dirname, '..', 'private/');//Define the directory of media library

var logo_watermark =path.join( __dirname, '..','public/img/eduair_watermark.png');

var video_type_out = 'video/mp4';
var audio_type_out = 'audio/mpeg';

var file_type_application = [	'application/pdf' ,
								'application/vnd.ms-powerpoint', //ppt
								'application/vnd.openxmlformats-officedocument.presentationml.presentation',//pptx
								'application/msword' ,//DOC
								'application/vnd.openxmlformats-officedocument.wordprocessingml.document'//docx
								];



class Filer{

	static handelFile(fileUploaded){ 

		var file = fileUploaded.file_path;

		var file_type 		= mime.lookup(file);

		var file_type_mime 	= file_type;

		file_type 			= file_type.split('/');

		var file_extension 	= file_type[1];

		file_type 			= file_type[0];

		switch(file_type){

			case 'video':
				convert_video_to_mp4(fileUploaded,function  (results) {

					Intello.add_new_file(results,function  (response) {
						
						console.log(response)
					})
				})
			break;

			case 'image':
				move_image(fileUploaded,function  (results) {
					
					Intello.add_new_file(results,function  (response) {
						
						console.log(response)
					})
				})
			break;

			case 'audio':
				convert_audio_to_mp3(fileUploaded,function  (results) {
					
					Intello.add_new_file(results,function  (response) {
						
						console.log(response)
					})
				})
			break;

			case 'application':
				if(file_type_application.indexOf(file_type_mime)!=-1){

					if(file_extension=='pdf'){

						move_pdf(fileUploaded,function  (results) {
							
							Intello.add_new_file(results,function  (response) {
						
								console.log(response)
							})
						})
					}else{ 
						DOCx_and_ppt_2_pdf(fileUploaded,function  (results) {
						
							Intello.add_new_file(results,function  (response) {
						
								console.log(response)
							})
						})
					}
				}
			break;
		}
	}
		
}


module.exports = Filer;


	///////////////////////////////////////////////////Converter//////////////////////////////////////////////////////////

	function PDF_2_image(file,page,Callback){//Page is the number of the page.

		var pdfImage = new PDFImage(file);

		pdfImage.convertPage(page).then(function (imagePath) {

			base64_encode(imagePath,function  (results) {
				
				if(results.error){

					Callback(results.error)
				}else{

					Callback(results.Buffer64)
				}
			})
		});
	}





	function DOCx_and_ppt_2_pdf(fileUploaded,Callback){ 

		var file = fileUploaded.file_path;

		//Is it word or ppt file?
		if(path.extname(file).indexOf('doc')!=-1){

	    	var right_folder 		= 'word';
		}else{
	    	var right_folder 		= 'ppt';
		}

		exec('libreoffice --invisible --convert-to pdf '+file,function(error, stdout, stderr) {

			var file_converted_in_root 	= path.basename(file,path.extname(file))+'.pdf';

			var real_fileName 			= fileUploaded.file_name;

			var final_file 				= media_library+right_folder+'/pdf/'+path.basename(fileUploaded.file_path,path.extname(fileUploaded.file_path))+'.pdf';

			var source_pdf 				= fs.createReadStream(file_converted_in_root);

    		var destination_pdf 		= fs.createWriteStream(final_file);

    		source_pdf.pipe(destination_pdf,{ end: false });

			source_pdf.on("end", function(){

			    fs.unlinkSync(file_converted_in_root);//I delete the old file in the root of eduair

			    var source_doc 			= fs.createReadStream(file);

	    		var destination_doc 	= fs.createWriteStream(media_library+right_folder+'/'+path.basename(final_file,path.extname(final_file))+path.extname(file));

	    		source_doc.pipe(destination_doc,{ end: false });

				source_doc.on("end", function(){

				    fs.unlinkSync(file);//I delete the old file

				    generate_thumbnail(media_library+right_folder+'/'+path.basename(final_file,path.extname(final_file))+path.extname(file),function  (results) {
				    	
				    	exec('pdfinfo '+final_file+' | grep ^Pages: ',function(error, stdout, stderr) {

				    		extract_text(final_file,function  (text_extracted) {
			    	
				    			Callback({'fileName':real_fileName,'hashName':path.basename(final_file,path.extname(final_file)),'thumbnail':results,'size':getFilesizeInBytes(final_file),'pages':stdout.replace(/\n|\r/g, "").replace(/ /g,'').replace('Pages:','')*1,'format':path.extname(final_file),'format_initial':path.extname(file),'text_extracted':text_extracted})
			    			})
				    	})
				    }) 
				})
			})

      		if(stderr){
				console.log('Error convertion WORD to PDF: ' + stderr)
			}

		    
		    if (error !== null) {
		        console.log('exec error: ' + error);
		    }
		})
	}



	function convert_video_to_mp4 (fileUploaded,call_back_json_metada){

		var real_fileName = fileUploaded.file_name;

		var temp_file 	= fileUploaded.file_path;

		var final_file	= media_library+'video/'+path.basename(fileUploaded.file_path,path.extname(fileUploaded.file_path))+'.mp4' ;

		//Convert To MP4 if it is not a mp4 video
		var video_type 	= mime.lookup(temp_file);

		if(video_type!=video_type_out && video_type.indexOf('video')!=-1){ //We verify the type mime of video file

			var convert = new Mp4Convert(temp_file, final_file);

			// convert.on('progress', function(p) {
   //  			console.log('Progress', p);///////////////////////////////////////////////////////////////////////////////////////////
			// });

			convert.on('done', function() {
			    
				//Get the thumbnail of the video
				generate_thumbnail(final_file,function  (thumbnail) {
					
					//We get the duration of video
					exec("ffprobe "+final_file+" -show_format 2>&1 | sed -n 's/duration=//p'", function(err, stdout, stderr) {
						
						if(!err){

							//Delete the original video if is is not a MP4 video
							fs.unlinkSync(temp_file);

							call_back_json_metada({'fileName':real_fileName,'hashName':path.basename(final_file,path.extname(final_file)),'duration':stdout.replace('\n',''),'thumbnail':thumbnail,'size':getFilesizeInBytes(final_file),'format':path.extname(final_file),'format_initial':path.extname(temp_file)});
						}else{
							console.log('err')
						}
					});
				})
			});
			convert.start();
		
		}else{ 
			//It is not a video, I send an error
			if(video_type.indexOf('video')==-1){

				//Delete the original video if is is not a MP4 video
				fs.unlinkSync(temp_file);

				call_back_json_metada({'duration':false,'thumbnail':false,'error':'this_file_is_not_a_video'});
			}else{

				//If is a mp4 video,I just move the file
				fs.rename(temp_file, final_file, function (err) {
			        
			        if (err){

			            console.log(err)
			        }else{

			        	//Get the thumbnail of the video
			        	generate_thumbnail(final_file,function  (thumbnail) {
			        		
				        	//We get the duration of video
							exec("ffprobe "+final_file+" -show_format 2>&1 | sed -n 's/duration=//p'", function(err, stdout, stderr) {
								
								if(!err){

									call_back_json_metada({'fileName':real_fileName,'hashName':path.basename(final_file,path.extname(final_file)),'duration':stdout.replace('\n',''),'thumbnail':thumbnail,'size':getFilesizeInBytes(final_file),'format':path.extname(final_file),'format_initial':path.extname(temp_file)});
								}else{
									console.log('err')
								}
							});
			        	})
			        }
	    		});
			}
		}
	}



	function convert_audio_to_mp3 (fileUploaded,call_back_json_metada){ 

		var real_fileName 	= fileUploaded.file_name;

		var temp_file 		= fileUploaded.file_path;

		var file 			= fileUploaded.file_path;

		var final_file		= media_library+'audio/'+path.basename(fileUploaded.file_path,path.extname(fileUploaded.file_path))+'.mp3' ;

		//Convert To MP3 if it is not a mp3 audio
		var audio_type 	= mime.lookup(temp_file); 

		if(audio_type!=audio_type_out && audio_type.indexOf('audio')!=-1 && path.basename(file,path.extname(file))!='mp3'){ //We verify the type mime of audio file

			//We get the duration of video
			exec('ffmpeg -i '+file+' -acodec copy '+final_file+'', function(err, stdout, stderr) {
						
				if(!err){

					//Delete the original audio if is is not a MP3 audio
					fs.unlinkSync(temp_file);

					call_back_json_metada({'fileName':real_fileName,'hashName':path.basename(final_file,path.extname(final_file)),'duration':stdout.replace('\n',''),'size':getFilesizeInBytes(final_file),'format':path.extname(final_file),'format_initial':path.extname(temp_file)});
				}else{
					console.log(err)
				}
			});
		
		}else{ 
			//It is not a audio, I send an error
			if(audio_type.indexOf('audio')==-1){

				//Delete the original audio if is is not a MP3 audio
				fs.unlinkSync(temp_file);

				call_back_json_metada({'duration':false,'thumbnail':false,'error':'this_file_is_not_a_audio'});
			}else{

				//If is a mp3 audio,I just move the file
				fs.rename(temp_file, final_file, function (err) {
			        
			        if (err){

			            console.log(err)
			        }else{

			        	//We get the duration of audio
							exec("ffprobe "+final_file+" -show_format 2>&1 | sed -n 's/duration=//p'", function(err, stdout, stderr) {
								
								if(!err){

									call_back_json_metada({'fileName':real_fileName,'hashName':path.basename(final_file,path.extname(final_file)),'duration':stdout.replace('\n',''),'size':getFilesizeInBytes(final_file),'format':path.extname(final_file),'format_initial':path.extname(temp_file)});
								}else{
									console.log(err)
								}
							});
			        }
	    		});
			}
		}
	}






	function move_image (fileUploaded,Callback) {

		var file = fileUploaded.file_path;

		var real_fileName 	= fileUploaded.file_name;

		//final_file = FileName_timestamp_generatedHash.jpg
		var final_file	= media_library+'image/'+path.basename(fileUploaded.file_path,path.extname(fileUploaded.file_path))+'.'+path.extname(file) ;
		
		fs.rename(file, final_file, function (err) {
			        
			if (err){

			    console.log(err)
			}else{

			    //Get the thumbnail of the video
			    generate_thumbnail(final_file,function  (thumbnail) {

			    	extract_text(final_file,function  (text_extracted) {
			    	
						Callback({'fileName':real_fileName,'hashName':path.basename(final_file,path.extname(final_file)),'thumbnail':thumbnail,'size':getFilesizeInBytes(final_file),'format':path.extname(final_file),'text_extracted':text_extracted})
			    	})
			   	})
			}
	    })
	}





	function move_pdf (fileUploaded,Callback) {

		var file 			= fileUploaded.file_path;

		var real_fileName 	= fileUploaded.file_name;

		//final_file = FileName_timestamp_generatedHash.jpg
		var final_file	= media_library+'pdf/'+path.basename(fileUploaded.file_path,path.extname(fileUploaded.file_path))+path.extname(file) ;
		
		fs.rename(file, final_file, function (err) {
			        
			if (err){

			    console.log(err)
			}else{

			    //Get the thumbnail of the video
			    generate_thumbnail(final_file,function  (thumbnail) {

			    	exec('pdfinfo '+final_file+' | grep ^Pages: ',function(error, stdout, stderr) {

			    		extract_text(final_file,function  (text_extracted) {
			    	
							Callback({'fileName':real_fileName,'hashName':path.basename(final_file,path.extname(final_file)),'thumbnail':thumbnail,'size':getFilesizeInBytes(final_file),'pages':stdout.replace(/\n|\r/g, "").replace(/ /g,'').replace('Pages:','')*1,'format':path.extname(final_file),'text_extracted':text_extracted})
			    		})
				    })
			 	})
			}
	    });
	}
	///////////////////////////////////////////////////Converter//////////////////////////////////////////////////////////






	///////////////////////////////////////////Utilities//////////////////////////////////////////////////////////////////////

	function extract_text(file,Callback){

		textract.fromFileWithPath(file,function( error, text ) {
  			
			if (error) {

			    console.log('Error extracting text from : '+path.basename(file)+' ' + error);
			    
			    Callback('error')
			}else{

				Callback(utf8.encode(text))
			}
		})
	}


	function watermark_image(file,Callback){

		var command = [
		    'composite',
		    '-dissolve', '50%',
		    '-gravity', 'center', 
		    '-quality', 100,
		    logo_watermark,
		    file,
		    file
		];

		exec(command.join(' '), function(err, stdout, stderr) {
    		
    		Callback('OK')
		});
	}




	///////////////////////////////////////////Utilities//////////////////////////////////////////////////////////////////////









	function compresse_image(folder,Callback){

		exec('jpegoptim '+folder+'/*.jpg', function(error, stdout, stderr) {

			Callback('done')


			if(stderr){
				console.log('Error convertion PDF to image: ' + stderr)
			}
						    
			if (error !== null) {
			  	console.log('exec error: ' + error);
			}
		});
	}




	// function to encode file data to base64 encoded string
	function base64_encode(file,Callback) {

	    // read binary data
	    fs.readFile(file, function read(err, data) {
		    
		    if (err) {

		    	console.log(err)

		        Callback({'error':'404'})
		    }else{
		    	// convert binary data to base64 encoded string
	   			Callback( {'Buffer64':new Buffer(bitmap).toString('base64'),'error':false})

	   			fs.unlinkSync(file);//We delete the file
		    }
  
		});
	}



	function generate_hash (){

		var current_date = (new Date()).valueOf().toString();
		var random = Math.random().toString();
		return crypto.createHash('sha1').update(current_date + random).digest('hex');
	}





	function generate_thumbnail(file,Callback){

		var file_extention = path.extname(file);
		var this_file;

		switch(file_extention){

			case '.pdf':
				this_file = 'pdf';
			break;

			case '.mp4':
				this_file = 'video';
			break;

			case '.doc':
			case '.docx':
				this_file = 'word';
			break;

			case '.ppt':
			case '.pptx':
				this_file = 'ppt';
			break;

			case '.jpg':
			case '.png':
			case '.png':
			case '.jpeg':
				this_file = 'image';
			break;
		}

		setTimeout(function  () {
			
			var destination = media_library+this_file+'/thumbnails/'+path.basename(file,path.extname(file))+'.png';

			filepreview.generate(file,destination, function(error) {
			    
			    if (error) {
			      	return console.log(error);
			    }else{

			    	Callback(destination)
			    }
	    		
	  		});
		},200)
	}



	function getFilesizeInBytes(filename) {

	    const stats = fs.statSync(filename)

	    const fileSizeInBytes = stats.size;

	    return fileSizeInBytes;
	}