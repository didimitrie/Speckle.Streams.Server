// streams-send-receive
var User              = require('../models/user')
var SpkStream         = require('../models/stream')
var chalk             = require('chalk')
var shortId           = require('shortid')
//LOGGING
var winston         = require('winston');

module.exports = function ( io ) {
  
  //LOGGING
  if(process.env.NODE_ENV = 'development') { 
    winston.level = 'debug';
    winston.log('debug', '>>> Logging with debug!');
  }

  // TODO: socket namespace streams
  // var streams = io.of('/streams')
  var clientCount = 0;

  // LOL
  var adjectives = ["Liquid", "Swirly", "Tumultous", "Clamourous", "Deafening", "Thunderous", "Damp", "Flowing", "Moist", "Solvent", "Gushing", "Soaking"]
  var names = ["Waterway", "Stream", "Brook", "Torrent", "Current", "Cascade", "Surge", "River", "Deluge", "Canal", "Wash", "Outburst"]

  io.on('connection', function (socket) {
    winston.log('info', chalk.magenta.inverse('>>> connected clients: ' + ++clientCount ))
    //console.log( chalk.magenta.inverse('>>> connected clients: ' + ++clientCount ) )

    //
    // stream emitter calls
    //

    socket.on('create-stream', function (data) {
      // emitter instantiated    
      if( !socket.authenticated ) {
        winston.log('debug', chalk.magenta.inverse('create-stream: not authenticated'))
        return;
      }
      winston.log('info', chalk.magenta.inverse('create-stream'))
      var myStream = new SpkStream( {
        ownerid : socket.userid,
        streamid : shortId.generate(),
        name : adjectives[Math.floor(Math.random() * adjectives.length)] + " " + names[Math.floor(Math.random() * names.length)]
      })
      
      myStream.save( function (err) {
        if( err ) { 
          winston.log('debug', 'create-stream: stream creation error')
          return socket.emit('create-stream-result', {success: false, streamid: 'lol'})
        } 
        winston.log('debug', 'create-stream: ' + {success: true, streamid: myStream.streamid})
        socket.emit('create-stream-result', {success: true, streamid: myStream.streamid })  
      }) 
    })

    socket.on('update-structure', function (data) {
      // emitter updates inputs
      winston.log('info', chalk.magenta.inverse('update-structure'))
      winston.log('info', data)

      SpkStream.findOne( {streamid: socket.room }, function(err, doc) {
        doc.structure = data.structure;
        doc.save()
      })

      socket.broadcast.to(socket.room).emit('update-structure', data)
    })

    socket.on('update-name', function (data) {
      // emitter updates name
      winston.log('info', chalk.magenta.inverse('update-name'))
      winston.log('info', data)
      SpkStream.findOne( {streamid: socket.room }, function(err, doc) {
        doc.name = data;
        doc.save()
      })
    })

    socket.on('update-stream', function (data) {
      // emitter sends new data; 
      winston.log('info', chalk.magenta.inverse('update-stream') + ' id: ' + socket.room)
      winston.log('silly', data)
      SpkStream.findOne( {streamid: socket.room }, function(err, doc) {
        if(!doc) {
          return winston.log('info', chalk.red.inverse('Error: Trying to update non-existant stream.'))
          //return console.log(chalk.red.inverse('Error: Trying to update non-existant stream.'))
        }
        doc.data = data
        doc.lastEmit = Date.now()
        doc.save()
        winston.log('info', 'Socket: broadcasting to room:' + socket.room)
        winston.log('silly', data )

        socket.broadcast.to(socket.room).emit('update-clients', data);
      } )
    })


    socket.on('update-save-stream', function (data) {
      // emitter sends new data; 
      // save to cache as well
      winston.log('info', chalk.magenta.inverse('update-save-stream') + ' id: ' + socket.room)
      winston.log('silly', data)
      SpkStream.findOne( {streamid: socket.room }, function(err, doc) {
        if(!doc) {
          return winston.log('info', chalk.red.inverse('Error: Trying to update non-existant stream.'))
        }
        doc.cachedData.push({ timestamp: Date.now(), data: data })
        doc.data = data
        doc.lastEmit = Date.now()
        doc.save()
        winston.log('info', 'Socket: broadcasting to room:' + socket.room)
        winston.log('silly', data )

        socket.broadcast.to(socket.room).emit('update-clients', data);
      } )
    })

    socket.on('update-sliders', function (data) {
      // emitter sends new data; 
      winston.log('info', chalk.magenta.inverse('update-sliders') + ' id: ' + socket.room)
      winston.log('silly', data)

      SpkStream.findOne( {streamid: socket.room }, function(err, doc) {
        if(!doc) {
          return winston.log('info', chalk.red.inverse('Error: Trying to update non-existant stream.'))
        }
        doc.data = data
        doc.save()
        winston.log('info', 'Socket: broadcasting sliders to room:' + socket.room)
        winston.log('silly', data )
        socket.broadcast.to(socket.room).emit('update-sliders', data);
        // emit to room
      } )
    })

    socket.on('delete-stream', function (data) {
      // emitter is destroyed; stream is orphaned
      winston.log('info', chalk.magenta.inverse('Socket: delete-stream'))
      winston.log('silly', data)
      //console.log(chalk.magenta.inverse('delete-stream'))

      SpkStream.findOne( {streamid: socket.room}, function(err, doc) {
        if(!doc) return console.log("problem")
        doc.isOrphaned = true
        doc.isOnline = false
        doc.save()
      })
    })

    socket.on('document-closed', function (data) {
      // emitter goes offline; stream is offline
      winston.log('debug', chalk.magenta.inverse('Socket: document closed'))
      SpkStream.findOne( {streamid: socket.room}, function (err, doc) {
        if(!doc) return
        doc.isOnline = false
        doc.save()
      })
      winston.log('info', chalk.magenta.inverse('document-closed'))
      winston.log('info', data)
    })

    //
    // shared calls
    // 

    socket.on('authenticate', function (data) {
      winston.log('info', chalk.cyan.inverse('Authentication: request from client'))
      winston.log('info', data) 

      data = data.replace(/\n$/, "")
      User.findOne( {apitoken: data}, function(err, doc) {
        if( err )   {
          winston.log('debug', chalk.cyan.inverse('Authentication: Database fail'))
          return socket.emit('authentication-result', {sucess: false, message:'Database fail'})
        }
        if( !doc )  {
          winston.log('debug', chalk.cyan.inverse('Authentication: Invalid Api Token'))
          return socket.emit('authentication-result', {sucess: false, message:'Invalid Api Token'})
        }
        else {
          socket.authenticated = true
          socket.apikey = data
          socket.userid = doc._id;
          winston.log('debug', chalk.cyan.inverse('Authentication: User logged in'))
          socket.emit('authentication-result', {sucess: true, message:'You are logged in.'})
        }
      }) 
    })

    socket.on('join-stream', function (data) {
      // emitter or client is back online
      winston.log('info', chalk.cyan.inverse('join-stream: request from client'))
      winston.log('info', data) 
      //console.log(chalk.cyan.inverse('join stream request from client'))
      //console.log(data)
      if( !socket.authenticated ) return;
      SpkStream.findOne({ streamid : data.streamid }, function (err, doc) {
        if(err) {
          winston.log('info','join-stream: Database fail.')
          return socket.emit('join-stream-result', {success: false, message: 'Database fail.'})
        }
        if(!doc) {
          winston.log('info','join-stream: No stream found.')
          return socket.emit('join-stream-result', {success: false, message: 'No stream found.'})
        }
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
        winston.log('debug', 'join-stream-result', {success: true, message: 'Stream joined successfuly.', streamid : socket.room, streamname: socket.streamname})
        socket.emit('join-stream-result', {success: true, message: 'Stream joined successfuly.', streamid : socket.room, streamname: socket.streamname})
      })
    })

    //
    // client calls
    // 
    socket.on('pull-stream', function (data) {
      winston.log('info', chalk.cyan.inverse('pull stream: request from gh received'))
      winston.log('info', socket.room)
      SpkStream.findOne( { streamid: socket.room }, function(err, doc) {
        if(err) {
          winston.log('debug', 'pull stream: Database fail.')
          return winston.log('info','Database fail.')
        }
        if(!doc) {
          winston.log('debug', 'pull stream: Stream doesn\'t exist.')
          return winston.log('info','Stream doesn\'t exist.')
        }
        doc.lastDirectRequest = Date.now()
        doc.save()
        winston.log('debug', 'pull stream: updating clients')
        socket.emit('update-clients', doc.data);
      } )
    })

    socket.on('received', function (data) {

    })


    //
    // frontend calls
    // 

    socket.on('frontend-request-stream', function (data) {
      winston.log('info', chalk.cyan.inverse('frontend-request-stream from ' + socket.id))
      winston.log('debug', data)



      if(socket.room !=null ) {
        winston.log('info','frontend-request-stream: changing rooms to:', data.streamid)
        //console.log('changing rooms')
        socket.leave(socket.room)
      }
      socket.room = data.streamid
      socket.join( data.streamid )

      SpkStream.findOne( { streamid: socket.room }, function(err, doc) {
        if(err) {
          winston.log('debug', 'frontend-request-stream: Database fail.')
          return console.log('Database fail.')
        }
        if(!doc) {
          winston.log('debug', 'frontend-request-stream: Stream doesn\'t exist.')
          return console.log('Stream doesn\'t exist.')
        }
        winston.log('debug', 'frontend-request-stream: updating clients')
        socket.emit('update-clients', doc.data);
      } )

    } )

    //
    // the end, my friend
    // 
    socket.on('disconnect', function () {
      winston.log('info', chalk.magenta.inverse('>>> connected clients: ' + --clientCount ) )
      //console.log( chalk.magenta.inverse('>>> connected clients: ' + --clientCount ) )
    })
  })
}