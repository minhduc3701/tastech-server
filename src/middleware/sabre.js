const axios = require('axios')
const { debugServer } = require('../config/debug')
const apiSabre = require('../modules/apiSabre')
const convert = require('xml-js')
const _ = require('lodash')
const sabreToken = async (req, res, next) => {
  if (req.trip && _.get(req.trip, 'flight.supplier') !== 'sabre') {
    next()
    return
  }
  try {
    let encodeId = Buffer.from(process.env.SABRE_CLIENT_ID).toString('base64')
    let encodeKey = Buffer.from(process.env.SABRE_SECRET_KEY).toString('base64')
    let encodeToken = Buffer.from(`${encodeId}:${encodeKey}`).toString('base64')
    let sabreRes = await apiSabre.getToken(encodeToken)
    req.sabreToken = sabreRes.data.access_token
  } catch (e) {
    debugServer(e)
    req.sabreToken = ''
  }
  next()
}

const securityToken = async (req, res, next) => {
  try {
    let sabreRes = await apiSabre.getSoapSecurityToken()
    let result = convert.xml2json(sabreRes.data, { compact: true, spaces: 4 })
    result = JSON.parse(result)
    req.securityToken = _.get(
      result,
      '[soap-env:Envelope][soap-env:Header][wsse:Security][wsse:BinarySecurityToken][_text]',
      'wrong'
    )
  } catch (e) {
    console.log(e)
    req.securityToken = ''
  }
  next()
}

module.exports = {
  sabreToken,
  securityToken
}
