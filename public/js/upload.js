var rowCount = 0;
var fileCount = 0;
var pos = 0; 

$(document).ready(function(){

	//fixe the size of the uploader
	$('.field_upload').height((window.field_upload_height*$(window).height())/100)

	$('.selector').hover(function  () {
		$('.icon_publish').addClass('red-text text-darken-2')
	},function() {
		$('.icon_publish').removeClass('red-text text-darken-2')
	});


    //Click to upload
    $('.click_to_uplaod').click(function  () {
        
        $('.filer').click()
    })

	// Gerer les cas de video multiples
	var obj = $('.selector');

	obj.on("dragenter", function(e){
		e.stopPropagation();
		e.preventDefault();
		$('.icon_publish').addClass('red-text text-darken-2')
        $('.icon_publish').html('<i class="valign large material-icons">done</i>')

	})

	obj.on('dragover', function (e)
	{
		e.stopPropagation();
		e.preventDefault();

	});


    obj.on('dragexit', function (e)
    {
        $('.icon_publish').html('<i class="valign large material-icons">publish</i>')
    });


    $('.filer').change(function(e){
 
        var files = $(this)[0].files;

        //Init progress bars to 0
        big_progress_bar(0)
        small_progress_bar(0)

        prepare_file (files)

    });


	obj.on('drop', function (e)
	{
		e.preventDefault();
		var files = e.originalEvent.dataTransfer.files;

        //Init progress bars to 0
        big_progress_bar(0)
        small_progress_bar(0)

        prepare_file (files)

		//We need to send dropped files to Server
		// handleFileUpload(files,obj);
	});


    function prepare_file (files) {//To do. extention and size
        
        if (files.length > 0){
            
            // We show the dashboard
            $(".selector").fadeOut();
            $('.command_selector').fadeIn('slow');

            upload_to_the_server(files,0)
        }
    }



    function upload_to_the_server (files,index) { 

        //Display the big progress bar
        small_progress_bar((index*100)/files.length)


        if(index==0 || files.length!=index){

            // create a FormData object which will be sent as the data payload in the
            // AJAX request
            var formData = new FormData();

            var file = files[index];

            $('.up_title').text(file.name)

            // add the files to formData object for the data payload
            formData.append('file', file, file.name);

            index=index+1;

            $.ajax({

                  url: '/upload',

                  type: 'POST',

                  data: formData,

                  processData: false,

                  contentType: false,

                  error: function  (err) {
                      console.log(err)
                  },

                  success: function(data){

                    upload_to_the_server (files,index)
                  },
                  xhr: function() {
                    // create an XMLHttpRequest
                    var xhr = new XMLHttpRequest();

                    // listen to the 'progress' event
                    xhr.upload.addEventListener('progress', function(evt) {

                      if (evt.lengthComputable) {
                        // calculate the percentage of upload completed
                        var percentComplete = evt.loaded / evt.total;
                        percentComplete = parseInt(percentComplete * 100);

                        // update the Bootstrap progress bar with the new percentage
                        big_progress_bar(percentComplete)
                      }

                    }, false);

                    return xhr;
                  }
            })

        }else{

            //We hide the indeterminate progressBar
            $('.state_upload').fadeOut()

            $('.this_statu_upload').html('<center><i class="large material-icons">done</i></center>')

            $('.publish').removeClass('disabled')
            $('.cancel_publish').fadeOut();
        }
        
    }

    $(".publish").click(function(e){
            
        var obj = {
            title: $(".file_title").val(),
            description: $(".file_desc").val(),
            tag: $(".file_tag").val()
        };

        console.log(obj);

        $.ajax({

              url: '/saveInformation',

              type: 'POST',

              data: obj,

              error: function  (err) {
                  console.log(err)
              },

              success: function(data){
                console.log(data);
                alert("reussi");
              }
        })
    })



	$(document).on('dragenter', function (e)
	{
		e.stopPropagation();
		e.preventDefault();
		$('.icon_publish').removeClass('red-text text-darken-2')
        $('.text_import').html('Ici')

	});


	$(document).on('dragover', function (e)
	{
		e.stopPropagation();
		e.preventDefault();
		$('.icon_publish').removeClass('red-text text-darken-2')
	});

	$(document).on('drop', function (e)
	{
		e.stopPropagation();
		e.preventDefault();
		$('.icon_publish').removeClass('red-text text-darken-2')
	});

    $("#cancel").click(function(e){
        e.preventDefault();
        $(".selector").fadeIn("slow");
        $(".command_selector").fadeOut();
        rowCount = 0;
        fileCount = 0;
    });

    function big_progress_bar (percent) {
        
        $('.total_progress').attr('style','width: '+percent+'%')
        $('.percent_up').text(percent+'%')
    }

    function small_progress_bar (percent) {
        
        $('.ind_file').attr('style','width: '+percent+'%')
        $('.counter').text(percent+'%')
        
    }



    // function sendFileToServer(formData, status, files){
    //     var uploadUrl = "/upload";
    //     var extraData = {};
    //     var jqXHR=$.ajax({
    //             xhr: function() {
    //             var xhrobj = $.ajaxSettings.xhr();
    //             if (xhrobj.upload) {
    //                     if(fileCount == 0){
    //                         var percent2 = 0;
    //                     }
    //                     xhrobj.upload.addEventListener('progress', function(event) {
    //                         var percent = 0;
    //                         var position = event.loaded || event.position;
    //                         var total = event.total;
    //                         var total2 = 0;
    //                         for(var j = 0; j < files.length; j++){
    //                             total2 += files[j].size;
    //                         }
    //                         if (event.lengthComputable) {
    //                             percent = Math.ceil(position / total * 100);
    //                             percent2 = Math.ceil(position / total2 * 100);
    //                         }
    //                         status.setProgress(percent);
    //                         status.setTotalProgress(percent2);
    //                     }, false);
    //                 }
    //             return xhrobj;
    //         },
    //         url: uploadUrl,
    //         type: "POST",
    //         contentType:false,
    //         processData: false,
    //         cache: false,
    //         data: formData,
    //         success: function(data){

    //             if(data=='success'){

    //                 status.setProgress(100);

    //                 if(files.length > fileCount){
    //                     handleFileUpload(files, $(".selector"));
    //                     fileCount++;
    //                 }else{
    //                     alert("it's correct!");
    //                     fileCount = 0;
    //                     rowCount = 0;
    //                 }
    //             }else{
    //                 if(data=='bad_file'){

    //                     alert(data)
    //                 }
    //             }
               

    //             //$("#status1").append("File upload Done<br>");
    //         }
    //     });

    //     status.setAbort(jqXHR);
    // }

    // function createStatusbar(obj, files)
    // {
    //      rowCount++;
    //      //var row="odd";
    //      //if(rowCount %2 ==0) row ="even";
    //      this.statusbar = $(".command_selector");
    //      this.filename = $("<div class='filename'></div>").appendTo(this.statusbar);
    //      this.size = $("<div class='filesize'></div>").appendTo(this.statusbar);
    //      this.progressBar = $("<div class='progressBar'><div></div></div>").appendTo(this.statusbar);
    //      this.abort = $("<div class='abort'>Abort</div>").appendTo(this.statusbar);
    //      /*obj.after(this.statusbar);*/
    //      $(".counter").html("("+ rowCount + "/" + files.length +")");

    //     this.setFileNameSize = function(name,size)
    //     {
    //         var sizeStr="";
    //         var sizeKB = size/1024;
    //         if(parseInt(sizeKB) > 1024)
    //         {
    //             var sizeMB = sizeKB/1024;
    //             sizeStr = sizeMB.toFixed(2)+" MB";
    //         }
    //         else
    //         {
    //             sizeStr = sizeKB.toFixed(2)+" KB";
    //         }

    //         $(".up_title").html(name + " - <b>" + sizeStr + "</b>");
    //         $(".file_title").val(name);
    //         /*this.filename.html(name);
    //         this.size.html(sizeStr);*/
    //     }
    //     this.setProgress = function(progress)
    //     {
    //         var progressBarWidth =progress*$(".ind_file").width()/ 100;
    //         $(".ind_file").css("width", progress + "%");
    //         $(".percent_up").find('div').animate({ width: progressBarWidth }, 10).html(progress + "% ");
    //         if(parseInt(progress) >= 100)
    //         {
    //             this.abort.hide();
    //         }
    //     }
    //     this.setTotalProgress = function(progress)
    //     {
    //         $(".total_progress").css("width", progress + "%");
    //         if(parseInt(progress) >= 100)
    //         {
    //             this.abort.hide();
    //         }
    //     }
    //     this.setAbort = function(jqxhr)
    //     {
    //         var sb = this.statusbar;
    //         this.abort.click(function()
    //         {
    //             jqxhr.abort();
    //             sb.hide();
    //         });
    //     }

    // }

    // function handleFileUpload(files, obj)
    // {
    //     var fd = new FormData();

    //     for (var i = 0; i < files.length; i++)
    //     {


    //         if(fileCount >= files.length) return false;
    //         fd.append('file', files[fileCount]);

    //         var status = new createStatusbar(obj, files); //Using this we can set progress.
    //         status.setFileNameSize(files[fileCount].name,files[fileCount].size);
    //         sendFileToServer(fd, status, files);
    //         fileCount++;

    //     }
    // }





});