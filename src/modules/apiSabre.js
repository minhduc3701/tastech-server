const axios = require('axios')
const querystring = require('querystring')

const flightHttp = axios.create({
  baseURL: process.env.SABRE_URI
})
console.log(process.env.SABRE_URI)

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
  }
}

module.exports = apiSabre
