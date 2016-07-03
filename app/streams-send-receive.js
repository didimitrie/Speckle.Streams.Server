// streams-send-receive
var User              = require('../models/user')
var SpkStream         = require('../models/stream')
var chalk             = require('chalk')
var shortId           = require('shortid')

module.exports = function ( io ) {

  // TODO: socket namespace streams
  // var streams = io.of('/streams')
  var clientCount = 0;

  // LOL
  var adjectives = ["Liquid", "Swirly", "Tumultous", "Clamourous", "Deafening", "Thunderous", "Damp", "Flowing", "Moist", "Solvent"]
  var names = ["Waterway", "Stream", "Brook", "Torrent", "Current", "Cascade", "Surge", "River", "Deluge", "Canal"]

  io.on('connection', function (socket) {
    console.log( chalk.magenta.inverse('>>> connected clients: ' + ++clientCount ) )

    //
    // stream emitter calls
    //

    socket.on('create-stream', function (data) {
      // emitter instantiated    
      if( !socket.authenticated ) return;
      console.log(chalk.magenta.inverse('create-stream'))
      var myStream = new SpkStream( {
        ownerid : socket.userid,
        streamid : shortId.generate(),
        name : adjectives[Math.floor(Math.random() * adjectives.length)] + " " + names[Math.floor(Math.random() * names.length)]
      })
      
      myStream.save( function (err) {
        if( err ) return socket.emit('create-stream-result', {success: false, streamid: 'lol'})  
        socket.emit('create-stream-result', {success: true, streamid: myStream.streamid })  
      }) 
    })

    socket.on('update-structure', function (data) {
      // emitter updates inputs
      console.log(chalk.magenta.inverse('update-structure'))
      console.log(data)
      SpkStream.findOne( {streamid: socket.room }, function(err, doc) {
        doc.structure = data.structure;
        doc.save()
      })

      socket.broadcast.to(socket.room).emit('update-structure', data)
    })

    socket.on('update-name', function (data) {
      // emitter updates name
      console.log(chalk.magenta.inverse('update-name'))
      // console.log(data)
      SpkStream.findOne( {streamid: socket.room }, function(err, doc) {
        doc.name = data;
        doc.save()
      })
    })

    socket.on('update-stream', function (data) {
      // emitter sends new data; 
      console.log(chalk.magenta.inverse('update-stream') + ' id: ' + socket.room)
      // console.log(data)
      SpkStream.findOne( {streamid: socket.room }, function(err, doc) {
        if(!doc) return console.log(chalk.red.inverse('Error: Trying to update non-existant stream.'))
        doc.data = data
        doc.save()
        console.log('broadcasting ')
        // console.log( data )
        socket.broadcast.to(socket.room).emit('update-clients', data);
        // emit to room
      } )
    })

    socket.on('delete-stream', function (data) {
      // emitter is destroyed; stream is orphaned
      console.log(chalk.magenta.inverse('delete-stream'))
      // console.log(data)

      SpkStream.findOne(socket.room, function(err, doc) {
        if(!doc) return console.log("problem")
        doc.isOrphaned = true
        doc.save()
      })
    })

    socket.on('document-closed', function (data) {
      // emitter goes offline; stream is offline
      SpkStream.findOne( {streamid: socket.room}, function (err, doc) {
        if(!doc) return
        doc.isOnline = false
        doc.save()
      })
      console.log(chalk.magenta.inverse('document-closed'))
      console.log(data)
    })

    //
    // shared calls
    // 

    socket.on('authenticate', function (data) {
      console.log(chalk.cyan.inverse('authentication request from client'))
      console.log(data)
      User.findOne( {apitoken: data}, function(err, doc) {
        if( err )   return socket.emit('authentication-result', {sucess: false, message:'Database fail'}) 
        if( !doc )  return socket.emit('authentication-result', {sucess: false, message:'Invalid Api Token'})
        else {
          socket.authenticated = true
          socket.apikey = data
          socket.userid = doc._id;
          socket.emit('authentication-result', {sucess: true, message:'You are logged in.'})
        }
      }) 
    })

    socket.on('join-stream', function (data) {
      // emitter or client is back online
      console.log(chalk.cyan.inverse('join stream request from client'))
      console.log(data)
      if( !socket.authenticated ) return;
      SpkStream.findOne({ streamid : data.streamid }, function (err, doc) {
        if(err) return socket.emit('join-stream-result', {success: false, message: 'Database fail.'})
        if(!doc) return socket.emit('join-stream-result', {success: false, message: 'No stream found.'})
        if(data.role === 'receiver' && socket.room!=null) {
          socket.leave(socket.room)
        }
        socket.room = data.streamid
        socket.streamname = doc.name
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~ // 
        socket.join(  data.streamid )
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~ //
        if(data.role === 'emitter') {
          doc.isOnline = true
          doc.isOrphaned = false
          doc.save()
        }
        socket.emit('join-stream-result', {success: true, message: 'Stream joined successfuly.', streamid : socket.room, streamname: socket.streamname})
      })
    })

    //
    // client calls
    // 
    socket.on('pull-stream', function (data) {
      console.log(chalk.cyan.inverse('pull stream'))
      console.log(socket.room)
      SpkStream.findOne( { streamid: socket.room }, function(err, doc) {
        if(err) return console.log('Database fail.')
        if(!doc) return console.log('Stream doesn\'t exist.')
        socket.emit('update-clients', doc.data);
      } )
    })

    socket.on('received', function (data) {

    })


    //
    // frontend calls
    // 

    socket.on('frontend-request-stream', function (data) {
      console.log(chalk.cyan.inverse('frontend-request-stream'))
      console.log(data)
      if(socket.room!=null) {
        console.log('chaning rooms')
        socket.leave(socket.room)
      }
      socket.room = data.streamid
      socket.join( data.streamid )

      SpkStream.findOne( { streamid: socket.room }, function(err, doc) {
        if(err) return console.log('Database fail.')
        if(!doc) return console.log('Stream doesn\'t exist.')
        socket.emit('update-clients', doc.data);
      } )

    } )

    //
    // the end, my friend
    // 
    socket.on('disconnect', function () {
      console.log( chalk.magenta.inverse('>>> connected clients: ' + --clientCount ) )
    })
  })
}