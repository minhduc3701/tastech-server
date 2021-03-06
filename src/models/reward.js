const mongoose = require('mongoose')
const Schema = mongoose.Schema

const RewardSchema = new Schema(
  {
    title: String,
    image: String,
    brand: String,
    brandImage: String,
    categoryName: String,
    price: Number,
    pricePoint: Number,
    currency: String,
    content: String,
    note: String,
    office: [
      {
        type: Object
      }
    ],
    supplier: {
      type: String,
      default: 'ezbiztrip'
    },
    country: String
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Reward', RewardSchema)
