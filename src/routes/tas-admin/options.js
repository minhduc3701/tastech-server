var express = require('express')
var router = express.Router()
const _ = require('lodash')
const Option = require('../../models/option')

router.get('/', async (req, res) => {
  try {
    Option.find().then(options => {
      res.status(200).send({
        options
      })
    })
  } catch (error) {
    res.status(400).send()
  }
})

router.patch('/', async (req, res) => {
  try {
    let hotel = _.get(req.body, 'hotel')
    let flight = _.get(req.body, 'flight')

    let promises = []

    if (!_.isEmpty(hotel)) {
      // find hotel option, if existed - update, else create new
      let existedHotelOption = await Option.findOne({
        name: 'hotel'
      })
      if (existedHotelOption) {
        promises.push(
          Option.findByIdAndUpdate(
            {
              _id: existedHotelOption._id
            },
            {
              $set: {
                markupType: hotel.markupType || 'percentage',
                value: hotel.value || 5
              }
            },
            { new: true }
          )
        )
      } else {
        let hotelOption = new Option({
          name: 'hotel',
          markupType: hotel.markupType || 'percentage',
          value: hotel.value || 5
        })
        promises.push(hotelOption.save())
      }
    }

    if (!_.isEmpty(flight)) {
      // find flight option, if existed - update, else create new
      let existedFlightOption = await Option.findOne({
        name: 'flight'
      })
      if (existedFlightOption) {
        promises.push(
          Option.findByIdAndUpdate(
            {
              _id: existedFlightOption._id
            },
            {
              $set: {
                markupType: flight.markupType || 'percentage',
                value: flight.value || 5
              }
            },
            { new: true }
          )
        )
      } else {
        let flightOption = new Option({
          name: 'flight',
          markupType: flight.markupType || 'net',
          value: flight.value || 20
        })
        promises.push(flightOption.save())
      }
    }

    let results = await Promise.all(promises)
    return res.status(200).send(results)
  } catch (error) {
    return res.status(400).send()
  }
})

module.exports = router
