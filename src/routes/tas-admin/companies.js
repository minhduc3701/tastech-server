const express = require('express')
const router = express.Router()
const Company = require('../../models/company')
const Role = require('../../models/role')
const Policy = require('../../models/policy')
const { ObjectID } = require('mongodb')
const _ = require('lodash')
const { roles } = require('../../config/roles')
const api = require('../../modules/api')

router.get('/', function(req, res) {
  let options = {
    _partner: null
  }

  let perPage = 10
  let page = Math.max(0, _.get(req, 'query.page', 0))

  Promise.all([
    Company.find(options)
      .limit(perPage)
      .skip(perPage * page)
      .sort([['_id', -1]]),
    Company.count(options)
  ])
    .then(results => {
      let companies = results[0]
      let total = results[1]
      res.status(200).send({
        page,
        total,
        totalPage: Math.ceil(total / perPage),
        companies
      })
    })
    .catch(e => res.status(400).send())
})

router.post('/search', (req, res) => {
  Company.find({
    name: new RegExp(req.body.s, 'i')
  })
    .limit(10)
    .then(companies => {
      res.status(200).send({ companies })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.post('/', function(req, res) {
  let body = _.pick(req.body, ['name', 'currency'])

  let company = new Company({
    _creator: req.user._id,
    ...body
  })

  company
    .save()
    .then(company => {
      return Role.insertMany(
        roles.map(role => ({
          ...role,
          _company: company._id
        }))
      )
    })
    .then(roles => {
      return api.currency(company.currency)
    })
    .then(currency => {
      let rate = currency.data[0].rate
      let policy = new Policy({
        name: 'Default Policy',
        _company: company._id,
        status: 'default',
        flightClass: 'Economy',
        stops: '0',
        setDaysBeforeFlights: false,
        daysBeforeFlights: 7,
        setFlightLimit: false,
        flightLimit: 500 * rate,
        flightNotification: 'no',
        flightApproval: 'no',
        hotelClass: 3,
        hotelSearchDistance: 15,
        setDaysBeforeLodging: false,
        daysBeforeLodging: 7,
        setHotelLimit: false,
        hotelLimit: 500 * rate,
        hotelNotification: 'no',
        hotelApproval: 'no',
        setTransportLimit: true,
        transportLimit: 10 * rate,
        setMealLimit: true,
        mealLimit: 10 * rate,
        setProvision: true,
        provision: 5
      })

      return policy.save()
    })
    .then(policy => {
      company._policy = policy._id
      return company.save()
    })
    .then(company => res.status(200).send({ company }))
    .catch(e => {
      res.status(400).send()
    })
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

  let body = _.pick(req.body, ['name', 'currency'])

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

module.exports = router
