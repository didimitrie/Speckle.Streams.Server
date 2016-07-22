var mongoose    = require('mongoose')

var moleculeSchema = mongoose.Schema( {
  hash : {type: String, index: true },
  data : {}
} )

var moleculeModel = mongoose.model( 'Molecule', moleculeSchema )
module.exports = moleculeModel;