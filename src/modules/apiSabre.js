const axios = require('axios')
const querystring = require('querystring')

const flightHttp = axios.create({
  baseURL: process.env.SABRE_URI
})

const config = {
  headers: { 'Content-Type': 'text/xml' }
}

const apiSabre = {
  shopping: (data, sabreToken) => {
    return flightHttp.post(`/v1/offers/shop`, data, {
      headers: {
        Authorization: `Bearer ${sabreToken}`
      }
    })
  },
  createPNR: (data, sabreToken) => {
    return flightHttp.post(`/v2.2.0/passenger/records?mode=create`, data, {
      headers: {
        Authorization: `Bearer ${sabreToken}`
      }
    })
  },
  getToken: encodeToken => {
    return flightHttp.post(
      `/v2/auth/token`,
      querystring.stringify({
        grant_type: 'client_credentials'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${encodeToken}`
        }
      }
    )
  },
  getSoapSecurityToken: () => {
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

    return axios.post(process.env.SABRE_SOAP_URI, xmlBodyStr, config)
  },
  getFlightFareRule: xmlBodyStr => {
    return axios.post(process.env.SABRE_SOAP_URI, xmlBodyStr, config)
  }
}

module.exports = apiSabre
