const USD = 'USD'
const SGD = 'SGD'
const VND = 'VND'
const IDR = 'IDR'

const supportCurrencies = [USD, SGD, VND, IDR]
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
  },
  {
    code: IDR,
    name: 'Indonesian rupiah'
  }
]

const SGD_VND_CURRENCY_RATE = 17000

module.exports = {
  USD,
  SGD,
  VND,
  IDR,
  SGD_VND_CURRENCY_RATE,
  supportCurrencies,
  supportCurrenciesOptions
}
