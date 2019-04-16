////////////////// Environment Setup //////////////////
var exports 			= module.exports = {};
const request   		= require('request');
const H 		  	   	= require('handlebars');
const config 			= require('../config.json');
const { Pool, Client } 	= require('pg');

const pgConf 			= config.connectors.postgres;

// Expected Connector Definition Structure: 

// "connectors": {
// 	    "postgres" : {
// 	         "host":    	<hostname> 
// 	        ,"database": 	<db_name>
// 	        ,"user":    	<username> 
// 	        ,"password": 	<password>`
// 	     }
// }

// Expected Action Structure:
//
//     "action_templates": {
//         <action_name>: {
//             "connector": "postgres", 
//             "query": <query_template>
//         },
//		   ...
//     }


H.registerHelper('expandPgFilters', (filters, opts) => {
	var expand = function (filter) {
		let type_signature = ("type" in filter) ? filter.type : "text"
		switch (filter.op) {
			case 'rl':
				return `${filter.field}::text ILIKE '${filter.value}%' `
			case 'll':
				return `${filter.field}::text ILIKE '%${filter.value}' `
			case 'bl':
				return `${filter.field}::text ILIKE '%${filter.value}%' `
			default: 
				return `${filter.field}::${type_signature} ${filter.op} '${filter.value}' `
		}
	}

	return [].concat(...filters.map(e => ['AND ', expand(e)])).slice(1)
				.reduce((x,e) => x + e).slice(0,-1)
})


////////////// Define Database Callback ///////////////
exports.execute = function execute(query) {
    const conn_template = H.compile(JSON.stringify(pgConf));
    var conn_object = JSON.parse(conn_template(process.env));
    const pool = new Pool (conn_object)
    // const cluster = new Redis.Cluster(redisConf.nodes);
	// const pool = new Pool (pgConf);

	return (req,res,next) => {
		if (query){	
			// Log the data
			console.info('PG >> Executing Query');
			console.info(req.query);

			// Do the templating
			try {
				var query_template 	= H.compile(query);
				var query_out 		= query_template(req);
				console.info('CAP001 INFO: PG QUERY >> '+query_out);	
			} catch (e) {
				console.warn("CAP002 WARN: Could not compile template from given parameters.\n" + e);
				res.status(400).send('Failed Query Template Render');
			}


			// Run the query
			pool.connect((error,client,done) => {
				if (error){
					console.warn(error);
					throw "CAP003 WARN: Could not connect to Postgres"
				}
				client.query(query_out, (error1,result) => {
					console.log('QUERY SENT: '+query);
					done();
					
					if (error1) {
						console.error(error1);
						var e = "CAP004 WARN: Query execution failed at database."
						console.error(e);
						res.status(400).send(e);
					}
					else {
						res.status(200).json({data: result.rows});
					}
					
					
				})
			});

		} 
		else {
			res.status(404).send("Not implemented")
		}


	}
}
