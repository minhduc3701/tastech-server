const mongoose = require('mongoose')
const Schema = mongoose.Schema

const OptionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    // markupType: {
    //   type: String,
    //   enum: ['net', 'percentage'],
    //   default: 'net'
    // },
    value: Object
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Options', OptionSchema)
