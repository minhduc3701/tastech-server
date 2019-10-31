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
    let xmlBodyStr = `<soap-env:Envelope xmlns:soap-env="http://schemas.xmlsoap.org/soap/envelope/" xmlns:eb="http://www.ebxml.org/namespaces/messageHeader" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsd="http://www.w3.org/1999/XMLSchema">
    <soap-env:Header>
       <eb:MessageHeader soap-env:mustUnderstand="1" eb:version="1.0">
          <eb:From>
             <eb:PartyId />
          </eb:From>
          <eb:To>
             <eb:PartyId />
          </eb:To>
          <eb:CPAId>${process.env.SABRE_USER_ID}</eb:CPAId>
          <eb:ConversationId>V1@280b16ec-5eac-46c0-893f-c88f8e8cb632@310b16ec-5dad-46c0-893f-c88f8e8cb643@780b16ec-5eac-46c0-893f-c88f8e8cb699</eb:ConversationId>
          <eb:Service>SessionCreateRQ</eb:Service>
          <eb:Action>SessionCreateRQ</eb:Action>
          <eb:MessageData>
            <eb:MessageId/>
            <eb:Timestamp/>
          </eb:MessageData>
       </eb:MessageHeader>
       <wsse:Security xmlns:wsse="http://schemas.xmlsoap.org/ws/2002/12/secext" xmlns:wsu="http://schemas.xmlsoap.org/ws/2002/12/utility">
          <wsse:UsernameToken>
             <wsse:Username>${process.env.SABRE_USERNAME}</wsse:Username>
             <wsse:Password>${process.env.SABRE_SECRET_KEY}</wsse:Password>
             <Organization>${process.env.SABRE_USER_ID}</Organization>
             <Domain>AA</Domain>
          </wsse:UsernameToken>
       </wsse:Security>
    </soap-env:Header>
    <soap-env:Body>
       <eb:Manifest soap-env:mustUnderstand="1" eb:version="1.0">
          <eb:Reference xlink:href="cid:rootelement" xlink:type="simple" />
       </eb:Manifest>
       <SessionCreateRQ>
          <POS>
             <Source PseudoCityCode="${process.env.SABRE_USER_ID}" />
          </POS>
       </SessionCreateRQ>
       <ns:SessionCreateRQ xmlns:ns="http://www.opentravel.org/OTA/2002/11" />
    </soap-env:Body>
 </soap-env:Envelope>`
    let sabreRes = await apiSabre.callSabreSoapAPI(xmlBodyStr)
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
