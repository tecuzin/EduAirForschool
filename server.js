"use strict"; 

var express 	= require('express'),
os 				= require('os'),
bodyParser 		= require('body-parser'),
passwordHash 		= require('password-hash'),
redis 			= require('redis'),
formidable		= require("formidable"),
path			= require("path"),
//client 		= redis.createClient(),
session 		= require('express-session'),
redisStore 		= require('connect-redis')(session),
cookieParser    	= require('cookie-parser'),
bcrypt			= require('bcrypt-nodejs');
fs			= require("fs");


var port 		= 80;
var redis_port		= 27017;
var TTL_session 	= 260 ; //24h 
var protocol		="http://";


var min_character_user_full_name	= 5;
var min_character_user_number		= 5;
var min_character_user_password		= 4;


var language 		= require('./local_modules/language');

var User 		= require('./models/User');//Model user
var Admin 		= require('./models/Admin');//Model Admin
var librarian 		= require('./models/Elastic');//Model Search engine
var filer  		= require('./models/Filer');//Model to manage files


var app = express();



app.set('view engine','ejs')

app.use('/assets', express.static('public'))

app.use(language)

app.use(cookieParser("secretSign#14LydieDjems3_!223"));


app.use( bodyParser.json()); // to support JSON-encoded bodies

app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
  	extended: true
}));


app.use(session({
  secret: '##Lydie##Dje##ms##',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
  name : 'SessionIdent'
}))


/////////////////////////Todo////////////////////////////////////
//Text of term and conditions
//404 page error
//Switch to redis
//Ecrire to les console.log(dans un log file)
//Module follow
//Fatal error page
/////////////////////////Todo////////////////////////////////////




//For SignIn and SignUp
app.get('/',(request,response)=>{

	var data_page = {
		'title':'Welcome',
		'ip_server':ip_server,
		'protocol':protocol
	};

	response.render('welcome',data_page) 
})




//For fatal error
app.get('fatal_error/',(request,response)=>{

	var data_page = {
		'title':'fatal error :(',
		'ip_server':ip_server,
		'protocol':protocol
	};

	response.render('fatal_error',data_page) 
})




//For SignIn and SignUp
app.get('/connect',(request,response)=>{

	if(request.session.user_id){

		response.redirect('/')
	}else{
		var data_page = {
			'title':request.__('login'),
			'ip_server':ip_server,
			'protocol':protocol
		};

		response.render('connect',data_page)
	}
	
})
 

app.post('/connect_form',(request,response)=>{

	if(request.session.user_id){

		response.redirect('/')
	}else{

		var data = request.body;

		if(data.is_connect=='true'){ 
			//For Login

			if(data.user_number===undefined || data.user_number==='' || data.user_form_pass===undefined || data.user_form_pass===''){

				response.json({'statu':false,'message':request.__('error_user_or_password')})
			}else{

				User.login({'user_number':data.user_number,'user_form_pass':data.user_form_pass},function (results) {

					if(results.statu=='ok'){

						request.session.user_id		= results.results[0]._id;
						request.session.username 	= results.results[0].user_full_name;

						results.results.user_form_pass	= undefined;//We arase the password for security

						//We redirect the user if he requested a page
						if(request.session.url===undefined){

							response.json({'statu':true,'user':results.results[0],'url':'/'})
						}else{
							if(request.session.url===undefined){
							
								response.json({'statu':true,'user':results.results[0],'url':'/'})
							}else{
								response.json({'statu':true,'user':results.results[0],'url':request.session.url})
							}
						}
					}else{
						response.json({'statu':false,'message':request.__('error_user_or_password')})
					}	
				})
			}
		}else{ 
			//For SignUp
			if(data.user_number!=undefined && data.user_form_pass!=undefined && data.user_full_name!=undefined && data.user_sexe!=undefined){

				if(data.user_number!='' && data.user_form_pass!='' && data.user_full_name!='' && data.user_sexe!=''){

					data.user_form_pass =  bcrypt.hashSync(data.user_form_pass); //Hash password

					User.registrar(data,function (results) { 

						if(results.statu=='ok'){

							//We store data on session
							var this_user = results.results.ops[0];

							request.session.user_id		= this_user._id;
							request.session.username 	= this_user.user_full_name;
							this_user.user_form_pass	= undefined;
				 			this_user.is_connect		= undefined;


							//We redirect the user if he requested a page
							if(request.session.key===undefined){

								response.send({'statu':true,'user':this_user,'url':'/'})
							}else{
								if(request.session.url===undefined){
								
									response.send({'statu':true,'user':this_user,'url':'/'})
								}else{
									response.send({'statu':true,'user':this_user,'url':request.session.url})
								}
							}
						}else{
							if(results.type!=undefined){

								response.send({'statu':false,'message':request.__('fatal_error')})
							}else{
								response.send({'statu':false,'message':request.__('form_used')})
							}
 						}
					})
				}else{
					response.json({'statu':false,'message':request.__('error_form')})
				}
			}else{
				response.json({'statu':false,'message':request.__('error_form')})
			}
		}
	}
})


