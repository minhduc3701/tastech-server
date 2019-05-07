const express = require('express')
const router = express.Router()
const Role = require('../../models/role')
const User = require('../../models/user')
const { ObjectID } = require('mongodb')
const _ = require('lodash')
const { permissions } = require('../../config/roles')

router.post('/', function(req, res) {
  let body = _.pick(req.body, ['name', 'permissions'])

  let role = new Role({ ...body, _company: req.user._company })

  role
    .save()
    .then(role => res.send({ role }))
    .catch(e => res.status(400).send())
})

router.get('/', function(req, res) {
  Role.find({
    _company: req.user._company
  })
    .populate('users')
    .then(roles => res.status(200).send({ roles }))
    .catch(e => res.status(400).send())
})

router.get('/permissions', function(req, res) {
  res.status(200).send({ permissions })
})

router.get('/:id', function(req, res) {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  Role.findById(id)
    .then(role => {
      if (!role) {
        return res.status(404).send()
      }

      res.status(200).send({ role, permissions })
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

  let body = _.pick(req.body, ['permissions', 'users'])

  Promise.all([
    Role.updateMany(
      {
        _id: {
          $ne: id
        }
      },
      {
        $pull: {
          users: {
            $in: body.users
          }
        }
      }
    ),
    User.updateMany(
      {
        _id: {
          $in: body.users
        }
      },
      {
        $set: {
          _role: id
        }
      }
    ),
    Role.findByIdAndUpdate(
      id,
      {
        $set: {
          users: body.users
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
