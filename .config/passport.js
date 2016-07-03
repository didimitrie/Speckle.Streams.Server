var JwtStrategy       = require('passport-jwt').Strategy
var ExtractJwt        = require('passport-jwt').ExtractJwt

var User              = require('../models/user')
var SessionSecret     = require('../.secrets/session.secret')

module.exports = function( passport ) {
  var opts = {}
  opts.jwtFromRequest = ExtractJwt.fromAuthHeader()
  opts.secretOrKey    = SessionSecret

  passport.use( new JwtStrategy( opts, function( jwt_payload, done ) {
    User.findOne( { _id: jwt_payload.id }, function( err, user ) {
      if( err ) return done( err, false ) 
      if( user ) done( null, user )
      else done( null, false )
    } )
  }))

}