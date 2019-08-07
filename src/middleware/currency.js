const { supportCurrencies } = require('../config/currency')
const axios = require('axios')
const _ = require('lodash')
const Company = require('../models/company')
const { debugServer } = require('../config/debug')

const currencyExchange = async (req, res, next) => {
  try {
    let company = await Company.findById(req.user._company)

    if (
      !company ||
      !company.currency ||
      !supportCurrencies.includes(company.currency)
    ) {
      throw new Error()
    }

    const rateRes = await axios.get(
      `${process.env.TRANSFERWISE_URI}/v1/rates?source=${
        process.env.BASE_CURRENCY
      }&target=${company.currency}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TRANSFERWISE_API_KEY}`
        }
      }
    )
    if (_.isArray(rateRes.data)) {
      // save the rate
      req.currency = {
        code: company.currency,
        rate: rateRes.data[0].rate
      }
    }
  } catch (e) {
    debugServer(e)
    req.currency = {
      code: process.env.BASE_CURRENCY,
      rate: 1
    }
  }

  next()
}

const hotelbedsCurrencyExchange = async (req, res, next) => {
  try {
    let company = await Company.findById(req.user._company)

    if (
      !company ||
      !company.currency ||
      !supportCurrencies.includes(company.currency)
    ) {
      throw new Error()
    }

    const rateRes = await axios.get(
      `${process.env.TRANSFERWISE_URI}/v1/rates?source=${
        process.env.HOTELBEDS_BASE_CURRENCY
      }&target=${company.currency}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TRANSFERWISE_API_KEY}`
        }
      }
    )
    if (_.isArray(rateRes.data)) {
      // save the rate
      req.currency = {
        code: company.currency,
        rate: rateRes.data[0].rate
      }
    }
  } catch (e) {
    debugServer(e)
    req.currency = {
      code: process.env.HOTELBEDS_BASE_CURRENCY,
      rate: 1
    }
  }

  next()
}

module.exports = {
  currencyExchange,
  hotelbedsCurrencyExchange
}
