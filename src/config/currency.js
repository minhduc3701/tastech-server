const USD = 'USD'
const SGD = 'SGD'
const VND = 'VND'
const IDR = 'IDR'
const THB = 'THB'
const MYR = 'MYR'
const MMK = 'MMK'
const KHR = 'KHR'
const LAK = 'LAK'
const BND = 'BND'
const PHP = 'PHP'
const EUR = 'EUR'
const JPY = 'JPY'
const GBP = 'GBP'
const AUD = 'AUD'
const CHF = 'CHF'
const CNY = 'CNY'
const HKD = 'HKD'
const NZD = 'NZD'
const SEK = 'SEK'
const KRW = 'KRW'
const NOK = 'NOK'
const MXN = 'MXN'
const INR = 'INR'
const RUB = 'RUB'
const ZAR = 'ZAR'
const TRY = 'TRY'
const BRL = 'BRL'
const TWD = 'TWD'
const DKK = 'DKK'
const PLN = 'PLN'
const HUF = 'HUF'
const CZK = 'CZK'
const ILS = 'ILS'
const CLP = 'CLP'
const AED = 'AED'
const COP = 'COP'
const SAR = 'SAR'
const RON = 'RON'
const CAD = 'CAD'

const supportCurrencies = [
  USD,
  SGD,
  VND,
  IDR,
  THB,
  MYR,
  MMK,
  KHR,
  LAK,
  BND,
  PHP
]

const supportExpenseCurrencies = [
  ...supportCurrencies,
  EUR,
  JPY,
  GBP,
  AUD,
  CAD,
  CHF,
  CNY,
  HKD,
  NZD,
  SEK,
  KRW,
  NOK,
  MXN,
  INR,
  RUB,
  ZAR,
  TRY,
  BRL,
  TWD,
  DKK,
  PLN,
  HUF,
  CZK,
  ILS,
  CLP,
  AED,
  COP,
  SAR,
  RON
]
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
    name: 'Vietnamese Dong'
  },
  {
    code: IDR,
    name: 'Indonesian Rupiah'
  },
  {
    code: THB,
    name: 'Thai Baht'
  },
  {
    code: MYR,
    name: 'Malaysian Ringgit'
  },
  {
    code: MMK,
    name: 'Burmese Kyat'
  },
  {
    code: KHR,
    name: 'Cambodian Riel'
  },
  {
    code: LAK,
    name: 'Lao Kip'
  },
  {
    code: BND,
    name: 'Brunei Dollar'
  },
  {
    code: PHP,
    name: 'Philippine Peso'
  }
]

const supportExpenseCurrenciesOptions = [
  ...supportCurrenciesOptions,
  {
    code: EUR,
    name: 'Euro'
  },
  {
    code: JPY,
    name: 'Japanese yen'
  },
  {
    code: GBP,
    name: 'Pound sterling'
  },
  {
    code: AUD,
    name: 'Australian dollar'
  },
  {
    code: CAD,
    name: 'Canadian dollar'
  },
  {
    code: CHF,
    name: 'Swiss franc'
  },
  {
    code: CNY,
    name: 'Renminbi'
  },
  {
    code: HKD,
    name: 'Hong Kong dollar'
  },
  {
    code: NZD,
    name: 'New Zealand dollar'
  },
  {
    code: SEK,
    name: 'Swedish krona'
  },
  {
    code: KRW,
    name: 'South Korean won'
  },
  {
    code: NOK,
    name: 'Norwegian krone'
  },
  {
    code: MXN,
    name: 'Mexican peso'
  },
  {
    code: INR,
    name: 'Indian rupee'
  },
  {
    code: RUB,
    name: 'Russian ruble'
  },
  {
    code: ZAR,
    name: 'South African rand'
  },
  {
    code: TRY,
    name: 'Turkish lira'
  },
  {
    code: BRL,
    name: 'Brazilian real'
  },
  {
    code: TWD,
    name: 'New Taiwan dollar'
  },
  {
    code: DKK,
    name: 'Danish krone'
  },
  {
    code: PLN,
    name: 'Polish zloty'
  },
  {
    code: HUF,
    name: 'Hungarian forint'
  },
  {
    code: CZK,
    name: 'Czech koruna'
  },
  {
    code: ILS,
    name: 'Israeli new shekel'
  },
  {
    code: CLP,
    name: 'Chilean peso'
  },
  {
    code: AED,
    name: 'UAE dirham'
  },
  {
    code: COP,
    name: 'Colombian peso'
  },
  {
    code: SAR,
    name: 'Saudi riyal'
  },
  {
    code: RON,
    name: 'Romanian leu'
  }
]
module.exports = {
  USD,
  SGD,
  VND,
  IDR,
  MYR,
  MMK,
  KHR,
  LAK,
  BND,
  PHP,
  EUR,
  JPY,
  GBP,
  AUD,
  CAD,
  CHF,
  CNY,
  HKD,
  NZD,
  SEK,
  KRW,
  NOK,
  MXN,
  INR,
  RUB,
  ZAR,
  TRY,
  BRL,
  TWD,
  DKK,
  PLN,
  THB,
  HUF,
  CZK,
  ILS,
  CLP,
  AED,
  COP,
  SAR,
  RON,
  supportCurrencies,
  supportCurrenciesOptions,
  supportExpenseCurrencies,
  supportExpenseCurrenciesOptions
}
