const moment = require('moment')

const giamsoAirlines = [
  '3U',
  'BG',
  'EK',
  'HO',
  'K6',
  'LY',
  'OZ',
  'SB',
  'TV',
  '8M',
  'BI',
  'ET',
  'HR',
  'KE',
  'MF',
  'PG',
  'SC',
  'UA',
  '9W',
  'BP',
  'EY',
  'HU',
  'KK',
  'MH',
  'PN',
  'SQ',
  'UB',
  'AA',
  'BR',
  'FJ',
  'HX',
  'KL',
  'MI',
  'PR',
  'SU',
  'UL',
  'AC',
  'CA',
  'G3',
  'HY',
  'KQ',
  'MK',
  'PX',
  'SV',
  'UN',
  'AF',
  'CI',
  'GA',
  'IE',
  'LA',
  'MU',
  'QD',
  'SW',
  'UX',
  'AI',
  'CX',
  'GE',
  'J8',
  'LH',
  'NH',
  'QF',
  'TG',
  'VA',
  'AT',
  'CZ',
  'GF',
  'JL',
  'LO',
  'NX',
  'QR',
  'TK',
  'VN',
  'AY',
  'DL',
  'GP',
  'JP',
  'LQ',
  'NZ',
  'QV',
  'TP',
  'WY',
  'BA',
  'DT',
  'HM',
  'JU',
  'LX',
  'O8',
  'S7',
  'TR',
  'ZI'
]

const makeSabreRequestData = search => {
  let isRoundTrip = search.searchAirLegs.length === 2
  let OriginDestinationInformation = [
    {
      DepartureDateTime: search.searchAirLegs[0].departureDate,
      DestinationLocation: {
        LocationCode: search.searchAirLegs[0].destination
      },
      OriginLocation: {
        LocationCode: search.searchAirLegs[0].origin
      },
      TPA_Extensions: {
        CabinPref: {
          Cabin: search.cabinClass
        }
      }
    }
  ]
  if (isRoundTrip) {
    OriginDestinationInformation.push({
      DepartureDateTime: search.searchAirLegs[1].departureDate,
      DestinationLocation: {
        LocationCode: search.searchAirLegs[1].destination
      },
      OriginLocation: {
        LocationCode: search.searchAirLegs[1].origin
      },
      TPA_Extensions: {
        CabinPref: {
          Cabin: search.cabinClass
        }
      }
    })
  }
  let VendorPref = []
  giamsoAirlines.map(airline => {
    VendorPref.push({
      Code: airline,
      PreferLevel: 'Only',
      Type: 'Operating'
    })
  })
  let data = {
    OTA_AirLowFareSearchRQ: {
      OriginDestinationInformation,
      POS: {
        Source: [
          {
            PseudoCityCode: process.env.SABRE_USER_ID,
            RequestorID: {
              CompanyName: {
                Code: 'TN'
              },
              ID: '1',
              Type: '1'
            }
          }
        ]
      },
      TPA_Extensions: {
        IntelliSellTransaction: {
          RequestType: {
            Name: '50ITINS'
          }
        }
      },
      TravelPreferences: {
        Baggage: {
          RequestType: 'C', // C: charge and allownce, A: only allownce
          Description: true,
          RequestedPieces: 2,
          FreePieceRequired: true
        },
        VendorPref
      },
      TravelerInfoSummary: {
        AirTravelerAvail: [
          {
            PassengerTypeQuantity: [
              {
                Code: 'ADT',
                Quantity: search.adults
              }
            ]
          }
        ],
        SeatsRequested: [search.adults]
      },
      Version: '1'
    }
  }

  return data
}

const makeSabreSearchRequestFromBudget = (flight, policy) => {
  let codeClassOptions = {
    Economy: 'Y',
    PremiumEconomy: 'S',
    Business: 'C',
    First: 'F'
  }

  let searchAirLegsSabre = [
    {
      departureDate: `${moment(flight.departDate).format(
        'YYYY-MM-DD'
      )}T00:00:00`,
      destination: flight.returnDestinationCode,
      origin: flight.departDestinationCode
    }
  ]
  if (flight.flightType === 'round-trip') {
    searchAirLegsSabre.push({
      departureDate: `${moment(flight.returnDate).format(
        'YYYY-MM-DD'
      )}T00:00:00`,
      destination: flight.departDestinationCode,
      origin: flight.returnDestinationCode
    })
  }

  return {
    adults: 1,
    cabinClass: codeClassOptions[policy.flightClass],
    searchAirLegs: searchAirLegsSabre
  }
}

module.exports = {
  giamsoAirlines,
  makeSabreRequestData,
  makeSabreSearchRequestFromBudget
}
