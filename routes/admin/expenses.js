const express = require('express')
const router = express.Router()
const Expense = require('../../models/expense')
const { ObjectID } = require('mongodb')
const _ = require('lodash')

router.get('/', (req, res) => {
  Expense.find({
    _company: req.user._company
  })
    .populate({
      path: '_creator',
      populate: {
        path: '_department',
        select: 'name'
      }
    })
    .populate('_trip')
    .then(expenses => res.status(200).send({ expenses }))
    .catch(e => res.status(400).send())
})

router.get('/:id', function(req, res) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  Expense.findOne({
    _id: req.params.id,
    _company: req.user._company
  })
    .populate('_creator')
    .populate('_attendees')
    .populate('_trip')
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

router.patch('/:id', (req, res) => {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  const body = _.pick(req.body, ['status', 'adminMessage'])

  Expense.findOneAndUpdate(
    {
      _id: id,
      _company: req.user._company
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
      res.status(400).send()
    })
})

module.exports = router
