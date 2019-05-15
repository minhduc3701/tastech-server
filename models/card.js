const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CardSchema = new Schema({
  customer: {},
  info: {},
  owner: {
    type: 'ObjectId',
    required: true
  }
})

module.exports = mongoose.model('Card', CardSchema)
