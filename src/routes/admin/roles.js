const express = require('express')
const router = express.Router()
const Role = require('../../models/role')
const User = require('../../models/user')
const { ObjectID } = require('mongodb')
const _ = require('lodash')
const { permissions } = require('../../config/roles')
const { getImageUri } = require('../../modules/utils')

let projectUsersFields = {
  'users.hash': 0,
  'users.salt': 0,
  'users.username': 0,
  'users._company': 0,
  'users._policy': 0,
  'users._role': 0,
  'users._department': 0,
  'users.__v': 0
}

const roleParser = role => ({
  ...role,
  users: role.users.map(user => ({
    ...user,
    avatar: getImageUri(user.avatar)
  }))
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
      roles = roles.map(roleParser)
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
        _id: new ObjectID(req.params.id),
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
      roles = roles.map(roleParser)
      res.status(200).send({ role: roles[0], permissions })
    })
    .catch(e => res.status(400).send())
})

router.patch('/:id', function(req, res) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  let body = _.pick(req.body, ['users'])

  Role.findOne({
    _id: req.params.id,
    _company: req.user._company
  })
    .then(role => {
      if (!role) {
        return res.status(404).send()
      }

      // because user must have role,
      // so don't need to set to null like department and policy
      return User.updateMany(
        {
          _id: {
            $in: body.users,
            $ne: req.user._id // don't allow user change their own role
          },
          _company: req.user._company
        },
        {
          $set: {
            _role: req.params.id
          }
        }
      )
    })
    .then(results => res.status(200).send())
    .catch(e => res.status(400).send())
})

module.exports = router
