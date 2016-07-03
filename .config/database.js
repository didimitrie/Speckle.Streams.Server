var mongoose      = require('mongoose')
var dbdeets       = require('../.secrets/ocean.mongodb')

var url = 'mongodb://' + dbdeets.user + ':' + dbdeets.pass + '@' + dbdeets.url + '/streams/'

mongoose.connect( url )

module.exports = mongoose