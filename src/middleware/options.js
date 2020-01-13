const Option = require('../models/option')
const _ = require('lodash')

const getTasAdminOptions = async (req, res, next) => {
  let markupOptions = {
    hotel: {
      value: {
        type: 'percentage',
        amount: 10
      }
    },
    flight: {
      value: {
        type: 'net',
        amount: 25
      }
    }
  }
  try {
    options = await Option.find()
    let hotel =
      options.find(option => option.name === 'hotel-markup') ||
      markupOptions.hotel
    let flight =
      options.find(option => option.name === 'flight-markup') ||
      markupOptions.flight
    req.markupOptions = {
      hotel,
      flight
    }
  } catch (e) {
    req.markupOptions = markupOptions
  }
  next()
}

module.exports = {
  getTasAdminOptions
}