const express = require('express')
const router = express.Router()
const api = require('../../modules/apiHotelbeds')

router.get('/hotels', (req, res) => {
  api
    .getHotels()
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

module.exports = router
