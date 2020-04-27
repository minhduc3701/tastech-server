const moment = require('moment')

const giamsoAirlines = [
  '3U',
  '8M',
  'AA',
  'AC',
  'AF',
  'AI',
  'AT',
  'AY',
  'BA',
  'BG',
  'BI',
  'BP',
  'BR',
  'CA',
  'CI',
  'CX',
  'CZ',
  'DL',
  'DT',
  'EK',
  'ET',
  'EY',
  'FJ',
  'G3',
  'GA',
  'GF',
  'GP',
  'GX',
  'HA',
  'HM',
  'HO',
  'HR',
  'HU',
  'HX',
  'HY',
  'IE',
  'JL',
  'JP',
  'JU',
  'K6',
  'KE',
  'KK',
  'KL',
  'KQ',
  'LA',
  'LH',
  'LO',
  'LQ',
  'LX',
  'LY',
  'MF',
  'MH',
  'MK',
  'MS',
  'MU',
  'NH',
  'NX',
  'NZ',
  'OM',
  'OZ',
  'PG',
  'PN',
  'PR',
  'PX',
  'QD',
  'QF',
  'QR',
  'QV',
  'RJ',
  'S7',
  'SB',
  'SC',
  'SQ',
  'SV',
  'SW',
  'TG',
  'TK',
  'TP',
  'TR',
  'TV',
  'UA',
  'UB',
  'UL',
  'UK',
  'UN',
  'UX',
  'VA',
  'VN',
  'WY'
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
          RequestType: 'A', // C: charge and allownce, A: only allownce
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
