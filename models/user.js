var mongoose          = require('mongoose')
var bcrypt            = require('bcrypt-nodejs')
var uuid              = require('node-uuid')
var winston           = require('winston')

var userSchema = mongoose.Schema( {
  local: {
    username: String,
    email: { type: String, lowercase: true, unique: true, required: true },
    password: String,
    company: String
  },
  apitoken: String,
  logins: { type: Array, default: [] },
  registrationDate: {type: Date, default: Date.now() }
} )

userSchema.pre( 'save', function (next) {
  var user = this
  if (this.isModified('local.password') || this.isNew) {
    console.log('>>> User registered.')
    bcrypt.genSalt( 10, function(err, salt) {
      if( err ) return next(err)
      bcrypt.hash( user.local.password, salt, null, function( err, hash ) {
        if(err) return next(err)
        user.local.password = hash
        user.apitoken = uuid.v4()
        next()
      })    
    })
  } else 
    next()
})

userSchema.methods.generateHash = function (password) {
  return bcrypt.hashSync( password, bcrypt.genSaltSync(8), null );
}

userSchema.methods.validPassword = function ( pw, cb ) {
  bcrypt.compare( pw, this.local.password, function( err, res ) {
    if(res === true) return cb(true)
    else return cb(false)
  })
}

module.exports = mongoose.model('User', userSchema)