const crypto = require('crypto')

const partnerId = process.env.PKFARE_PARTNER_ID
const partnerKey = process.env.PKFARE_PARTNER_KEY

// https://odino.org/generating-the-md5-hash-of-a-string-in-nodejs/
const sign = crypto
  .createHash('md5')
  .update(partnerId + partnerKey)
  .digest('hex')

const authentication = {
  partnerId,
  sign
}

module.exports = {
  authentication
}
