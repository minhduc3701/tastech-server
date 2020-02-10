const mongoose = require('mongoose')
const Schema = mongoose.Schema

const FlyerProgramSchema = new Schema(
  {
    name: String,
    iata: String
  },
  {
    collection: 'flyerPrograms'
  }
)

module.exports = mongoose.model('FlyerProgram', FlyerProgramSchema)
