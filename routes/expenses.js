const express = require('express')
const router = express.Router()
const Expense = require('../models/expense')
const { ObjectID } = require('mongodb')
const { upload } = require('../config/aws')
const _ = require('lodash')

router.post('/', upload.array('receipts'), function(req, res, next) {
  const expense = new Expense(req.body)
  expense._creator = req.user._id
  expense._company = req.user._company
  expense.createdTime = Date.now()
  expense.lastmodifiedTime = Date.now()
  expense.receipts = req.files.map(file => file.key)
  expense._attendees = req.body._attendees.split(',')
  expense
    .save()
    .then(() => {
      res.status(200).json({ expense })
    })
    .catch(e => {
      res.status(400).send(e)
    })
})

router.get('/', function(req, res, next) {
  Expense.find({
    _creator: req.user._id
  })
    .populate('_trip', 'name')
    .populate('_attendees', 'email')
    .then(expenses => {
      res.status(200).json({ expenses })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.get('/:id', function(req, res, next) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }
  Expense.findOne({
    _creator: req.user._id,
    _id: req.params.id
  })
    .populate('_trip', 'name')
    .populate('_attendees', 'email')
    .then(expense => {
      res.status(200).json({ expense })
    })
    .catch(e => {
      res.status(400).send()
    })
})
// get expenses by trip id
router.get('/trip/:id', function(req, res, next) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }
  Expense.find({
    _creator: req.user._id,
    _trip: req.params.id
  })
    .then(expenses => {
      res.status(200).json({ expenses })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.patch('/:id', upload.array('receipts'), function(req, res, next) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }
  let body = _.pick(req.body, [
    'attendee',
    'name',
    'amount',
    'category',
    'claimed',
    'transactionDate',
    'status',
    '_trip',
    'account',
    'message',
    'city',
    'vender'
  ])
  body.receipts = req.files.map(file => file.key)
  body._attendees = req.body._attendees.split(',')
  Expense.findOneAndUpdate(
    {
      _id: req.params.id,
      _creator: req.user.id,
      status: {
        $eq: 'waiting'
      }
    },
    { $set: body },
    { new: true }
  )
    .then(expense => {
      if (!expense) {
        return res.status(404).send()
      }
      res.status(200).send({ expense })
    })
    .catch(e => {
      console.log(e)
      res.status(400).send()
    })
})

router.delete('/:id', function(req, res) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }
  Expense.findOneAndDelete({
    _id: req.params.id,
    _creator: req.user.id
  })
    .then(expense => {
      if (!expense) {
        return res.status(404).send()
      }
      res.status(200).send({ expense })
    })
    .catch(e => {
      res.status(400).send()
    })
})
module.exports = router
