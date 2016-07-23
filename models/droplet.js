var mongoose    = require('mongoose')

var dropletSchema = mongoose.Schema( {
  date: { type: Date, default: Date.now(), index: true } ,
  parentStream: { type: String },
  structure: {type: Array, default: [] },
  requesthash : { type: String, default: '-1'} // will be held towards 
} )

var dropletModel = mongoose.model( 'Droplet', dropletSchema )
module.exports = dropletModel;