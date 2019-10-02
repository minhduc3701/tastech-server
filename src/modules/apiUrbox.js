const axios = require('axios')

const urboxHttp = axios.create({
  headers: { 'content-type': 'application/json' },
  baseURL: process.env.URBOX_URI
})

const URBOX_GIFTLIST_VERSION = process.env.URBOX_GIFTLIST_VERSION
const URBOX_OTHER_API_VERSION = process.env.URBOX_OTHER_API_VERSION

const endpoints = {
  gifts: `/${URBOX_GIFTLIST_VERSION}/gift/lists`,
  voucher: `/${URBOX_OTHER_API_VERSION}/cart/cartPayVoucher`,
  giftDetail: `/${URBOX_GIFTLIST_VERSION}/gift/detail`
}

const apiUrbox = {
  getGifts: data => {
    return urboxHttp.get(`${endpoints.gifts}`, { data })
  },
  requestVoucher: data => {
    return urboxHttp.get(`${endpoints.voucher}`, { data })
  },
  getGiftDetail: data => {
    return urboxHttp.get(`${endpoints.giftDetail}`, { data })
  }
}

module.exports = apiUrbox
