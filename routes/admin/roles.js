const express = require('express')
const router = express.Router()
const Role = require('../../models/role')
const { ObjectID } = require('mongodb')
const _ = require('lodash')

const permissions = [
  {
    permission: 'CAN_EDIT_SETTING',
    category: 'setting'
  },
  {
    permission: 'CAN_EDIT_SETTING',
    category: 'setting'
  },
  {
    permission: 'CAN_APPROVE_ESTIMATION_CREATION',
    category: 'approval'
  },
  {
    permission: 'CAN_APPROVE_EXPENSE',
    category: 'approval'
  },
  {
    permission: 'CAN_CREATE_TRIP',
    category: 'booking'
  },
  {
    permission: 'CAN_MANAGE_TRAVEL',
    category: 'booking'
  },
  {
    permission: 'CAN_CLAIM_EXPRENSE',
    category: 'booking'
  },
  {
    permission: 'CAN_VIEW_USER',
    category: 'administration'
  },
  {
    permission: 'CAN_EDIT_USER',
    category: 'administration'
  },
  {
    permission: 'CAN_EDIT_BOOKING',
    category: 'administration'
  }
]

router.post('/', function(req, res) {
  let body = _.pick(req.body, ['name', 'permissions'])

  let role = new Role({
    ...body
  })

  role
    .save()
    .then(role => res.send({ role }))
    .catch(e => res.status(400).send())
})

router.get('/', function(req, res) {
  Role.find({})
    .then(roles => res.status(200).send(roles))
    .catch(e => res.status(400).send())
})

router.get('/permissions', function(req, res) {
  res.status(200).send({ permissions })
})

router.put('/:id', function(req, res) {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  let body = _.pick(req.body, ['permissions'])

  Role.findByIdAndUpdate(id, { $set: body }, { new: true })
    .then(role => {
      if (!role) {
        return res.status(404).send()
      }

      res.status(200).send({ role })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
