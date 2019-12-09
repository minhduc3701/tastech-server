const express = require('express')
const router = express.Router()
const { ObjectID } = require('mongodb')
const Company = require('../../models/company')
const _ = require('lodash')

const companyFields = [
  'logo',
  'exchangeRate',
  'name',
  'address',
  'country',
  'industry',
  'website',
  'timezone',
  'companySize',
  'language',
  'currency',
  'lengthUnit',
  'weightUnit',
  'payment',
  'creditLimitationAmount',
  'warningAmount',
  'sendMailToCompanyAdmin',
  'sendMailToPartnerAdmin',
  'contactName',
  'contactEmail',
  'contactCallingCode',
  'contactPhone',
  'markupFlight',
  'markupFlightAmount',
  'markupHotel',
  'markupHotelAmount',
  'deposit',
  'note',
  'onBehalf'
]

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

router.post('/', async (req, res) => {
  const body = _.pick(req.body, companyFields)

  try {
    let newCompanyData = {
      ...body,
      _creator: req.user._id,
      _partner: req.user._partner
    }

    let company = new Company(newCompanyData)
    await company.save()

    res.status(200).send({ company })
  } catch (error) {
    res.status(400).send()
  }
})

router.get('/:id', (req, res) => {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  Company.findOne({
    _id: req.params.id,
    _partner: req.user._partner
  })
    .then(company => {
      if (!company) {
        return res.status(404).send()
      }
      res.status(200).send({
        company
      })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.patch('/:id', (req, res) => {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  const body = _.pick(req.body, companyFields)

  Company.findOneAndUpdate(
    {
      _id: req.params.id,
      _partner: req.user._partner
    },
    { $set: body },
    { new: true }
  )
    .then(company => {
      if (!company) {
        return res.status(404).send()
      }
      res.status(200).send({
        company
      })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.delete('/:id', function(req, res) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  Company.findOneAndDelete({
    _id: req.params.id,
    _partner: req.user._partner
  })
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
