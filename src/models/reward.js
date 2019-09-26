const mongoose = require('mongoose')
const Schema = mongoose.Schema

const GiftSchema = new Schema({
  giftName: String,
  giftImage: String,
  description: String,
  brandName: String,
  brandImage: String,
  categoryId: String,
  categoryName: String,
  price: Number,
  customerInfo: Object,
  siteUserId: String,
  transactionId: String,
  buyer: {
    type: 'ObjectId',
    required: true
  },
  quantity: Number,
  pricePoint: Number,
  currency: String,
  stock: Number,
  supplier: String,
  country: String,
  expiredDate: Date
})

module.exports = mongoose.model('Gift', GiftSchema)
