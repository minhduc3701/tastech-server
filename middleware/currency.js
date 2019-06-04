const currencyExchange = (req, res, next) => {
  // get company currency setting here. e.g. VND
  // axios.get(`${process.env.TRANSFERWISE_API}?source=${process.env.BASE_CURRENCY}&target=${COMPANY_CURRENCY}`)

  // exchange with transferwise from SGD to VND

  // save the rate
  req.currency = {
    code: 'VND',
    rate: 23397.5
  }

  next()
}

module.exports = {
  currencyExchange
}
