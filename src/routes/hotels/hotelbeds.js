const express = require('express')
const router = express.Router()
const api = require('../../modules/apiHotelbeds')
const { formatHotelListApiData } = require('../../modules/utils')
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
        let formatedData = response.data.hotels.map(formatHotelListApiData)
        formatedData = formatedData.map(hotel => {
          return {
            ...hotel,
            supplier: 'hotelbeds',
            currency: req.currency.code
          }
        })

        res.status(200).send({
          hotels: formatedData
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
        res.status(200).send({ hotels: response.data.hotels })
      }
    })
    .catch(error => {
      res.status(400).send()
    })
})

module.exports = router
