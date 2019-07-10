const axios = require('axios')
const { authentication } = require('../config/sabre')

const flightHttp = axios.create({
  baseURL: process.env.SABRE_URI,
  headers: {
    Authorization: `Bearer ${authentication.token}`
  }
})

const apiSabre = {
  shopping: data => {
    return flightHttp.post(`/v1/offers/shop`, data)
  }
}

module.exports = apiSabre
