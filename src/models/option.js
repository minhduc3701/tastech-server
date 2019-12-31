const mongoose = require('mongoose')
const Schema = mongoose.Schema

const OptionSchema = new Schema(
  {
    name: String,
    markupType: {
      type: String,
      enum: ['net', 'percentage'],
      default: 'net'
    },
    value: Number
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Options', OptionSchema)
