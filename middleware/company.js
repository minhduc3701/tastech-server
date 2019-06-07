const { supportCurrencies } = require('../config/currency')
const Company = require('../models/company')

const currentCompany = async (req, res, next) => {
  try {
    let company = await Company.findById(req.user._company)

    if (!company) {
      return res.status(404).send()
    }

    if (!supportCurrencies.includes(company.currency)) {
      company.currency = process.env.BASE_CURRENCY
    }

    req.company = company

    next()
  } catch (e) {
    res.status(400).send()
  }
}

module.exports = {
  currentCompany
}
