const {
  supportCurrencies,
  supportExpenseCurrencies
} = require('../config/currency')
const _ = require('lodash')
const Company = require('../models/company')
const { debugServer } = require('../config/debug')
const api = require('../modules/api')
const { logger } = require('../config/winston')
const { getCache, setCache } = require('../config/cache')

const currenciesExchange = async () => {
  let transferwiseCacheKey = 'transferwiseCurrencies'

  try {
    let cacheData = await getCache(transferwiseCacheKey)

    return cacheData
  } catch (e) {
    // do nothing to run the try block below
  }

  let currencies = [
    ...supportCurrencies,
    ...supportExpenseCurrencies,
    process.env.BASE_CURRENCY,
    process.env.SABRE_BASE_CURRENCY,
    process.env.HOTELBEDS_BASE_CURRENCY,
    process.env.REWARD_BASE_CURRENCY
  ]

  currencies = _.uniq(currencies)

  let results = await api.exchangeAllCurrencies()

  results = results.data.filter(
    result =>
      currencies.includes(result.source) && currencies.includes(result.target)
  )

  let exchangedResults = {}

  results.forEach(result => {
    exchangedResults[`${result.source}-${result.target}`] = {
      code: result.target,
      rate: result.rate
    }
  })

  logger.info('currenciesExchange', exchangedResults)

  // save all data for using 1 day later
  setCache(transferwiseCacheKey, exchangedResults, 3600 * 24)

  return exchangedResults
}

const findCurrencyRateBy = context => {
  return async (req, res, next) => {
    let source, target
    let company = await Company.findById(req.user._company)

    try {
      switch (context) {
        case 'sabre':
          source = process.env.SABRE_BASE_CURRENCY
          target = company.currency
          break
        case 'hotelbeds':
          source = process.env.HOTELBEDS_BASE_CURRENCY
          target = company.currency
          break
        case 'rewards':
          source = company.currency
          target = process.env.REWARD_BASE_CURRENCY
          break
        case 'urbox':
          source = 'VND'
          target = 'SGD'
          break
        case 'pkfare':
        default:
          source = process.env.BASE_CURRENCY
          target = company.currency
          break
      }

      if (!company || !target || !supportCurrencies.includes(target)) {
        throw new Error()
      }

      let currencies = await currenciesExchange()
      req.currency = currencies[`${source}-${target}`]

      if (_.isEmpty(req.currency)) {
        throw new Error()
      }
    } catch (e) {
      debugServer(e)
      req.currency = {
        code: source,
        rate: 1
      }
    }

    next()
  }
}

const rewardCurrencyRate = findCurrencyRateBy('rewards')

const currencyExchange = findCurrencyRateBy('pkfare')

const hotelbedsCurrencyExchange = findCurrencyRateBy('hotelbeds')

const sabreCurrencyExchange = findCurrencyRateBy('sabre')

const urboxCurrencyExchange = findCurrencyRateBy('urbox')

module.exports = {
  currencyExchange,
  hotelbedsCurrencyExchange,
  sabreCurrencyExchange,
  urboxCurrencyExchange,
  currenciesExchange,
  rewardCurrencyRate
}
