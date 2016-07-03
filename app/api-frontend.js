var User              = require('../models/user')
var SpkStream         = require('../models/stream')

var passport        = require('passport')
var df              = require('dateformat')

module.exports = function( app, express ) {

  var frontEndRoutes = express.Router()

  frontEndRoutes.get('/streams', passport.authenticate('jwt', { session: false }), function(req, res) {
    SpkStream.find({ ownerid : req.user._id}, function(err, docs) {
      if(err) 
        return res.json({success: false, message:"Database fail."})
      if(!docs) 
        return res.json({success: false, message:"Database fail."})
      if(docs.length === 0) 
        return res.json({success: true, message: "User has no streams."})
      var streams = []
      for (var i = docs.length - 1; i >= 0; i--) {
        streams.push( {
          name : docs[i].name,
          createdon : df(new Date(docs[i].createdon), 'HH:MM d / m / yyyy'),
          isOnline : docs[i].isOnline,
          isOrphaned: docs[i].isOrphaned,
          streamid : docs[i].streamid,
        } )
      }
      res.json( {success: true, streams: streams} )  
    })
    
  })

  app.use('/api/frontend', frontEndRoutes)
}