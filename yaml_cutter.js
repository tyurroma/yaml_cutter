const fs = require('fs');
const request = require("request");
const yaml = require('js-yaml');
const $RefParser = require('json-schema-ref-parser');

const dir = './files/';

if (process.argv.length <= 2) {
    console.log('Usage: ' + __filename + '<URL of API in JSON format>');
    process.exit(-1);
} 

const url = process.argv[2];

request({url: url, json: true}, handleApiFile);


function handleApiFile(error, response, body) {
        
    if (error) {
        console.log(error);
        return;
    }
    if (response.statusCode !== 200) {
        console.log(response.statusCode);
        return;
    }

    //loading json-file to parse
    // try {
    //     var resultJson = yaml.safeLoad(fs.readFileSync(fileName, 'utf-8'));
    //     } catch (e) {
    //         console.log(e);
    // }

    /*replace circle references in components -> schemas -> filter 
    because dredd doesn't support it */
    body.components.schemas.Filter = {type: 'object'};

    //extracting all $ref using 'json-schema-ref-parser' library
    $RefParser.dereference(body, function(err, schema) {
        if (err) {
        console.error(err);
        return;
        }

        /*destructing our json-file to create simple objects
        common: openapi, info, components
        paths*/
        const {paths, ...common} = schema;
        
        const specs = [];

        //pushing parsed information to 'specs' array 
        for (path in paths) {
                const v = paths[path];

                for (method in v) {
                    const op = v[method];
                    
                    //http-method 'delete' mustn't have a request body in this way skip it
                    if (method.toLowerCase() === 'delete' && op.requestBody != null) {
                        continue;    
                    } 

                    specs.push( 
                        { 
                        name: op.operationId,
                        spec: {
                            ...common, 
                            paths: {
                                [path]: {
                                    [method]: op
                                    }
                                }
                            }});
                }

        }

        //creating directory './files/' if it doesn't exist
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
            console.log('Directory "./files/" has been created')
        }

        //creating and writing to json's data from 'specs' array to files with name = operationId
        for (var i = 0; i < specs.length; i++) {
            fs.writeFileSync(dir+specs[i].name+'.json', JSON.stringify(specs[i].spec, null, 4));
        }

        console.log('Files have been created.');

    });
}
