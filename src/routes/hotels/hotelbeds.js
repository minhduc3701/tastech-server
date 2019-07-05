const express = require('express')
const router = express.Router()
const api = require('../../modules/apiHotelbeds')

router.post('/hotels', (req, res) => {
  const request = req.body
  const queryString = Object.keys(request)
    .map(key => key + '=' + request[key])
    .join('&')
  api
    .getHotels(queryString)
    .then(response => {
      if (response.data) {
        res.status(200).send({ hotels: response.data.hotels })
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
      res.status(400).send({ message: '404 Bad request' })
    })
})

router.post('/checkRate', (req, res) => {
  const request = req.body
  api
    .checkRate(request)
    .then(response => {
      if (response.data) {
        res.status(200).send({ hotel: response.data.hotel })
      }
    })
    .catch(error => {
      res.status(400).send()
    })
})

router.post('/bookings', (req, res) => {
  const request = req.body
  api
    .bookings(request)
    .then(response => {
      if (response.data) {
        res.status(200).send({ data: response.data })
      }
    })
    .catch(error => {
      res.status(400).send(error.response.data)
    })
})

module.exports = router
