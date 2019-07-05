const CryptoJS = require('crypto-js')

//Begin UTC creation
var utcDate = Math.floor(new Date().getTime() / 1000)

//Begin Signature Assembly
var hotelKey = process.env.HOTELBEDS_HOTEL_KEY
var hotelSecret = process.env.HOTELBEDS_HOTEL_SECRET

var assemble = hotelKey + hotelSecret + utcDate

//Begin SHA-256 Encryption
hash = CryptoJS.SHA256(assemble).toString()
encryption = hash.toString(CryptoJS.enc.Hex)

const headers = {
  'Api-key': process.env.HOTELBEDS_HOTEL_KEY,
  'X-Signature': encryption,
  Accept: 'application/json',
  'Content-Type': 'application/json'
}

module.exports = {
  headers
}
