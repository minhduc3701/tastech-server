const express = require('express')
const router = express.Router()
const Company = require('../../models/company')
const Role = require('../../models/role')
const { ObjectID } = require('mongodb')
const _ = require('lodash')
const { roles } = require('../../config/roles')

router.get('/', function(req, res) {
  Promise.all([Company.find({}).sort([['_id', -1]]), Company.count({})])
    .then(results => {
      let companies = results[0]
      let total = results[1]
      res.status(200).send({ total, companies })
    })
    .catch(e => res.status(400).send())
})

router.post('/', function(req, res) {
  let body = _.pick(req.body, ['name', 'departments'])

  let company = new Company({
    _creator: req.user._id,
    ...body
  })

  company
    .save()
    .then(company => {
      res.send({ company })

      return Role.insertMany(
        roles.map(role => ({
          ...role,
          _company: company._id
        }))
      )
    })
    .then(roles => {})
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

  let body = _.pick(req.body, ['name', 'departments'])

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

      return Role.deleteMany({ _company: company._id })
    })
    .then(roles => {})
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
