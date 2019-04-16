var express = require('express')
var router = express.Router()
var Expense = require('../models/expense')
const { ObjectID } = require('mongodb')
const { upload } = require('../config/aws')

router.post('/', upload.array('receipts'), function(req, res, next) {
  const expense = new Expense(req.body)
  expense._creator = req.user._id
  expense._company = req.user._company
  for (let index = 0; index < req.files.length; index++) {
    expense.receipts.push(req.files[index].key)
  }
  expense
    .save()
    .then(() => {
      res.status(200).json({ expense })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.get('/', function(req, res, next) {
  Expense.find({
    _creator: req.user._id
  })
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
    .then(expense => {
      res.status(200).json({ expense })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
