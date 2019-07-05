const mongoose = require('mongoose')
const Schema = mongoose.Schema

const IataCitySchema = new Schema(
  {
    _id: mongoose.Schema.Types.ObjectId
  },
  {
    collection: 'iataCities'
  }
)

module.exports = mongoose.model('IataCity', IataCitySchema)
