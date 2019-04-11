const express = require('express')
const router = express.Router()
const Role = require('../../models/role')
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

  Role.findOneAndUpdate(
    {
      _id: id,
      _company: req.user._company
    },
    { $set: body },
    { new: true }
  )
    .then(role => {
      console.log(role)
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
