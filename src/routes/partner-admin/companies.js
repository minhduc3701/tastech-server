const express = require('express')
const router = express.Router()
const { ObjectID } = require('mongodb')
const Company = require('../../models/company')
const User = require('../../models/user')
const Role = require('../../models/role')
const Department = require('../../models/department')
const Policy = require('../../models/policy')
const _ = require('lodash')
const { roles } = require('../../config/roles')
const api = require('../../modules/api')
const { makeDefaultPolicy } = require('../../modules/utils')
const { createUser } = require('../../middleware/users')
const { currenciesExchange } = require('../../middleware/currency')

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
  'isCreditLimitation',
  'creditLimitationAmount',
  'warningAmount',
  'sendMailToCompanyAdmin',
  'sendMailToPartnerAdmin',
  'invoiceThroughEmail',
  'invoiceInHardCopy',
  'contactName',
  'contactEmail',
  'contactCallingCode',
  'contactPhone',
  'markupFlight',
  'markupFlightAmount',
  'markupHotel',
  'markupHotelAmount',
  'note',
  'onBehalf',
  'disabled',
  'deposit',
  'remainingCredit',
  'logs',
  'depositAdding',
  'note'
]

const logFields = [
  'creditLimitationAmount',
  'warningAmount',
  'deposit',
  'remainingCredit'
]

