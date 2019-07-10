const axios = require('axios')
const { debugServer } = require('../config/debug')
const apiSabre = require('../modules/apiSabre')

const sabreToken = async (req, res, next) => {
  try {
    let encodeId = Buffer.from(process.env.SABRE_CLIENT_ID).toString('base64')
    let encodeKey = Buffer.from(process.env.SABRE_SECRETE_KEY).toString(
      'base64'
    )
    let encodeToken = Buffer.from(`${encodeId}:${encodeKey}`).toString('base64')
    let sabreRes = await apiSabre.getToken(encodeToken)
    req.sabreToken = sabreRes.data.access_token
  } catch (e) {
    debugServer(e)
    req.sabreToken = ''
  }
  next()
}
module.exports = {
  sabreToken
}
