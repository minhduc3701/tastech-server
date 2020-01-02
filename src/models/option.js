const mongoose = require('mongoose')
const Schema = mongoose.Schema

const OptionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    value: Object
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Options', OptionSchema)
