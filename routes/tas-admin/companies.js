const express = require('express')
const router = express.Router()
const Company = require('../../models/company')
const { ObjectID } = require('mongodb')
const _ = require('lodash')

router.get('/', function(req, res) {
  Company.find({})
    .then(companies => res.status(200).send({ companies }))
    .catch(e => res.status(400).send())
})

router.post('/', function(req, res) {
  let body = _.pick(req.body, ['name', '_owner', 'departments'])

  let company = new Company({
    _creator: req.user._id,
    ...body
  })

  company
    .save()
    .then(company => res.send({ company }))
    .catch(e => res.status(400).send())
})

router.get('/:id', function(req, res) {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  Company.findById(id)
    .then(company => {
      if (!company) {
        return res.status(404).send()
      }

      res.status(200).send({ company })
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

  let body = _.pick(req.body, ['name', '_owner', 'departments'])

  Company.findByIdAndUpdate(id, { $set: body }, { new: true })
    .then(company => {
      if (!company) {
        return res.status(404).send()
      }

      res.status(200).send({ company })
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

  Company.findByIdAndDelete(id)
    .then(company => {
      if (!company) {
        return res.status(404).send()
      }

      res.status(200).send({ company })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
