const express = require('express')
const router = express.Router()
const Partner = require('../../models/partner')
const Role = require('../../models/role')
const Policy = require('../../models/policy')
const { ObjectID } = require('mongodb')
const _ = require('lodash')
const { roles } = require('../../config/roles')
const api = require('../../modules/api')

router.get('/', function(req, res) {
  Promise.all([
    Partner.find({
      _partner: req.user._partner
    }).sort([['_id', -1]]),
    Partner.count({})
  ])
    .then(results => {
      let partners = results[0]
      let total = results[1]
      res.status(200).send({ total, partners })
    })
    .catch(e => res.status(400).send())
})

router.get('/:id', function(req, res) {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  Partner.findById(id)
    .then(partner => {
      if (!partner) {
        return res.status(404).send()
      }

      res.status(200).send({ partner })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.post('/', function(req, res) {
  let partner = new Partner(req.body)
  partner
    .save()
    .then(partner => {
      let role = new Role({
        name: 'Partner',
        type: 'partner',
        _partner: partner._id
      })
      return role.save()
    })
    .then(role => res.status(200).send({ partner, role }))
    .catch(e => {
      res.status(400).send(e)
    })
})

router.patch('/:id', function(req, res) {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  let body = req.body

  Partner.findByIdAndUpdate(id, { $set: body }, { new: true })
    .then(partner => {
      if (!partner) {
        return res.status(404).send()
      }
      res.status(200).send({ partner })
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

  Partner.findByIdAndDelete(id)
    .then(partner => {
      if (!partner) {
        return res.status(404).send()
      }

      res.status(200).send({ partner })

      return Role.deleteMany({ _partner: partner._id })
    })
    .then(roles => {})
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
