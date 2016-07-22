// IMPORTS
var express         = require('express')
var compression     = require('compression')
var cors            = require('cors')
var morgan          = require('morgan')
var cookieParser    = require('cookie-parser')
var bodyParser      = require('body-parser')
var chalk           = require('chalk')

var mongoose        = require('./.config/database')

var passport        = require('passport')

var path            = require('path')
global.APPROOT      = path.resolve(__dirname) // am i using this?

//LOGGING
var winston         = require('winston');

// HOUSEKEEPING
var app = express()
app.use( cors() )
app.use( compression() )
app.use( morgan( 'dev' ) )
app.use( cookieParser() )
app.use( bodyParser.json( {limit: '50mb'} ) )
app.use( bodyParser.urlencoded( { extended: true } ) )

// PASSPORT & AUTH
app.use( passport.initialize() )
require('./.config/passport')( passport )
require('./app/api-authentication') ( app, express )
require('./app/api-frontend') ( app, express )

// SOCKETS DUDE
var http    = require('http')
var server  = http.createServer( app )
var io      = require('socket.io').listen( server )

io.configure( function () {
  io.disable('log')
})

require('./app/streams-send-receive')( io )
// require('./app/streams-server-client')( io )
// require('./app/streams-cloud-components') ( app, express )

// WOOT
app.get('/', function (req, res) {
  res.send('Welcome!')
})

server.listen( 3001, function () {
  winston.log('info',chalk.blue.inverse('>>> http on    3001'));
  winston.log('info',chalk.cyan.inverse('>>> sockets on 3001'));
  //console.log( chalk.blue.inverse('>>> http on    3001') )
  //console.log( chalk.cyan.inverse('>>> sockets on 3001') )
})