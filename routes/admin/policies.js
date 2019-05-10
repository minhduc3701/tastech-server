const express = require('express')
const router = express.Router()
const Policy = require('../../models/policy')
const User = require('../../models/user')
const { ObjectID } = require('mongodb')
const _ = require('lodash')

router.post('/', function(req, res, next) {
  const policy = new Policy(req.body)
  policy._company = req.user._company
  policy
    .save()
    .then(() => {
      res.status(200).json({ policy })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.get('/', (req, res) => {
  Policy.find({ _company: req.user._company })
    .populate('employees')
    .then(policies => res.status(200).send({ policies }))
    .catch(e => res.status(400).send())
})

router.get('/:id', function(req, res) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  Policy.findOne({
    _id: req.params.id,
    _company: req.user._company
  })
    .populate('employees')
    .then(policy => {
      if (!policy) {
        return res.status(404).send()
      }

      res.status(200).send({ policy })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.patch('/:id/status', function(req, res) {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  let body = _.pick(req.body, ['status'])

  Policy.findOneAndUpdate(
    {
      _id: id,
      _company: req.user._company
    },
    { $set: body },
    { new: true }
  )
    .then(policy => {
      if (!policy) {
        return res.status(404).send()
      }

      res.status(200).send({ policy })
    })
    .catch(e => {
      console.log(e)
      res.status(400).send()
    })
})

router.patch('/:id', function(req, res) {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  let body = _.pick(req.body, [
    'name',
    'status',
    'flightClass',
    'stops',
    'setDaysBeforeFlights',
    'daysBeforeFlights',
    'setFlightLimit',
    'flightLimit',
    'flightNotification',
    'flightApproval',
    'hotelClass',
    'hotelSearchDistance',
    'setDaysBeforeLodging',
    'daysBeforeLodging',
    'setHotelLimit',
    'hotelLimit',
    'hotelNotification',
    'hotelApproval',
    'setTransportLimit',
    'transportLimit',
    'setMealLimit',
    'mealLimit',
    'setProvision',
    'provision',
    'employees'
  ])

  Promise.all([
    Policy.updateMany(
      {
        _id: {
          $ne: id
        },
        _company: req.user._company
      },
      {
        $pull: {
          employees: {
            $in: body.employees
          }
        }
      }
    ),
    User.updateMany(
      {
        _id: {
          $in: body.employees
        },
        _company: req.user._company
      },
      {
        $set: {
          _policy: id
        }
      }
    ),
    Policy.findOneAndUpdate(
      {
        _id: id,
        _company: req.user._company
      },
      { $set: body },
      { new: true }
    )
  ])
    .then(results => {
      let policy = results[2]
      if (!policy) {
        return res.status(404).send()
      }

      res.status(200).send({ policy })
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

  Policy.findOneAndDelete({
    _id: req.params.id,
    _company: req.user._company
  })
    .then(policy => {
      if (!policy) {
        return res.status(404).send()
      }

      res.status(200).send({ policy })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
