const fs = require('fs');
const yaml = require('js-yaml');

let newJson = {};

if (process.argv.length <= 2) {
    console.log("Usage: " + __filename + " <Path to your yaml file>");
    process.exit(-1);
} 

var fileName = process.argv[2];

try {
    var resultJson = yaml.safeLoad(fs.readFileSync(fileName, 'utf-8'));
    } catch (e) {
        console.log(e);
}

const {paths, ...common} = resultJson;

const specs = [];

for (path in paths) {
    const v = paths[path];
    
    for (method in v) {
        const op = v[method];
        specs.push(
            {
                ...common, 
                paths: {
                    [path]: {
                        [method]: op
                        }
                    }
                });
    }
}

for (var i = 0; i < specs.length; i++) {
    fs.writeFileSync(i+'.json', JSON.stringify(specs[i]));
}
