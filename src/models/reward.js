const mongoose = require('mongoose')
const Schema = mongoose.Schema

const RewardSchema = new Schema(
  {
    title: String,
    image: String,
    description: String,
    brand: String,
    brandImage: String,
    categoryName: String,
    price: Number,
    pricePoint: Number,
    currency: String,
    content: String,
    note: String,
    office: Array,
    supplier: String,
    country: String,
    expiredDate: Date
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Reward', RewardSchema)
