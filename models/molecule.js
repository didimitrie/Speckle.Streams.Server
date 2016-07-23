var mongoose    = require('mongoose')
var chalk       = require('chalk')

var moleculeSchema = mongoose.Schema( {
  hash : { type: String, index: true, unique: true },
  data : {}
} )

var moleculeModel = mongoose.model( 'Molecule', moleculeSchema )
// ensure we only save if hash is unique
moleculeSchema.pre( 'save', function (next) {
  var self = this
  moleculeModel.find({hash: self.hash}, function(err, molecules) {
    if(!molecules.length){
      console.log(chalk.cyan('Molecule ' + self.hash + ' saved'))
      next()
    }
    else {
      console.log('Molecule ' + self.hash + ' exists')
      next(new Error('Molecule exists!'))
    }
  })
})


module.exports = moleculeModel;