const requiredFields = [
  'name',
  'country',
  'industry',
  'language',
  'currency',
  'contactName',
  'contactEmail',
  'contactCallingCode',
  'contactPhone',
  'payment',
  'markupFlight',
  'markupFlightAmount',
  'markupHotel',
  'markupHotelAmount'
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

router.get('/:id/employees', function(req, res) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }
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

router.get('/:id/employees/:employeeId', function(req, res) {
  if (
    !ObjectID.isValid(req.params.id) ||
    !ObjectID.isValid(req.params.employeeId)
  ) {
    return res.status(404).send()
  }

  const option = {
    _partner: req.user._partner,
    _company: req.params.id,
    _id: req.params.employeeId
  }

  User.findOne(option)
    .then(user => {
      res.status(200).send({
        user
      })
    })
    .catch(e => res.status(400).send())
})

router.patch('/:id/employees/:employeeId', function(req, res) {
  if (
    !ObjectID.isValid(req.params.id) ||
    !ObjectID.isValid(req.params.employeeId)
  ) {
    return res.status(404).send()
  }

  let body = _.pick(req.body, [
    'firstName',
    'lastName',
    '_department',
    '_role',
    '_policy',
    'disabled'
  ])

  User.findOneAndUpdate(
    {
      _partner: req.user._partner,
      _company: req.params.id,
      _id: req.params.employeeId
    },
    { $set: body },
    { new: true }
  )
    .then(user => {
      if (!user) {
        return res.status(404).send()
      }

      res.status(200).send({ user })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.delete('/:id/employees/:employeeId', function(req, res) {
  if (
    !ObjectID.isValid(req.params.id) ||
    !ObjectID.isValid(req.params.employeeId)
  ) {
    return res.status(404).send()
  }
  User.findOneAndDelete({
    _id: req.params.employeeId,
    _company: req.params.id,
    _partner: req.user._partner
  })
    .then(user => {
      if (!user) {
        return res.status(404).send()
      }

      res.status(200).send({ user })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.post('/:id/employees', createUser, (req, res) => {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }
  User.findOneAndUpdate(
    { _id: req.user._id },
    {
      $set: {
        _company: req.params.id
      }
    }
  )
    .then(user => {})
    .catch(e => {})
})

router.get('/:id/roles', function(req, res) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  Role.find({
    _company: req.params.id
  })
    .then(roles => {
      res.status(200).send({ roles })
    })
    .catch(e => res.status(400).send())
})

router.get('/:id/departments', function(req, res) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  Department.find({
    _company: req.params.id
  })
    .then(departments => {
      res.status(200).send({ departments })
    })
    .catch(e => res.status(400).send())
})

router.get('/:id/policies', function(req, res) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  Policy.find({
    _company: req.params.id
  })
    .then(policies => {
      res.status(200).send({ policies })
    })
    .catch(e => res.status(400).send())
})

router.post('/', async (req, res) => {
  const body = _.pick(req.body, companyFields)

  if (requiredFields.filter(field => !body[field]).length > 0) {
    return res.status(400).send()
  }

  try {
    let newCompanyData = {
      ...body,
      _creator: req.user._id,
      _partner: req.user._partner
    }

    let company = new Company(newCompanyData)
    await company
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
        let policy = new Policy(makeDefaultPolicy(company._id, rate))
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
  } catch (error) {
    res.status(400).send()
  }
})

router.post('/bulk', async (req, res) => {
  let companies = req.body.map(company => {
    let onBehalf = Boolean(company.onBehalf)
    let isCreditLimitation = Boolean(company.isCreditLimitation)
    let sendMailToCompanyAdmin = Boolean(company.sendMailToCompanyAdmin)
    let sendMailToPartnerAdmin = Boolean(company.sendMailToPartnerAdmin)
    let invoiceThroughEmail = Boolean(company.invoiceThroughEmail)
    let invoiceInHardCopy = Boolean(company.invoiceInHardCopy)

    let payment = ['deposit', 'credit-card'].includes(company.payment)
      ? company.payment
      : 'credit-card'
    let markupHotel = ['net', 'percentage'].includes(company.markupHotel)
      ? company.markupHotel
      : 'percentage'
    let markupFlight = ['net', 'percentage'].includes(company.markupFlight)
      ? company.markupFlight
      : 'net'
    let markupHotelAmount = _.get(company, 'markupHotelAmount', 0)
    let markupFlightAmount = _.get(company, 'markupFlightAmount', 0)

    return {
      ...company,
      onBehalf,
      isCreditLimitation,
      sendMailToCompanyAdmin,
      sendMailToPartnerAdmin,
      invoiceThroughEmail,
      invoiceInHardCopy,
      payment,
      markupHotel,
      markupFlight,
      _id: new ObjectID(),
      _creator: req.user._id,
      _partner: req.user._partner
    }
  })

  let validCompanies = []
  companies.forEach(company => {
    let isValidData = requiredFields.every(field =>
      company.hasOwnProperty(field)
    )
    if (isValidData) {
      validCompanies.push(company)
    }
  })

  if (validCompanies.length === 0) {
    return res.status(400).send()
  }

  try {
    let insertCompaniesResults = await Company.insertMany(validCompanies)
    let newRoles = []
    roles.forEach(role => {
      insertCompaniesResults.forEach(company => {
        newRoles.push({
          ...role,
          _company: company._id
        })
      })
    })

    let insertRolesResults = await Role.insertMany(newRoles)
    let fullCurrenciesExchange = await currenciesExchange()

    let newPolicies = []
    insertCompaniesResults.forEach(company => {
      let rate = 1
      if (company.currency !== process.env.BASE_CURRENCY) {
        rate =
          fullCurrenciesExchange[
            `${company.currency}-${process.env.BASE_CURRENCY}`
          ]['rate']
      }

      newPolicies.push(makeDefaultPolicy(company._id, rate))
    })

    let insertPoliciesResults = await Policy.insertMany(newPolicies)

    // refer: https://stackoverflow.com/questions/39988848/trying-to-do-a-bulk-upsert-with-mongoose-whats-the-cleanest-way-to-do-this
    let updatedCompanies = []
    let bulkOps = []

    insertCompaniesResults.forEach(company => {
      insertPoliciesResults.forEach(policy => {
        if (policy._company === company._id) {
          updatedCompanies.push({
            ...company.toObject(),
            _policy: policy._id
          })
          bulkOps.push({
            updateOne: {
              filter: { _id: company._id },
              update: { _policy: policy._id },
              upsert: true
            }
          })
        }
      })
    })

    let bulkWriteResult = await Company.bulkWrite(bulkOps)

    if (_.get(bulkWriteResult, 'ok') === 1) {
      res.status(200).send({ companies: updatedCompanies })
    } else {
      res.status(400).send()
    }
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

router.patch('/:id/deposit', async (req, res) => {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  const body = _.pick(req.body, companyFields)

  try {
    if (Number(_.get(body, 'depositAdding', 0)) <= 0) {
      return res.status(400).send()
    }
    const company = await Company.findOne({
      _id: req.params.id,
      _partner: req.user._partner
    })

    let { deposit, remainingCredit, creditLimitationAmount } = company
    const spendingCredit = creditLimitationAmount - remainingCredit
    const depositAdding = Number(body.depositAdding)

    // if remainingCredit = limit, add to deposit, otherwise, add unitl full limit, then add to deposit
    if (remainingCredit === company.creditLimitationAmount) {
      deposit += depositAdding
    } else {
      if (depositAdding <= spendingCredit) {
        remainingCredit += depositAdding
      } else {
        remainingCredit = creditLimitationAmount
        deposit += depositAdding - spendingCredit
      }
    }

    let updatedData = {
      ...body
    }
    const updatedAt = new Date()
    let newLogs = _.get(company, 'logs', [])

    if (deposit !== company.deposit) {
      updatedData.deposit = deposit
      newLogs.push({
        updatedAt,
        _editor: req.user._id,
        field: 'deposit',
        oldValue: company['deposit'],
        newValue: deposit,
        note: body['note']
      })
    }

    if (remainingCredit !== company.remainingCredit) {
      updatedData.remainingCredit = remainingCredit
      newLogs.push({
        updatedAt,
        _editor: req.user._id,
        field: 'remainingCredit',
        oldValue: company['remainingCredit'],
        newValue: remainingCredit,
        note: body['note']
      })
    }

    updatedData.logs = newLogs

    const updatedCompany = await Company.findOneAndUpdate(
      {
        _id: req.params.id,
        _partner: req.user._partner
      },
      { $set: updatedData },
      { new: true }
    )

    if (!updatedCompany) {
      return res.status(400).send()
    }

    res.status(200).send({
      company: updatedCompany
    })
  } catch (error) {
    res.status(400).send()
  }
})

router.patch('/:id', async (req, res) => {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  const body = _.pick(req.body, companyFields)

  try {
    const company = await Company.findOne({
      _id: req.params.id,
      _partner: req.user._partner
    })

    const updatedAt = new Date()
    let newLogs = _.get(company, 'logs', [])
    Object.keys(body).forEach(key => {
      if (logFields.includes(key) && company[key] !== body[key]) {
        newLogs.push({
          updatedAt,
          _editor: req.user._id,
          field: key,
          oldValue: company[key],
          newValue: body[key]
        })
      }
    })

    const updatedData = {
      ...body,
      logs: newLogs
    }

    const updatedCompany = await Company.findOneAndUpdate(
      {
        _id: req.params.id,
        _partner: req.user._partner
      },
      { $set: updatedData },
      { new: true }
    )

    res.status(200).send({ company: updatedCompany })
  } catch (error) {
    res.status(400).send()
  }
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
