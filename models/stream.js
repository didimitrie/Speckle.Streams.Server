var mongoose    = require('mongoose')

var streamSchema = mongoose.Schema( {
  ownerid : { type: String},
  streamid : { type: String},
  name: { type: String, default: 'Anonymous Stream'},
  createdon: {type: Date, default: Date.now() },
  lastEmit: {type: Date},
  lastDirectRequest: {type: Date},
  droplets: { type: Array, default: [] },
  structure: { type: Array, default: [] }, 
  isOnline: { type: Boolean, default: true},
  isOrphaned: {type: Boolean, default: false},
  private: {type: Boolean, default: false}
} )

var streamModel = mongoose.model( 'Stream', streamSchema )
module.exports = streamModel;