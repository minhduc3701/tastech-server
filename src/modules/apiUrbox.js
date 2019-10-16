const axios = require('axios')

const urboxHttp = axios.create({
  headers: { 'content-type': 'application/json' },
  baseURL: process.env.URBOX_URI
})

const URBOX_GIFTLIST_VERSION = process.env.URBOX_GIFTLIST_VERSION // 4.0
const URBOX_OTHER_API_VERSION = process.env.URBOX_OTHER_API_VERSION // 2.0

const endpoints = {
  gifts: `/${URBOX_GIFTLIST_VERSION}/gift/lists`,
  giftFilter: `/${URBOX_OTHER_API_VERSION}/gift/filter`,
  voucher: `/${URBOX_OTHER_API_VERSION}/cart/cartPayVoucher`,
  giftDetail: `/${URBOX_GIFTLIST_VERSION}/gift/detail`
}

const apiUrbox = {
  getGifts: data => {
    return urboxHttp.get(`${endpoints.gifts}`, { data })
  },
  getGiftFilter: () => {
    return urboxHttp.get(`${endpoints.giftFilter}`)
  },
  requestVoucher: data => {
    return urboxHttp.get(`${endpoints.voucher}`, { data })
  },
  getGiftDetail: data => {
    return urboxHttp.get(`${endpoints.giftDetail}`, { data })
  }
}

module.exports = apiUrbox
