const fs = require('fs');
const MODELS = {}
const modelsFolder = './lib/entities';

var files = fs.readdirSync(modelsFolder);
// console.log(">>>",files);
for (var i in files) {
  if(files[i] != "index.js"){
    var key = files[i].split(".")[0];
    MODELS[key] = require("./"+files[i]);
  }
}

module.exports = MODELS;