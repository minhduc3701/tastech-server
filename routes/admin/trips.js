const express = require('express')
const router = express.Router()
const Trip = require('../../models/trip')
const { ObjectID } = require('mongodb')
const _ = require('lodash')

router.get('/', (req, res) => {
  Trip.find({ _company: req.user._company })
    .then(trips => res.status(200).send({ trips }))
    .catch(e => res.status(400).send())
})

router.patch('/:id', (req, res) => {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  const body = _.pick(req.body, ['status', 'budgetPassengers'])

  Trip.findByIdAndUpdate(id, { $set: body }, { new: true })
    .then(trip => {
      if (!trip) {
        return res.status(404).send()
      }

      res.status(200).send({ trip })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router