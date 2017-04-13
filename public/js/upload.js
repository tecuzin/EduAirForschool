var rowCount = 0;
var fileCount = 0;
var pos = 0;

$(document).ready(function(){

	//fixe the size of the uploader
	$('.field_upload').height((window.field_upload_height*$(window).height())/100)

	/*$('.selector').hover(function  () {
		$('.icon_publish').addClass('red-text text-darken-2')
	},function() {
		$('.icon_publish').removeClass('red-text text-darken-2')
	});*/

	// Gerer les cas de video multiples
	var obj = $(".selector");
	obj.on("dragenter", function(e){
		e.stopPropagation();
		e.preventDefault();
		$('.icon_publish').addClass('red-text text-darken-2')
	})

	obj.on('dragover', function (e)
	{
		e.stopPropagation();
		e.preventDefault();
	});

	obj.on('drop', function (e)
	{

        $(".selector").fadeOut();
		$('.command_selector').fadeIn('slow');
		e.preventDefault();
		var files = e.originalEvent.dataTransfer.files;

		//We need to send dropped files to Server
		handleFileUpload(files,obj);
	});

	$(document).on('dragenter', function (e)
	{
		e.stopPropagation();
		e.preventDefault();
		$('.icon_publish').removeClass('red-text text-darken-2')
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

});

function sendFileToServer(formData, status, files){
    var uploadUrl = "/upload";
    var extraData = {};
    var jqXHR=$.ajax({
            xhr: function() {
            var xhrobj = $.ajaxSettings.xhr();
            if (xhrobj.upload) {
                    if(fileCount == 0){
                        var percent2 = 0;
                    }
                    xhrobj.upload.addEventListener('progress', function(event) {
                        var percent = 0;
                        var position = event.loaded || event.position;
                        var total = event.total;
                        var total2 = 0;
                        for(var j = 0; j < files.length; j++){
                            total2 += files[j].size;
                        }
                        if (event.lengthComputable) {
                            percent = Math.ceil(position / total * 100);
                            percent2 = Math.ceil(position / total2 * 100);
                        }
                        status.setProgress(percent);
                        status.setTotalProgress(percent2);
                    }, false);
                }
            return xhrobj;
        },
        url: uploadUrl,
        type: "POST",
        contentType:false,
        processData: false,
        cache: false,
        data: formData,
        success: function(data){
            status.setProgress(100);

            if(files.length > fileCount){
                handleFileUpload(files, $(".selector"));
                fileCount++;
            }else{
                alert("it's correct!");
                fileCount = 0;
                rowCount = 0;
            }

            //$("#status1").append("File upload Done<br>");
        }
    });

    status.setAbort(jqXHR);
}

function createStatusbar(obj, files)
{
     rowCount++;
     //var row="odd";
     //if(rowCount %2 ==0) row ="even";
     this.statusbar = $(".command_selector");
     /*this.filename = $("<div class='filename'></div>").appendTo(this.statusbar);
     this.size = $("<div class='filesize'></div>").appendTo(this.statusbar);
     this.progressBar = $("<div class='progressBar'><div></div></div>").appendTo(this.statusbar);
     */this.abort = $("<div class='abort'>Abort</div>").appendTo(this.statusbar);
     /*obj.after(this.statusbar);*/
     $(".counter").html("("+ rowCount + "/" + files.length +")");

    this.setFileNameSize = function(name,size)
    {
        var sizeStr="";
        var sizeKB = size/1024;
        if(parseInt(sizeKB) > 1024)
        {
            var sizeMB = sizeKB/1024;
            sizeStr = sizeMB.toFixed(2)+" MB";
        }
        else
        {
            sizeStr = sizeKB.toFixed(2)+" KB";
        }

        $(".up_title").html(name + " - <b>" + sizeStr + "</b>");
        $(".file_title").val(name);
        /*this.filename.html(name);
        this.size.html(sizeStr);*/
    }
    this.setProgress = function(progress)
    {
        var progressBarWidth =progress*$(".ind_file").width()/ 100;
        $(".ind_file").css("width", progress + "%");
        $(".percent_up").find('div').animate({ width: progressBarWidth }, 10).html(progress + "% ");
        if(parseInt(progress) >= 100)
        {
            this.abort.hide();
        }
    }
    this.setTotalProgress = function(progress)
    {
        $(".total_progress").css("width", progress + "%");
        if(parseInt(progress) >= 100)
        {
            this.abort.hide();
        }
    }
    this.setAbort = function(jqxhr)
    {
        var sb = this.statusbar;
        this.abort.click(function()
        {
            jqxhr.abort();
            sb.hide();
        });
    }

}

function handleFileUpload(files, obj)
{
    var fd = new FormData();
   //for (var i = 0; i < files.length; i++)
   ///{
    if(fileCount >= files.length) return false;
    fd.append('file', files[fileCount]);

    var status = new createStatusbar(obj, files); //Using this we can set progress.
    status.setFileNameSize(files[fileCount].name,files[fileCount].size);
    sendFileToServer(fd, status, files);
    fileCount++;

   //}
}
