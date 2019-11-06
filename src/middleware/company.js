const { supportCurrencies } = require('../config/currency')
const Company = require('../models/company')

const currentCompany = async (req, res, next) => {
  try {
    let company = await Company.findById(req.user._company)

    if (!company) {
      throw new Error('Company not found')
    }

    if (!supportCurrencies.includes(company.currency)) {
      company.currency = process.env.BASE_CURRENCY
    }

    req.company = company
  } catch (e) {
    req.company = {
      country: company.country,
      currency: process.env.BASE_CURRENCY
    }
  }

  next()
}

module.exports = {
  currentCompany
}
