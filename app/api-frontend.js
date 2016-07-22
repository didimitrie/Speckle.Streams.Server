var User              = require('../models/user')
var SpkStream         = require('../models/stream')
var SpkDroplet        = require('../models/droplet')

var passport        = require('passport')
var df              = require('dateformat')
var chalk           = require('chalk')
var winston         = require('winston')


module.exports = function( app, express ) {

  var frontEndRoutes = express.Router()

  frontEndRoutes.get('/streams', passport.authenticate('jwt', { session: false  }), function(req, res) {
    winston.log('info', 'get user strems request from ' + chalk.magenta.inverse(req.user._id))
    SpkStream.find({ ownerid : req.user._id}, function(err, docs) {
      if(err) 
        return res.json({success: false, message:"Database fail."})
      if(!docs) 
        return res.json({success: false, message:"Database fail."})
      if(docs.length === 0) 
        return res.json({success: true, message: "User has no streams."})
      return res.json( {success: true, streams: docs} )  
    })
  })

  frontEndRoutes.get('/droplet', function(req, res) {
    winston.log('info', chalk.magenta.inverse('droplet id request ') + req.query.dropletid)
    if( !req.query.dropletid ) return winston.log('error', 'no droplet id specified')
    SpkDroplet.findById( req.query.dropletid , function(err, droplet) {
      if(err)
        return res.json({success: false, message: 'Database fail'})
      if(!droplet)
        return res.json({success: false, message: 'No droplet with that id found'})
      return res.json({success: true, message: 'Droplet found', droplet: droplet})
    })
  })

  app.use('/api/frontend', frontEndRoutes)
}