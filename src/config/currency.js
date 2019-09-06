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

module.exports = {
  USD,
  SGD,
  VND,
  IDR,
  supportCurrencies,
  supportCurrenciesOptions
}
