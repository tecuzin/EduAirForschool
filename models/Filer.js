
"use strict"; 
var fs 	= require('fs');

var path = require("path");

var ffmpeg = require('ffmpeg');

var thumbler = require('video-thumb');

var Mp4Convert = require('mp4-convert');

var mime = require('mime'); //Get the type mime of file

const md5File = require('md5-file'); //Generate the hash of a file

var crypto = require('crypto'); //Generate a random hash

var exec = require('child_process').exec;

var temp_directory =path.join(__dirname, '..', 'private/temp/');//Define the temporary directory when a new file is uploaded

var video_final_directory = path.join(__dirname, '..','public/library/video/');//Define the temporary directory when a new file is uploaded

var video_final_directory_thumbnails =path.join(__dirname, '..','public/library/thumbs/');//Define the directory of thumbnails

var logo_watermark =path.join( __dirname, '..','public/img/eduair_logo.png');

var video_type_out = 'video/mp4';




class Filer{

	static convert_to_mp4 (video_file,call_back_json_metada){

		var temp_file 	= temp_directory+video_file;

		var final_file	= video_final_directory+video_file+'.mp4';

		//Convert To MP4 if it is not a mp4 video
		var video_type = mime.lookup(temp_file);

		if(video_type!=video_type_out){

			var convert = new Mp4Convert(temp_file, final_file);

			convert.on('progress', function(p) {
    			console.log('Progress', p);///////////////////////////////////////////////////////////////////////////////////////////
			});

			convert.on('done', function() {
			    
				//Get the thumbnail of the video
				var this_thumbnail = video_final_directory_thumbnails+'video/'+video_file+'.png';

					// Callback mode
				exec('ffmpeg -i '+final_file+' -vf thumbnail,scale=300:200 -frames:v 1 '+this_thumbnail, function(err, stdout, stderr) {
						
						if(!err){

							exec("ffprobe "+final_file+" -show_format 2>&1 | sed -n 's/duration=//p'", function(err, stdout, stderr) {
						
								if(!err){ console.log('converted')

									//Delete the original video if is is not a MP4 video
									fs.unlinkSync(temp_file);

									call_back_json_metada({'duration':stdout.replace('\n',''),'thumbnail':this_thumbnail});
								}else{
									console.log('err')
								}
							});
						}else{
							console.log('err')
						}
				});
				

			});
			convert.start();
		
		}else{ //If is a mp4 video

			//I just move the file
			fs.rename(temp_file, final_file, function (err) {
		        
		        if (err){

		            console.log(err)
		        }else{

		        	//Get the thumbnail of the video
					var this_thumbnail = video_final_directory_thumbnails+'video/'+video_file+'.png';

					thumbler.extract(final_file, this_thumbnail, '00:00:56', '200x125', function(){
    
	    				//Get metadata of file
						fs.readFile(final_file, function (err, data) {
										
							if (err){

								console.log(err)
							}
							else {

								exif.metadata(data, function (err, metadata) {
										      
									if (err){

										console.log(err)
									}
									else{

										call_back_json_metada({'metadata':metadata,'thumbnail':this_thumbnail});
									}
								});
							}
						});
					});
		        }
    		});
		}
	}



	
	static get_hash_of_file (hash_generated){

		var current_date = (new Date()).valueOf().toString();
		var random = Math.random().toString();
		hash_generated(crypto.createHash('sha1').update(current_date + random).digest('hex'));
	}
		
}


module.exports = Filer;