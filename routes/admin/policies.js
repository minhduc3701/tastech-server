const express = require('express')
const router = express.Router()
const Policy = require('../../models/policy')
const User = require('../../models/user')
const { ObjectID } = require('mongodb')
const _ = require('lodash')

let projectUsersFields = {
  'employees.hash': 0,
  'employees.salt': 0,
  'employees.username': 0,
  'employees.lastName': 0,
  'employees._company': 0,
  'employees._policy': 0,
  'employees._role': 0,
  'employees._department': 0,
  'employees.__v': 0
}

router.post('/', function(req, res, next) {
  const policy = new Policy(req.body)
  policy._company = req.user._company

  let employees = req.body.employees
  let newPolicy

  policy
    .save()
    .then(policy => {
      newPolicy = policy

      return User.updateMany(
        {
          _id: {
            $in: employees
          }
        },
        {
          $set: {
            _policy: newPolicy._id
          }
        }
      )
    })
    .then(results => {
      res.status(200).json({ policy: newPolicy })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.get('/', (req, res) => {
  Policy.aggregate([
    {
      $match: {
        _company: req.user._company
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_policy',
        as: 'employees'
      }
    },
    {
      $project: projectUsersFields
    }
  ])
    .then(policies => {
      res.status(200).send({ policies })
    })
    .catch(e => res.status(400).send())
})

router.get('/:id', function(req, res) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  Policy.aggregate([
    {
      $match: {
        _id: new ObjectID(req.params.id),
        _company: req.user._company
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_policy',
        as: 'employees'
      }
    },
    {
      $project: projectUsersFields
    }
  ])
    .then(policies => {
      res.status(200).send({ policy: policies[0] })
    })
    .catch(e => res.status(400).send())
})

router.patch('/:id/status', function(req, res) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  let body = _.pick(req.body, ['status'])

  Policy.findOneAndUpdate(
    {
      _id: req.params.id,
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
    User.updateMany(
      {
        _policy: req.params.id,
        _id: {
          $nin: body.employees
        }
      },
      {
        $set: {
          _policy: null
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
      res.status(400).send()
    })
})

router.delete('/:id', function(req, res) {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  Policy.findById(id)
    .then(policy => {
      if (policy.status === 'default') {
        return res.status(400).send()
      }

      return Policy.findOneAndDelete({
        _id: req.params.id,
        _company: req.user._company
      })
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
