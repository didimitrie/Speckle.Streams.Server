
var User              = require('../models/user')
var jwt               = require('jsonwebtoken')
var SessionSecret     = require('../.secrets/session.secret')

var dateFormat        = require('dateformat')

module.exports = function( app, express ) {

  var apiRoutes = express.Router()

  apiRoutes.post('/register', function (req, res) {
    if( ! req.body.email || !req.body.password ) {
      res.json( {success: false, message:'Please enter email and password'} )
    } else {
      var newUser = new User( {
        local: {
          email: req.body.email,
          password: req.body.password,
          company: req.body.company,
          username: req.body.username
        }
      } )
      newUser.save( function(err) {
        if( err ) return res.json( {success:false, message:'Email is taken'} )
        // TODO: on success create and send a jwt token bitch
        return res.json( { success: true, message:'Yay!' } )
      })
    }
  })

  apiRoutes.post('/authenticate', function (req, res) {
    User.findOne({ 'local.email': req.body.email }, function (err, user) {
      if( err ) throw err;
      if( !user ) res.json( { success: false, message: 'No account with this email exists.'} )
      else {
        user.validPassword( req.body.password, function( isMatch ) {
          if( !isMatch ) res.json( { success: false, message: 'Wrong password.'} )
          else{
            user.logins.push( { date: Date.now() } )
            user.save()
            
            var profile = {
              id: user._id,
              apitoken : user.apitoken,
              username : user.local.username,
              lastlogin: dateFormat( user.logins[user.logins.length-1].date)
            }
            var token = jwt.sign( profile, SessionSecret, { expiresIn: 86400 } )
            res.json( {success: true, token: 'JWT ' + token, profile: profile } )                 
          }
        })
      }
    })
  })

  app.use('/auth', apiRoutes)
}