const express = require('express')
const router = express.Router()
const Order = require('../models/order')
const { ObjectID } = require('mongodb')

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

module.exports = router
