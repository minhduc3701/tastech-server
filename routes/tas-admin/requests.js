const express = require('express')
const router = express.Router()
const Request = require('../../models/request')
const User = require('../../models/user')
const _ = require('lodash')
const { ObjectID } = require('mongodb')

router.get('/', function(req, res) {
  Request.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'email',
        foreignField: 'email',
        as: 'users'
      }
    },
    {
      $project: {
        'users.salt': 0,
        'users.hash': 0
      }
    }
  ])
    .then(requests => {
      res.status(200).send({ requests })
    })
    .catch(e => res.status(400).send())
})

router.patch('/:id', (req, res) => {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  let body = _.pick(req.body, ['status'])

  Request.findByIdAndUpdate(
    id,
    {
      $set: { status: body.status }
    },
    { new: true }
  )
    .then(request => {
      if (!request) {
        res.status(404).send()
      }

      res.status(200).send(request)
    })
    .catch(e => res.status(400).send())
})

router.post('/:id/notes', (req, res) => {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  let body = _.pick(req.body, ['note'])

  Request.findByIdAndUpdate(
    id,
    {
      $push: {
        notes: {
          note: body.note,
          notedAt: Date.now()
        }
      }
    },
    { new: true }
  )
    .then(request => {
      if (!request) {
        res.status(404).send()
      }

      res.status(200).send(request)
    })
    .catch(e => res.status(400).send())
})

router.put('/disabled', (req, res) => {
  let email = req.body.email
  let disabled = req.body.disabled

  User.findOneAndUpdate({ email }, { $set: { disabled } }, { new: true })
    .then(user => {
      if (!user) {
        return res.status(404).send()
      }
      res.status(200).send({ user })
    })
    .catch(e => res.status(400).send())
})

module.exports = router
