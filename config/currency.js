const USD = 'USD'
const SGD = 'SGD'
const VND = 'VND'

const supportCurrencies = [USD, SGD, VND]
const supportCurrenciesOptions = [
  {
    code: USD,
    name: 'United States Dollar'
  },
  {
    code: SGD,
    name: 'Singapore Dollar'
  },
  {
    code: VND,
    name: 'Vietnamese dong'
  }
]

module.exports = {
  USD,
  SGD,
  VND,
  supportCurrencies,
  supportCurrenciesOptions
}
