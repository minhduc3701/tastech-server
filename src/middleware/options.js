const Option = require('../models/option')
const Company = require('../models/company')
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
  let hotel, flight
  try {
    if (!_.isEmpty(req.user._partner)) {
      let company = await Company.findOne({
        _id: req.user._company,
        _partner: req.user._partner
      })
      // not found company
      if (!company) {
        throw 'Not found'
      }
      hotel = {
        value: {
          type: _.get(company, 'markupHotel', 'percentage'),
          amount: _.get(company, 'markupHotelAmount', 10)
        }
      }
      flight = {
        value: {
          type: _.get(company, 'markupFlight', 'net'),
          amount: _.get(company, 'markupFlightAmount', 25)
        }
      }
    } else {
      options = await Option.find()
      hotel =
        options.find(option => option.name === 'hotel-markup') ||
        markupOptions.hotel
      flight =
        options.find(option => option.name === 'flight-markup') ||
        markupOptions.flight
    }
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
