const axios = require('axios')
const express = require('express')
const router = express.Router()
const { authentication } = require('../../config/sabre')
const apiSabre = require('../../modules/apiSabre')

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
    let sabreRes = await apiSabre.shopping(data)
    return res.status(200).send(sabreRes.data)
  } catch (error) {
    console.log(error.response.data)
    console.log(error.request._header)
    return res.status(400).send()
  }
})

module.exports = router
