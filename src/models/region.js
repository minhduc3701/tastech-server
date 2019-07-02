const mongoose = require('mongoose')
const Schema = mongoose.Schema

const RegionSchema = new Schema({
  _id: Number
})

module.exports = mongoose.model('Region', RegionSchema)
