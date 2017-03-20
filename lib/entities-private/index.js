const fs = require('fs')
const MODELS = {}
const modelsFolder = './lib/entities-private'

var files = fs.readdirSync(modelsFolder)
for (var i in files) {
  if (files[i] !== 'index.js') {
    var key = files[i].split('.')[0]
    MODELS[key] = require('./' + files[i])
  }
}

module.exports = MODELS
