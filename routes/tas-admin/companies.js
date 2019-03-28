const express = require('express')
const router = express.Router()
const Company = require('../../models/company')

router.get('/', function(req, res) {
  Company.find({})
    .then(companies => res.status(200).send({ companies }))
    .catch(e => res.status(400).send())
})

router.post('/', function(req, res) {
  let company = new Company({
    name: req.body.name,
    _creator: req.user._id,
    _owner: req.body.owner
  })

  company
    .save()
    .then(company => res.send(company))
    .catch(e => res.status(400).send())
})

module.exports = router