app.get('/who',(request,response)=>{


	if(request.session.user_id!=undefined){
		var data_page = {
			'title':'Tell me more',
			'ip_server':ip_server,
			'protocol':protocol
		}
		response.render('choose_profil',data_page)
	}else{
		response.redirect('/connect')
	}
})




app.get('/get_my_profil',(request,response)=>{

	if(request.session.user_id!=undefined){

		User.get_my_profil({'user_id':request.session.user_id},function (results) {

				
		})
	}else{
		console.log('connected')
	}

		
})





app.get('/term_and_condition',(request,response)=>{

	var data_page = {
		'title':request.__('term'),
		'ip_server':ip_server,
		'protocol':protocol
	};
	response.render('term_and_condition',data_page)
})




app.post('/set_my_profil',(request,response)=>{

	if(request.session.user_id!=undefined){

		var data = request.body; 

		User.set_my_profil({'data':data,'user_id':request.session.user_id},function (results) {

			if(results.statu=='ok'){

				request.session.profil		= data.profil;
				request.session.students 	= data.students;
				request.session.school 		= data.school;

				response.json({'statu':true,'results':{'profil':data.profil,'students':data.students,'school':data.school},'url':'/'})
			}else{
				response.json({'statu':false,'url':'/fatal_error'})
			}	
		})
	}else{
		response.json({'statu':false,'message':request.__('user_not_connected'),'url':'/'})
	}
})





app.get('/contributor/:id',(request,response)=>{

	var data_page = {
		'title':'Contributor',
		'ip_server':ip_server,
		'protocol':protocol
	};
	response.render('contributor',data_page)
})



////////////////////////////////////////////////////Upload file//////////////////////////////////////////////////



app.get('/upload',(request,response)=>{

	var data_page = {
		'title':request.__('term'),
		'ip_server':ip_server,
		'protocol':protocol
	};
	response.render('upload',data_page)
})


app.get('/test',(request,response)=>{

	
	filer.convert_to_mp4('test.3gp',function  (results) {
		
		response.send(results);
	})
})





////////////////////////////////////////////////////Upload file//////////////////////////////////////////////////

app.post('/upload', (request, response) => {
	var form = new formidable.IncomingForm();

	//settings
	form.multiples = true;
	form.uploadDir = path.join(__dirname, "/public/uploads");

	form.on("file", function(field, file){
		fs.rename(file.path, path.join(form.uploadDir, file.name));
	});

	form.on('error', function(err) {
		console.log('An error has occured: \n' + err);
	});

	form.on('end', function() {
		response.end('success');
	});

	form.parse(request);
});











/////////////////////administration////////////////////////////////////

app.use('/plugins', express.static('views/big_brother/plugins'))
app.use('/bootstrap', express.static('views/big_brother/bootstrap'))
app.use('/dist', express.static('views/big_brother/dist'))
app.use('/build', express.static('views/big_brother/build'))


