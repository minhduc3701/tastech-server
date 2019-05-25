const express = require('express')
const router = express.Router()
const Role = require('../../models/role')
const User = require('../../models/user')
const { ObjectID } = require('mongodb')
const _ = require('lodash')
const { permissions } = require('../../config/roles')

let projectUsersFields = {
  'users.hash': 0,
  'users.salt': 0,
  'users.username': 0,
  'users.lastName': 0,
  'users._company': 0,
  'users._policy': 0,
  'users._role': 0,
  'users._department': 0,
  'users.__v': 0
}

router.post('/', function(req, res) {
  let body = _.pick(req.body, ['name', 'permissions'])

  let role = new Role({ ...body, _company: req.user._company })

  role
    .save()
    .then(role => res.send({ role }))
    .catch(e => res.status(400).send())
})

router.get('/', function(req, res) {
  Role.aggregate([
    {
      $match: {
        _company: req.user._company
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_role',
        as: 'users'
      }
    },
    {
      $project: projectUsersFields
    }
  ])
    .then(roles => {
      res.status(200).send({ roles })
    })
    .catch(e => res.status(400).send())
})

router.get('/permissions', function(req, res) {
  res.status(200).send({ permissions })
})

router.get('/:id', function(req, res) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  Role.aggregate([
    {
      $match: {
        _id: new ObjectID(req.params.id)
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_role',
        as: 'users'
      }
    },
    {
      $project: projectUsersFields
    }
  ])
    .then(roles => {
      res.status(200).send({ role: roles[0], permissions })
    })
    .catch(e => res.status(400).send())
})

router.patch('/:id', function(req, res) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  let body = _.pick(req.body, ['permissions', 'users'])

  Promise.all([
    User.updateMany(
      {
        _id: {
          $in: body.users
        }
      },
      {
        $set: {
          _role: req.params.id
        }
      }
    ),
    User.updateMany(
      {
        _role: req.params.id,
        _id: {
          $nin: body.users
        }
      },
      {
        $set: {
          _role: null
        }
      }
    ),
    Role.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          permissions: body.permissions
        }
      },
      { new: true }
    )
  ])
    .then(results =>
      res.status(200).send({
        role: results[2]
      })
    )
    .catch(e => res.status(400).send())
})

module.exports = router
