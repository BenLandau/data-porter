const H = require('handlebars');
const fs = require('fs');
const config = require('./config.json');
const SCRIPT_PATH = 'meta_index.js';

const uri_params = config.callee_interface;
const vals = config.callee_interface.get.params.uri;


// Construct the specified URIs
H.registerHelper('build_uri', (items,opts) => {
    
    if (items) {
        var build_path = (path_array) => {
            var path = '';
            for (var item of path_array) {
                if (item.name) {
                    path = path + '/' + item.name
                }
                if (item.key) {
                    path = path + '/:' + item.key;
                }
            }
            return path
        }
        
    
        if (items.path) {
            
            
            if (items.style) {
                
                if (items.style === 'progressive') {
                    var out = []
                    for (var i of [...Array(items.path.length).keys()].map((x) => x + 1)) {
                        
                        out.push(build_path(items.path.slice(0,i)))
                    }
                }
                
            } else {
                var out = [build_path(items.path)]
            }
    
            if (out.length === 0 && out[0] === ''){
                var out = ['/'];
            }
            
            
        }
        
        return JSON.stringify(out);
    } else {
        return JSON.stringify([''])
    }
});

// Apply the template to create index.js
try {
    fs.readFile(SCRIPT_PATH, "utf8", (err, data) => {
        if (err) {
            throw `CAS001 CRITICAL: Source meta_index file not found. Cannot load template.\n${err}`
        }
        // Instantiate the template
        var template = H.compile(data);
        // Fill the template
        try {
            const script = template(config);
            console.info(script);
            fs.writeFile('index.js',script, (err) => {
                if (err) {
                    throw 'CAS003 CRITICAL: Cannot write index.js to current directory.'
                } else {
                    console.info('CAS004 INFO: Template generation successful!');
                }
            });
        } catch (e) {
            console.error(e);
            throw `CAS002 CRITICAL: Template could not be generated from provided configuration file.`;
        }
    });
} catch (e) {
    console.error(e);
    console.error("CRITICAL: Template generation for API routes failed.")
}

