const fs = require('fs');
const aws = require('aws-sdk');
const request = require('request');

if (fs.existsSync('/app/config.json')) {
	console.log('Using local configuration at config.json');
    return 0;
} else {
	console.log('Getting configuration from Parameter Store.')
    var ssm = new aws.SSM({
        region: 'ap-southeast-2'
    });
    
    request(process.env.ECS_CONTAINER_METADATA_URI, function (error, response, body) {
		if (error) {
			console.log('ERROR REQUEST')
			console.log(error)
		}
		
		
		//var body_j = JSON.parse(body);
		var body_j = body;
		
		try{
			var body_j = JSON.parse(body);
		} catch (e) {
			console.log("Error  doing JSON parse!")
			throw e
		}
		
		var name = body_j.Name;
		
		
		console.log('SERVICE: ' + name);
		
		var params = {Name: name};
		
		ssm.getParameter(params, function(err, data) {
		  if (err) {
		  	console.log('ERROR SSM')
		  	console.log(err, err.stack); // an error occurred
		  }
		  else {
		  	var data_j = data
		  	console.log("RAW")
		  	console.log(data_j.Parameter.Value)
		  	console.log("REPLACED")
		  	var payload = data_j.Parameter.Value
		  	var obj = payload.replace(/\\\\{/g,'{')
		  					.replace(/\\\\}/g,'}')
		  	console.log(obj)
		  	console.log("PARSED")
		  	var obj_j = JSON.parse(obj)
		  	console.log(JSON.stringify(obj_j))
		  	
		  	fs.writeFile("config.json", JSON.stringify(obj.j), (err,data) => {
		  		if (err) console.log("ERROR WRITING CONFIG: " + err);
		  		console.log("Successfully wrote config.json contents.")
		  	})
		  }
		  
		});
	});
    
    
    
}