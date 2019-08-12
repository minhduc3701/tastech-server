const express = require('express')
const router = express.Router()
const Order = require('../models/order')
const { ObjectID } = require('mongodb')
const axios = require('axios')
const { authentication } = require('../config/pkfare')
const _ = require('lodash')
const { removeSpaces } = require('../modules/utils')
const apiHotelbeds = require('../modules/apiHotelbeds')

router.get('/', function(req, res, next) {
  Order.find({
    _customer: req.user._id
  })
    .sort({ createdAt: -1 })
    .then(orders => {
      res.status(200).send({ orders })
    })
    .catch(e => {
      res.status(400).send({})
    })
})

router.get('/:id', function(req, res, next) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }
  Order.findOne({
    _id: req.params.id,
    _customer: req.user._id
  })
    .then(order => {
      if (!order) {
        return res.status(404).send()
      }

      res.status(200).json({ order })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.post('/', function(req, res, next) {
  const order = new Order(req.body)
  order._customer = req.user._id
  order._company = req.user._company
  order
    .save()
    .then(() => {
      res.status(200).send({ order })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.patch('/:id', function(req, res, next) {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  Order.findOneAndUpdate(
    {
      _id: id,
      _customer: req.user._id
    },
    { $set: req.body },
    { new: true }
  )
    .then(order => {
      if (!order) {
        return res.status(404).send()
      }

      res.status(200).send({ order })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.post('/cancel', async (req, res) => {
  let id = req.body.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  try {
    let order = await Order.findOne({
      _id: id,
      _customer: req.user._id,
      status: { $eq: 'completed' },
      canCancel: { $eq: true }
    })

    if (!order) {
      return res.status(404).send()
    }

    switch (order.type) {
      case 'hotel':
        switch (order[order.type].supplier) {
          case 'pkfare':
            let cancelRes = await axios.post(
              `${process.env.PKFARE_HOTEL_URI}/cancelOrder`,
              {
                authentication,
                request: {
                  orderCode: order.number
                }
              }
            )

            if (cancelRes.data.header.code === 'S00000') {
              order.status = 'cancelled'
              order.canCancel = false
              await order.save()
              return res.status(200).send({ order, result: cancelRes.data })
            }
            break

          case 'hotelbeds':
            let cancelHotelbedsRes = await apiHotelbeds.cancelHotelbedsOrder(
              order.customerCode
            )
            order.status = 'cancelled'
            order.canCancel = false
            await order.save()
            return res
              .status(200)
              .send({ order, result: cancelHotelbedsRes.data })
            break
        }
        break

      case 'flight':
        switch (order[order.type].supplier) {
          case 'pkfare':
            let data = {
              authentication,
              voidRequest: {
                orderNum: order.number,
                passengers: order.passengers.map(passenger => ({
                  cardType: 'P',
                  cardNum: passenger.passportNo,
                  firstName: removeSpaces(passenger.firstName),
                  lastName: removeSpaces(passenger.lastName)
                }))
              }
            }
            let base64 = Buffer.from(JSON.stringify(data)).toString('base64')
            let cancelRes = await axios.get(
              `${process.env.PKFARE_URI}/voiding?param=${base64}`
              // `http://localhost:5050/voiding?param=${base64}`
            )

            if (cancelRes.data.errorCode === '0') {
              let voidOrderNum = cancelRes.data.data.voidOrderNum
              order.status = 'cancelling'
              order.cancelNumber = voidOrderNum
              await order.save()
              return res.status(200).send({ order, result: cancelRes.data })
            }
            break
        }
        break
    }
  } catch (e) {}

  res.status(400).send()
})

module.exports = router
