var exports = module.exports = {};
const Redis = require('ioredis');
const config = require('../config.json');
const H = require('handlebars');

const redisConf = config.connectors.redis;


// Expected Connector Definition Structure:

// "connectors": {
//     "redis" : {
//         "nodes" : [
//             {
//                 "port": <port>,
//                 "host": <host>
//             }
//         ],    
//         "redisOptions": {} OPTIONAL
//     }
// }


// Expected Action Structure:
//
//     "action_templates": {
//         "read": {
//             "connector": "redis", 
//             "query": {
//                 "get" : <query>
//             }
//         },
//         "update": {
//             "connector": "redis", 
//             "query": {
//                 "set": [
//                     <key query>,
//                     <value query>
//                 ]
//             }
//         }
//     }




exports.execute = function execute(query) {
    try {
        const conn_template = H.compile(JSON.stringify(redisConf.nodes));
        var conn_object = conn_template(process.env);
        //const cluster = new Redis.Cluster(redisConf.nodes);
        const cluster = new Redis.Cluster(JSON.parse(conn_object));
        const connected = true;
        return (req,res,next) => {
            // Test for implementation
            if (!connected) {
                console.warn("CAR003 WARN: Could not connect to Redis Cluster")
                res.status(400).send("CAR003 WARN: Could not connect to Redis Cluster");
            }
            else {
                if (query) {
                    // Execute the request
                    try {
                        // Handle 'get' query type
                        if ('get' in query) {
                            console.info('REDIS >> Doing GET');
    
                            try {
                                var query_template = H.compile(query.get);
                                var query_out = query_template(req);
                                console.info('CAR001 INFO: REDIS QUERY >> '+ query_out);
                            } catch (e) {
                                console.warn("CAR002 WARN: Could not compile template from given parameters.\n" + e);
    				            res.status(400).send('Failed Query Template Render');
                            }
    
                            cluster.get(query_out, (err,result) => {
                                if(err) {
                                    console.warn("ERROR", err);
                                    throw "CAR004 WARN: Query execution failed at database."
                                } else {
                                    //temporary solution, replacing single quotes with double quotes to ensure output is valid json. Solution will be to store data in redis inside " " rather than ' '
                                    //result = result.replace(/'/g, "\"");
                                    res.status(200).json({data: result});
                                }
                            });
                        
                        // Handle 'set' query type
                        } 
                        else if ('set' in query) {
                            console.log('REDIS >> Doing SET');
    
                            try {
                                var key_query_template   = H.compile(query.set[0]);
                                var value_query_template = H.compile(query.set[1]);
                                var k_query = key_query_template(req);
                                var v_query = value_query_template(req);
                                console.info('CAR001 INFO: REDIS QUERY >> (' + k_query + ',' + v_query + ')');
                            } catch (e) {
                                console.warn("CAR002 WARN: Could not compile template from given parameters.\n" + e);
                                res.status(400).send('Failed Query Template Render');
                            }
    
                            cluster.set(k_query, v_query, (err,result) => {
                                if (err) {
                                    console.warn("ERROR", err);
                                    throw "CAR004 WARN: Query execution failed at database."
                                } else {
                                    res.status(200).json({data: result});
                                }
                            });
    
                        } else {
                            console.warn("CAR005 WARN: Badly formed configuration for this action.")
                            res.status(400).send("CAR005 WARN: Badly formed configuration for this action.");
                        }
    
                    } catch (e) {
                        console.warn(e);
                        res.status(400).send(e);
                    }
                }
                else {
                    res.status(404).send("Not implemented");
                }
            }
        }
    } catch (e) {
        console.warn(e);
        console.warn("CAR003 WARN: Could not connect to Redis Cluster.")
    }
    

}
