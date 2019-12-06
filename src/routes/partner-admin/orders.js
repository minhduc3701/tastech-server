const express = require('express')
const router = express.Router()
const Order = require('../../models/order')
const { ObjectID } = require('mongodb')
const _ = require('lodash')

router.get('/', function(req, res, next) {
  let perPage = _.get(req.query, 'perPage', 50)
  perPage = Math.max(0, parseInt(perPage))
  let page = _.get(req.query, 'page', 0)
  page = Math.max(0, parseInt(page))
  let status = _.get(req.query, 'status', '')
  let companies = _.get(req.query, 'companies', '')

  let objFind = {}
  objFind._partner = req.user._partner
  if (status) {
    objFind.status = status
  }
  if (!_.isEmpty(companies)) {
    companies = companies.split(',')
    objFind._company = { $in: companies }
  }

  Promise.all([
    Order.find(objFind)
      .populate('_trip', ['type', 'name', 'contactInfo'])
      .populate('_customer', ['email'])
      .sort({ createdAt: -1 })
      .limit(perPage)
      .skip(perPage * page),
    Order.countDocuments(objFind)
  ])
    .then(results => {
      let orders = results[0]
      let total = results[1]
      res.status(200).send({
        page,
        totalPage: Math.ceil(total / perPage),
        total,
        count: orders.length,
        perPage,
        orders,
        status
      })
    })
    .catch(e => {
      res.status(400).send({})
    })
})

router.get('/:id', function(req, res, next) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }
  Order.findOne({
    _id: req.params.id,
    _partner: req.user._partner
  })
    .then(order => {
      if (!order) {
        return res.status(404).send()
      }
      res.status(200).send({ order })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
