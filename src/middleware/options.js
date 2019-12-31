const Option = require('../models/option')
const _ = require('lodash')

const getTasAdminOption = async (req, res, next) => {
  let defaultOption = {
    hotel: {
      markupType: 'percentage',
      value: 5
    },
    flight: {
      markupType: 'net',
      value: 20
    }
  }
  try {
    options = await Option.find()
    let hotel =
      options.find(option => option.name === 'hotel') || defaultOption.hotel
    let flight =
      options.find(option => option.name === 'flight') || defaultOption.flight
    req.option = {
      hotel,
      flight
    }
  } catch (e) {
    req.option = defaultOption
  }
  next()
}

module.exports = {
  getTasAdminOption
}
