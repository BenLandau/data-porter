////////////// Environment Setup /////////////////
// Import framework
const express 	 = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const winston = require('./config/winston');

// Instantiate framework objects
const app = express();
const router = express.Router();

// Import data pact
const pact = require('./config.json');

// Define API version
const VERSION = "1";




// Get required connectors
// -----> Connectors must have same name as in config.
var conn = {};
try {
	console.log("requested connectors: ", pact.connectors);
	for (var ifc in pact.connectors) {
		console.log("connector: ",ifc);
		try {
			conn[ifc] = require('./connectors/'+ifc+'.js');
		} catch (e) {
			console.warn(`CAI001 WARN: Could not load connector file for ${ifc}. Unstable behaviour may result.`);
			console.warn(e);
		}
	} 
} catch (e)  {
	console.error(e);
}

////////////// API Global Definition /////////////////
// Healthcheck and version check for app
app.get(`/${VERSION}/`, (req, res) => {
	res.status(200).send(`Data API version ${VERSION} up and running!`);
});

// Attach the router to /q endpoint
app.use(bodyParser.json());

// Set up logging of HTTP requests to the codeless API
app.use(morgan('combined', {stream: winston.stream}));

app.use(
	bodyParser.urlencoded(
		{extended: true}
	)
); 
app.use(`/${VERSION}/q`, router);

// Listen on port 3000
app.listen(3000,'0.0.0.0', () => {
	console.log("Listening upper.")
	// request(process.env.ECS_CONTAINER_METADATA_URI, function (error, response, body) {
	// 	if (error) console.log(error)
		
		
	// 	var body_j = JSON.parse(body);
	// 	console.log('SERVICE: ' + body_j.Name)
		
		
	// 	var params = {
	// 	  Name: body_j.Name
	// 	};
	// 	// ssm.getParameter(params, function(err, data) {
	// 	//   if (err) console.log(err, err.stack); // an error occurred
	// 	//   else {
		  	
	// 	//   	var data_j = JSON.parse(data)
	// 	//   	console.log("RAW")
	// 	//   	console.log(data_j.Parameter.Value)
	// 	//   	console.log("PROCESSED")
	// 	//   	var obj = data_j.Parameter.Value.replace(/\\{/g,'{')
	// 	//   					.replace(/\\}/g,'}')
	// 	//   					.parse()
	// 	//   	console.log(JSON.stringify(obj))
	// 	//   }
		  
	// 	// });

	// 	console.log('Listening on 3000');
	// });
});

////////////// API Specific Definition /////////////////
const F = pact.callee_interface;
const T = pact.action_templates;

// Attach actions to route
router.all('/', (req,res,next) => {
		console.log('Got to /q!!');
		console.log(req.body);
		var data = req.body;
		next();
	})
	.get   ({{#build_uri callee_interface.get.params.uri}}{{/build_uri}}, 
		conn[T[F.get.action].connector].execute(
			T[F.get.action].query
		)
	)
	.post  ({{#build_uri callee_interface.post.params.uri}}{{/build_uri}}, 
		conn[T[F.post.action].connector].execute(
			T[F.post.action].query
		)
	)
	.put   ({{#build_uri callee_interface.put.params.uri}}{{/build_uri}},
		conn[T[F.put.action].connector].execute(
			T[F.put.action].query
		)
	)
	.delete({{#build_uri callee_interface.delete.params.uri}}{{/build_uri}}, 
		conn[T[F.delete.action].connector].execute(
			T[F.delete.action].query
		)
	);

///////////////////// END MAIN //////////////////////
