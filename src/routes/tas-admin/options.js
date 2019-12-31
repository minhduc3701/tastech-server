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
        name: 'hotel-markup'
      })
      if (existedHotelOption) {
        promises.push(
          Option.findByIdAndUpdate(
            {
              _id: existedHotelOption._id
            },
            {
              $set: {
                value: {
                  type: _.get(hotel, 'value.type', 'percentage'),
                  amount: _.get(hotel, 'value.amount', 5)
                }
              }
            },
            { new: true }
          )
        )
      } else {
        let hotelOption = new Option({
          name: 'hotel-markup',
          value: {
            type: 'percentage',
            amount: 5
          }
        })
        promises.push(hotelOption.save())
      }
    }

    if (!_.isEmpty(flight)) {
      // find flight option, if existed - update, else create new
      let existedFlightOption = await Option.findOne({
        name: 'flight-markup'
      })
      if (existedFlightOption) {
        promises.push(
          Option.findByIdAndUpdate(
            {
              _id: existedFlightOption._id
            },
            {
              $set: {
                value: {
                  type: _.get(flight, 'value.type', 'net'),
                  amount: _.get(flight, 'value.amount', 20)
                }
              }
            },
            { new: true }
          )
        )
      } else {
        let flightOption = new Option({
          name: 'flight-markup',
          value: {
            type: 'net',
            amount: 20
          }
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
