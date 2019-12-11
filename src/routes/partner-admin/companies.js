const express = require('express')
const router = express.Router()
const Company = require('../../models/company')
const User = require('../../models/user')
const Role = require('../../models/role')
const Department = require('../../models/department')
const _ = require('lodash')

router.get('/', function(req, res) {
  const option = {
    _partner: req.user._partner,
    name: new RegExp(_.get(req, 'query.s', ''), 'i')
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

router.get('/:id/employees', function(req, res) {
  const option = {
    _partner: req.user._partner,
    _company: req.params.id,
    username: new RegExp(_.get(req, 'query.s', ''), 'i')
  }

  const perPage = Number(_.get(req, 'query.perPage', 10))
  const page = Number(_.get(req, 'query.page', 0))

  Promise.all([
    User.find(option)
      .populate('_department', 'name')
      .populate('_role', 'name')
      .populate('_policy', 'name')
      .sort({ _id: -1 })
      .limit(perPage)
      .skip(perPage * page),
    User.countDocuments(option)
  ])
    .then(results => {
      let employees = results[0]
      let total = results[1]
      res.status(200).send({
        employees,
        totalPage: Math.ceil(total / perPage),
        total,
        count: employees.length,
        perPage,
        page
      })
    })
    .catch(e => res.status(400).send())
})

router.get('/:id/roles', function(req, res) {
  Role.find({
    _company: req.params.id
  })
    .then(roles => {
      res.status(200).send({ roles })
    })
    .catch(e => res.status(400).send())
})

router.get('/:id/departments', function(req, res) {
  Department.find({
    _company: req.params.id
  })
    .then(departments => {
      res.status(200).send({ departments })
    })
    .catch(e => res.status(400).send())
})

module.exports = router
