const express = require('express')
const router = express.Router()
const api = require('../../modules/apiHotelbeds')
const axios = require('axios')
const {
  makeHotelbedsHotelsData,
  makeHotelbedsRoomsData
} = require('../../modules/utils')
const { currencyExchange } = require('../../middleware/currency')

router.post('/hotels', currencyExchange, (req, res) => {
  const request = req.body
  const queryString = Object.keys(request)
    .map(key => key + '=' + request[key])
    .join('&')

  api
    .getHotels(queryString)
    .then(response => {
      if (response.data) {
        let matchingData = response.data.hotels.map(makeHotelbedsHotelsData)
        matchingData = matchingData.map(hotel => {
          return {
            ...hotel,
            supplier: 'hotelbeds',
            currency: req.currency.code
          }
        })

        res.status(200).send({
          hotels: matchingData
        })
      }
    })
    .catch(error => {
      res.status(400).send()
    })
})

router.get('/hotels/:id', (req, res) => {
  const hotelCode = req.params.id
  api
    .getHotelDetail(hotelCode)
    .then(response => {
      if (response.data) {
        res.status(200).send({ hotel: response.data.hotel })
      }
    })
    .catch(error => {
      res.status(400).send()
    })
})

router.post('/rooms', (req, res) => {
  const request = req.body
  api
    .getRooms(request)
    .then(response => {
      if (response.data) {
        let matchingData = {
          ratePlans: {
            ratePlanList: response.data.hotels.hotels[0].rooms.map(
              makeHotelbedsRoomsData
            )
          }
        }
        res.status(200).send({
          matchingData
        })
      }
    })
    .catch(error => {
      res.status(400).send()
    })
})

module.exports = router
