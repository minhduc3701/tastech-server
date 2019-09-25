const express = require('express')
const router = express.Router()
const Order = require('../../models/order')
const { ObjectID } = require('mongodb')
const _ = require('lodash')
router.get('/', function(req, res, next) {
  Order.find({})
    .populate('_trip', ['type', 'name', 'contactInfo'])
    .populate('_customer', ['email'])
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

router.patch('/:id', function(req, res) {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  const body = _.pick(req.body, ['status', 'pnr'])

  Order.findOneAndUpdate(
    {
      _id: id
    },
    { $set: body },
    { new: true }
  )
    .then(order => {
      if (!order) {
        return res.status(404).send()
      }
      res.status(200).send({ order })
      // save for sending email to employee
    })
    .catch(e => {
      console.log(e)
      res.status(400).send()
    })
})

module.exports = router
