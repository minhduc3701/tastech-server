const express = require('express')
const router = express.Router()
const Policy = require('../../models/policy')
const User = require('../../models/user')
const { ObjectID } = require('mongodb')
const _ = require('lodash')
const { getImageUri } = require('../../modules/utils')

let projectUsersFields = {
  'employees.hash': 0,
  'employees.salt': 0,
  'employees.username': 0,
  'employees.lastName': 0,
  'employees._company': 0,
  'employees._policy': 0,
  'employees._role': 0,
  'employees._department': 0,
  'employees.__v': 0,
  'employees.resetPasswordExpires': 0,
  'employees.resetPasswordToken': 0
}

const policyParser = policy => ({
  ...policy,
  employees: policy.employees.map(employee => ({
    ...employee,
    avatar: getImageUri(employee.avatar)
  }))
})

router.post('/', function(req, res, next) {
  const body = _.omit(req.body, 'status')
  const policy = new Policy(body)
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
          },
          _company: req.user._company
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
      policies = policies.map(policyParser)
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
      if (!policies[0]) {
        return res.status(404).send()
      }

      policies = policies.map(policyParser)
      res.status(200).send({ policy: policies[0] })
    })
    .catch(e => res.status(400).send())
})

router.patch('/:id/status', function(req, res) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  let body = _.pick(req.body, ['status'])
  // verify not other string, not 'default'
  body.status = ['enabled', 'disabled'].includes(body.status)
    ? body.status
    : 'enabled'

  Policy.findOneAndUpdate(
    {
      _id: req.params.id,
      _company: req.user._company,
      status: { $ne: 'default' } // don't allow change status of default policy
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

  Policy.findOneAndUpdate(
    {
      _id: id,
      _company: req.user._company
    },
    { $set: body },
    { new: true }
  )
    .then(async policy => {
      if (!policy) {
        return res.status(404).send()
      }

      const policyDefault = await Policy.findOne({
        _company: req.user._company,
        status: 'default'
      })

      return Promise.all([
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
            },
            _company: req.user._company
          },
          {
            $set: {
              _policy: policyDefault._id
            }
          }
        ),
        policy
      ])
    })
    .then(results => {
      res.status(200).send({ policy: results[2] })
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

  Policy.findOneAndDelete({
    _id: req.params.id,
    _company: req.user._company,
    status: { $ne: 'default' }
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
