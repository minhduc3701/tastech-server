const express = require('express')
const router = express.Router()
const Company = require('../../models/company')
const _ = require('lodash')

router.get('/', function(req, res) {
  const option = {
    _partner: req.user._partner
  }
  const perPage = Number(_.get(req, 'query.perPage', 10))
  const page = Number(_.get(req, 'query.page', 0))

  Promise.all([
    Company.find(option)
      .limit(perPage)
      .skip(perPage * page)
      .sort([['_id', -1]]),
    Company.countDocuments(option)
  ])
    .then(results => {
      let totalPage = Math.ceil(results[1] / perPage)
      res.status(200).send({
        companies: results[0],
        total: results[1],
        count: results[0].length,
        totalPage,
        page
      })
    })
    .catch(e => res.status(400).send())
})

router.post('/search', (req, res) => {
  Company.find({
    _partner: req.user._partner,
    name: new RegExp(req.body.keyword, 'i')
  })
    .limit(10)
    .then(companies => {
      res.status(200).send({ companies })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
