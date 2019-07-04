const axios = require('axios')
const express = require('express')
const router = express.Router()

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
  try {
    let sabreRes = await axios({
      method: 'post',
      url: 'https://api-crt.cert.havail.sabre.com/v1/offers/shop',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer T1RLAQL4Lppf2U8fN9V65xaUM5tKvHd2VhCw7kuSm9t6QWVFRRSij6CCAADA5dpLQaYmTqPDeoZyOtgMGEJmiUA5tezSB59kAXgJeGhFqqVl0LztFAeyH/lM77JaTg4VGB7pyPTItf5CGN0xLqkb3aXNAcj8lz8ssuQm5PChnTzU4AwN4sjUfTIStpzk4Z7ROxVhbj4L4IRgwJ4pi8MHqOMwDeX1keR80jSIN4/UcokU1XNaTavhzSjFshsryUkIosdpVIOaSMRxWOByqnYdpg2KH/0ZTRGyj8K6uQlxNDwDdHRAWENihap1xkP2`
      },
      data
    })
    return res.status(200).send(sabreRes.data)
  } catch (error) {
    console.log('error')
    console.log(error)
    return res.status(400).send()
  }
})

module.exports = router
