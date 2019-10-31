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
  callSabreSoapAPI: xmlBodyStr => {
    return axios.post(process.env.SABRE_SOAP_URI, xmlBodyStr, config)
  }
}

module.exports = apiSabre
