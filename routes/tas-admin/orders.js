const express = require('express')
const router = express.Router()
const Order = require('../../models/order')
const { ObjectID } = require('mongodb')

router.get('/', function(req, res, next) {
  Order.find({})
    .populate('_trip', ['type', 'name', 'contactInfo'])
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
    _id: req.params.id
  })
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

module.exports = router
