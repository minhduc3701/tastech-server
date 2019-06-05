const { VND, USD, SGD } = require('../config/currency')
const axios = require('axios')
const _ = require('lodash')

const currencyExchange = async (req, res, next) => {
  // get company currency setting here. e.g. VND
  const COMPANY_CURRENCY = 'VND'

  try {
    const rateRes = await axios.get(
      `${process.env.TRANSFERWISE_URI}/v1/rates?source=${
        process.env.BASE_CURRENCY
      }&target=${COMPANY_CURRENCY}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TRANSFERWISE_API_KEY}`
        }
      }
    )
    if (_.isArray(rateRes.data)) {
      // save the rate
      req.currency = {
        code: COMPANY_CURRENCY,
        rate: rateRes.data[0].rate
      }
    }
  } catch (e) {
    req.currency = {
      code: process.env.BASE_CURRENCY,
      rate: 1
    }
  }

  next()
}

module.exports = {
  currencyExchange
}
