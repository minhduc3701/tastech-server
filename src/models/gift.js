const mongoose = require('mongoose')
const Schema = mongoose.Schema

const GiftSchema = new Schema({
  giftName: String,
  giftImage: String,
  giftImages: Array,
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
  cartId: String,
  cartNumber: String,
  cartTotal: String,
  cartGiftLink: Array,
  cartGiftLinkCoce: Array,
  supplier: String
})

module.exports = mongoose.model('Gift', GiftSchema)
