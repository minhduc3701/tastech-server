const axios = require('axios')

router.post('/shopping', async (req, res) => {
  let data = {
    OTA_AirLowFareSearchRQ: {
      OriginDestinationInformation: [
        {
          DepartureDateTime: '2019-07-21T00:00:00',
          DestinationLocation: {
            LocationCode: 'BKK'
          },
          OriginLocation: {
            LocationCode: 'OSA'
          },
          RPH: '0'
        },
        {
          DepartureDateTime: '2019-07-22T00:00:00',
          DestinationLocation: {
            LocationCode: 'OSA'
          },
          OriginLocation: {
            LocationCode: 'BKK'
          },
          RPH: '1'
        }
      ],
      POS: {
        Source: [
          {
            PseudoCityCode: 'F9CE',
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
            Name: '200ITINS'
          }
        }
      },
      TravelPreferences: {
        TPA_Extensions: {
          DataSources: {
            ATPCO: 'Enable',
            LCC: 'Disable',
            NDC: 'Disable'
          },
          NumTrips: {}
        }
      },
      TravelerInfoSummary: {
        AirTravelerAvail: [
          {
            PassengerTypeQuantity: [
              {
                Code: 'ADT',
                Quantity: 1
              }
            ]
          }
        ],
        SeatsRequested: [1]
      },
      Version: '1'
    }
  }
  return res.status(200).send(data)
})
