const express = require('express')
const router = express.Router()
const User = require('../../models/user')
const Budget = require('../../models/budget')
const { ObjectID } = require('mongodb')
const _ = require('lodash')

router.get('/', (req, res) => {
  Budget.find({ _company: req.user._company })
    .then(budgets => res.status(200).send({ budgets }))
    .catch(e => res.status(400).send())
})

router.patch('/:id', (req, res) => {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  const body = _.pick(req.body, ['status', 'passengers'])

  Budget.findByIdAndUpdate(id, { $set: body }, { new: true })
    .then(budget => {
      if (!budget) {
        return res.status(404).send()
      }

      res.status(200).send({ budget })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
