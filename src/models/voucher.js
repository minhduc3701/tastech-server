const mongoose = require('mongoose')
const Schema = mongoose.Schema

const VoucherSchema = new Schema(
  {
    title: String,
    image: String,
    brand: String,
    brandImage: String,
    categoryId: String,
    categoryName: String,
    price: Number,
    customerInfo: Object,
    siteUserId: String,
    transactionId: String,
    _buyer: {
      type: 'ObjectId',
      required: true
    },
    _company: {
      type: 'ObjectId',
      ref: 'Company'
    },
    quantity: Number,
    pricePoint: Number,
    currency: String,
    content: String,
    note: String,
    office: Array,
    cartId: String,
    cartNumber: String,
    cartTotal: String,
    cartGiftLink: Array,
    cartGiftCode: String,
    supplier: String,
    country: String,
    expiredDate: Date
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Voucher', VoucherSchema)
