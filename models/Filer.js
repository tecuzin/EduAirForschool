
"use strict"; 
var fs 	= require('fs');

var path = require("path");

var ffmpeg = require('ffmpeg');

var thumbler = require('video-thumb');

var Mp4Convert = require('mp4-convert');

var  path = require('path');

var mime = require('mime'); //Get the type mime of file

const md5File = require('md5-file'); //Generate the hash of a file

var crypto = require('crypto'); //Generate a random hash

var exec = require('child_process').exec;

var mime = require('mime');//Get type mime of file

var PDFImage = require("pdf-image").PDFImage;//Get a shoot for a PDF file

var filepreview = require('filepreview');

var textract = require('textract');//To extract text to file

var temp_directory =path.join(__dirname, '..', 'private/temp/');//Define the temporary directory when a new file is uploaded

var media_library =path.join(__dirname, '..', 'private/');//Define the directory of media library

var logo_watermark =path.join( __dirname, '..','public/img/eduair_watermark.png');

var video_type_out = 'video/mp4';



class Filer{

	///////////////////////////////////////LeeConverter//////////////////////////////////////////////////////////////////////////////

	static convert_video_to_mp4 (file,call_back_json_metada){

		var temp_file 	= file;

		var final_file	=media_library+'video/'+path.basename(file,path.extname(file))+'.mp4' ;

		//Convert To MP4 if it is not a mp4 video
		var video_type = mime.lookup(temp_file);

		if(video_type!=video_type_out && video_type.indexOf('video')!=-1){ //We verify the type mime of video file

			var convert = new Mp4Convert(temp_file, final_file);

			convert.on('progress', function(p) {
    			// console.log('Progress', p);///////////////////////////////////////////////////////////////////////////////////////////
			});

			convert.on('done', function() {
			    
				//Get the thumbnail of the video
				generate_thumbnail(final_file,function  (thumbnail) {
					
					//We get the duration of video
					exec("ffprobe "+final_file+" -show_format 2>&1 | sed -n 's/duration=//p'", function(err, stdout, stderr) {
						
						if(!err){

							//Delete the original video if is is not a MP4 video
							fs.unlinkSync(temp_file);

							call_back_json_metada({'duration':stdout.replace('\n',''),'thumbnail':thumbnail});
						}else{
							console.log('err')
						}
					});
				})
			});
			convert.start();
		
		}else{ 
			//It is not a video, I send an error
			if(video_type.indexOf('video')!=-1){

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

									//Delete the original video if is is not a MP4 video
									fs.unlinkSync(temp_file);

									call_back_json_metada({'duration':stdout.replace('\n',''),'thumbnail':thumbnail});
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






	static DOCx_and_ppt_2_pdf(file,Callback){

		//Is it word or ppt file?
		if(path.basename(file,path.extname(file)).indexOf('doc')!=-1){

	    	var right_folder 		= 'word';
		}else{
	    	var right_folder 		= 'ppt';
		}

		exec('libreoffice --invisible --convert-to pdf '+file,function(error, stdout, stderr) {

			var file_converted_in_root = path.basename(file,path.extname(file))+'.pdf';

			var final_file = media_library+right_folder+'/pdf/'+path.basename(file,path.extname(file))+'.pdf';

			var source_pdf 			= fs.createReadStream(file_converted_in_root);

    		var destination_pdf 	= fs.createWriteStream(final_file);

    		source_pdf.pipe(destination_pdf,{ end: false });

			source_pdf.on("end", function(){

			    fs.unlinkSync(file_converted_in_root);//I delete the old file in the root of eduair

			    var source_doc 			= fs.createReadStream(file);

	    		var destination_doc 	= fs.createWriteStream(media_library+right_folder+'/'+right_folder+'/'+path.basename(file));

	    		source_doc.pipe(destination_doc,{ end: false });

				source_doc.on("end", function(){

				    fs.unlinkSync(file);//I delete the old file 

				    Callback(final_file)
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



	static PDF_2_image(file,page,Callback){//Page is the number of the page.

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




	static PDF_2_html(file,Callback){

		exec('pdf2htmlEX '+file, function(error, stdout, stderr) {

			var source_pdf 		= fs.createReadStream(temp_directory+path.basename(file));
    		var destination_pdf = fs.createWriteStream(media_library+'pdf/pdf/'+path.basename(file));

    		source_pdf.pipe(destination_pdf,{ end: false });

			source_pdf.on("end", function(){

			    fs.unlinkSync(file);//I delete the old file

			    //I move the html file also
			    var html_file 			= path.basename(file,'.pdf')+'.html';
			    var source_html 		= fs.createReadStream(html_file);
    			var destination_html	= fs.createWriteStream(media_library+'pdf/html/'+html_file);

    			source_html.pipe(destination_html,{ end: false });

				source_html.on("end", function(){

				    fs.unlinkSync(html_file);//I delete the old file

				    Callback('OK')
				});
			});

			if(stderr){
				console.log('Error convertion PDF to HTML: ' + stderr)
			}
  			
		    
		    if (error !== null) {
		        console.log('exec error: ' + error);
		    }
		});
	}

	///////////////////////////////////////LeeConverter//////////////////////////////////////////////////////////////////////////////




	///////////////////////////////////////////Utilities//////////////////////////////////////////////////////////////////////

	static extract_text(file,Callback){

		textract.fromFileWithPath(file, function( error, text ) {
  			
			if (error) {

			    console.log('Error extracting text from : '+path.basename(file)+' ' + error);
			    
			    Callback('error')
			}else{

				Callback(text)
			}
		})
	}


	static watermark_image(file,Callback){

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

		
}


module.exports = Filer;







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

		var destination = media_library+this_file+'/thumbnails/'+path.basename(file,path.extname(file))+'_'+generate_hash()+'.png';

		filepreview.generate(file,destination, function(error) {
		    
		    if (error) {
		      	return console.log(error);
		    }else{

		    	Callback(destination)
		    }
    		
  		});
	}