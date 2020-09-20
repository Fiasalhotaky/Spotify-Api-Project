/*
=-=-=-=-=-=-=-=-=-=-=-=-
Album Art Search
=-=-=-=-=-=-=-=-=-=-=-=-
*/

const http = require('http');
const https = require('https');
const querystring = require('querystring');
const authentication_cache = './auth/authentication-res.json';
const fs = require('fs');
const path = require('path');
const url = require('url');
const port = 3000;
const credentials = require('./auth/credentials.json');
const server = http.createServer();
const main = fs.createReadStream('html/main.html');
const favicon = fs.createReadStream('images/favicon.ico');
const banner = fs.createReadStream('images/banner.jpg');


server.on("request", connection_handler);
function connection_handler(req, res){
	
	console.log(`New Request for ${req.url} from ${req.socket.remoteAddress}`);

	if( req.url === '/'){
		res.writeHead(200, {'Content-Type' : 'text/html'});
    	main.pipe(res);
	}else if(req.url.startsWith ( '/favicon.ico')){
		res.writeHead(200, {'Content-Type' : 'image/x-icon'});
		favicon.pipe(res);
	}else if(req.url === '/images/banner.jpg'){
		res.writeHead(200, {'Content-Type' : 'image/x-icon'});
    	banner.pipe(res);
	}else if(req.url.startsWith('/album-art/')){ 
			let image_stream = fs.createReadStream(`.${req.url}`);
				image_stream.on('ready', function(){
					res.writeHead(200, {'Content-Type' : 'image/jpeg'});
					image_stream.pipe(res);
				});
		
			image_stream.on('error', function(err) {
				res.writeHead(404, {"Content-Type" : "text/plain"});
				res.write("404 Not found");
				res.end();
			});

		}else if(req.url.startsWith('/search')){
			//localhost:3000/search?artist="Taylor Swift"
			let users_input = url.parse(req.url, true).query;
			if(users_input.artist){
				console.log(users_input.artist);

			}else {
				res.writeHead(404, {"Content-Type" : "text/plain"});
				res.write("404 Not found");
				res.end();
			}

			const client_id = credentials.client_id;
			const client_secret = credentials.client_secret;

			let base64data = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
			let authorization = `Basic ${base64data}`;
			console.log(authorization);

			//post_data representing our Form Body Data containing grant_type  
			let post_data = {
				"grant_type":"client_credentials"
			}

			post_data = querystring.stringify(post_data);

			//Headers object containing Content-Type and Authorization
			//add an additional property "Content-Length" and set it to be the calculated value post_data.length. 
			const headers = { 
								
								"Content-Type": "application/x-www-form-urlencoded",
								"Authorization": authorization,
								"Content-Length": post_data.length
			}
			
			//object options with properties method set to POST, and headers set to be the headers
				const options = {
					method: 'POST',
					headers: headers
				};
			
				const token_endpoint = 'https://accounts.spotify.com/api/token';
				let auth_sent_time = new Date();
				let authentication_req = https.request(token_endpoint, options, function(authentication_res)    {
						received_authentication(authentication_res, users_input, auth_sent_time, res);
				});

				authentication_req.on('error', function (e) {
					console.log(e);
				});
				console.log("Requesting Token");
				authentication_req.end(post_data);
	}
}

server.on("listening", listening_handler);
server.listen(port);
function listening_handler(){
	console.log(`Now Listening on testing Port ${port}`);
}

const received_authentication = function(authentication_res, users_input, auth_sent_time, res) {
	authentication_res.setEncoding("utf8");
	let body = "";
	authentication_res.on("data", function(chunk) {body += chunk;});
	authentication_res.on("end", function() {
		//data returned is a JSON encoded string, use JSON.parse()
		console.log(body);
		let spotify_auth = JSON.parse(body);
		console.log(spotify_auth);

		//let jsonString = JSON.stringify(spotify_auth);
		create_access_token_cache(spotify_auth);
		expiration = auth_sent_time.getSeconds();
		create_search_req(spotify_auth, users_input, res);
	});
	}

//Ignore the two functions create_cache and create_search_req for now.  You can write an empty function and fill them in later.
const create_access_token_cache = function(spotify_auth) {
	var jsonString = JSON.stringify(spotify_auth);
	fs.writeFile('./auth/authentication-res.json', jsonString, 'utf8', function (err) {
		if (err) throw err;
		console.log('Saved!');
	  });
	  
}

const create_search_req = function(spotify_auth, users_input, res){

	let query = {
		"type": "album", 
		"q": users_input, 
	}

	let headers = {
		"Content-Type": "application/json; charset=utf-8"

	}

	let searchQuery = https.request('https://api.spotify.com/v1/search', (res) => {
		
		let body = "";
		res.on("data", function(chunk) {body += chunk;});
		qs = querystring.stringify(body);
		res.on('end',()=> console.log(body));
	  });
					
				searchQuery.on('error', function (e) {
					console.log(e);
				});
				console.log("Requesting Token");
				//searchQuery.end();

/*	let downloaded_images = 0;
	for(var i=0; i< album.length; i++){
		let imageUrl = albums.items[i].images[0].url;
		let image_req = https.get(imageUrl, function(image_res){
			let new_img = fs.createWriteStream('C:\Users\Fiasal\Desktop\04-album-art-finder\images', {'encoding': null});
			image_res.pipe(new_img);
			new_img.on("finish", function() {
			downloaded_images++;
			if(downloaded_images === album.length){
				console.log('works');
				//generate_webpage()
			}
		});	
	});
	image_req.on('error', function(err){console.log(err);});
}
*/

}