app.get('/initer',(request,response)=>{

	User.login_admin_init({'user_number':data.user_number,'user_form_pass':data.user_form_pass},function (results) {

		if(results.statu=='ok'){

			response.send('All is fine!!')
			
		}else{
			response.send(request.__('fatal_error'))
		}	
	})
});


app.get('/admin_login',(request,response)=>{

	var data_page = {
		'title':'administration',
		'ip_server':ip_server,
		'protocol':protocol
	};

	response.render('admin_login',data_page)
});



app.post('/admin_login_form',(request,response)=>{

		var data = request.body; 

			if(data.user_number===undefined || data.user_number==='' || data.user_form_pass===undefined || data.user_form_pass===''){

				response.json({'statu':false,'message':request.__('error_user_or_password')})
			}else{

				User.login_admin({'user_number':data.user_number,'user_form_pass':data.user_form_pass},function (results) {

					if(results.statu=='ok'){

						if(results.new_admin=='ok'){ //If its this the first login as admin

							request.session.user_id		= results.results.insertedIds[0];
							request.session.username 	= data.user_number;

							request.session.admin 		= 0;
						}else{

							request.session.user_id		= results.results[0]._id;
							request.session.username 	= results.results[0].user_number;
							request.session.admin 		= 0;
							results.results[0].user_form_pass	= undefined;//We arase the password for security
						}

						//We redirect the user if he requested a page
						response.json({'statu':true,'user':results.results[0],'url':'/big_brother'})
					}else{
						response.json({'statu':false,'message':request.__('error_user_or_password')})
					}	
				})
			}
})


app.post('/get_school',(request,response)=>{

	var data = request.body; 

	Admin.get_school(data,function (results) {

		if(results.statu=='ok'){

			response.json({'statu':true,'results':results})
		}else{
			response.json({'statu':false,'message':request.__('fatal_error')})
		}	
	})
})



app.post('/add_school',(request,response)=>{

	if(request.session.admin!=undefined){

		var data = request.body; 

		Admin.add_school(data,function (results) {

			if(results.statu=='ok'){

				response.json({'statu':true,'results':results.results})
			}else{
				response.json({'statu':false,'message':request.__('fatal_error')})
			}	
		})
	}else{
		response.json({'statu':false,'message':request.__('admin_denied')})
	}
})



app.post('/delete_school',(request,response)=>{

	if(request.session.admin!=undefined){

		var data = request.body; 

		Admin.delete_school(data,function (results) {

			if(results.statu=='ok'){

				response.json({'statu':true,'results':results.results})
			}else{
				response.json({'statu':false,'message':request.__('fatal_error')})
			}	
		})
	}else{
		response.json({'statu':false,'message':request.__('admin_denied')})
	}
})





app.get('/big_brother',(request,response)=>{

	if(request.session.admin!=undefined){ 

		response.locals.username 	= request.session.username;
		response.locals.user_id		= request.session.user_id;
		response.locals.admin 		= request.session.admin;

		var data_page = {
			'title':'administration',
			'ip_server':ip_server,
			'protocol':protocol
		};

		response.render('big_brother/big_brother',data_page)
	}else{

		response.redirect('/admin_login')
	}

	
});


app.use(function(req, response, next){

	var data_page = {
			'title':'Sorry, page not found',
			'ip_server':ip_server,
			'protocol':protocol
		};

    response.status(404).render('404', data_page);
});



app.listen(port)


 /////////////////////Get the Ip of the server///////////////////////////////////
    var ip_server;

    var ifaces = os.networkInterfaces();

    Object.keys(ifaces).forEach(function (ifname) {
      var alias = 0;

      ifaces[ifname].forEach(function (iface) {
        if ('IPv4' !== iface.family || iface.internal !== false) {
          // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
          return;
        }

        if (alias >= 1) {
          // this single interface has multiple ipv4 addresses
          // console.log(ifname + ':' + alias, iface.address);
        } else {
          // this interface has only one ipv4 adress
          ip_server = iface.address;
        }
        ++alias;
      });
    });


