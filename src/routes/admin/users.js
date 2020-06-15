const express = require('express')
const router = express.Router()
const Role = require('../../models/role')
const User = require('../../models/user')
const { createUser, validateUserProps } = require('../../middleware/users')
const { ObjectID } = require('mongodb')
const _ = require('lodash')
const Policy = require('../../models/policy')

router.post('/', validateUserProps, createUser, async (req, res) => {
  const dataUpdate = {
    _company: req.admin._company
  }
  if (!req.user._policy) {
    const policyDefault = await Policy.findOne({
      _company: req.admin._company,
      status: 'default'
    })
    dataUpdate._policy = policyDefault._id
  }
  User.findOneAndUpdate({ _id: req.user._id }, { $set: dataUpdate })
    .then(user => {})
    .catch(e => {})
})

router.get('/', function(req, res) {
  let perPage = _.get(req.query, 'perPage', 20)
  perPage = Math.max(0, parseInt(perPage))
  let page = _.get(req.query, 'page', 0)
  page = Math.max(0, parseInt(page))
  let keyword = _.get(req.query, 'keyword', '')

  let orFind = {}
  if (keyword) {
    orFind = {
      $or: [
        {
          displayName: {
            $regex: new RegExp(keyword),
            $options: 'i'
          }
        },
        {
          firstName: {
            $regex: new RegExp(keyword),
            $options: 'i'
          }
        },
        {
          lastName: {
            $regex: new RegExp(keyword),
            $options: 'i'
          }
        },
        {
          email: {
            $regex: new RegExp(keyword),
            $options: 'i'
          }
        }
      ]
    }
  }

  Promise.all([
    User.find({
      _company: req.user._company,
      _id: { $ne: req.user._id },
      ...orFind
    })
      .sort([['_id', -1]])
      .populate('_department')
      .populate('_role')
      .populate('_policy')
      .limit(perPage)
      .skip(perPage * page),
    User.countDocuments({
      _company: req.user._company,
      _id: { $ne: req.user._id },
      ...orFind
    }),
    User.countDocuments({
      _company: req.user._company,
      _id: { $ne: req.user._id }
    })
  ])
    .then(results => {
      let users = results[0]
      let total = results[1]
      let totalAllUser = results[2]

      res.status(200).send({
        page,
        totalPage: Math.ceil(total / perPage),
        total,
        count: users.length,
        perPage,
        users,
        totalAllUser
      })
    })
    .catch(e => {
      res.status(400).send({})
    })
})
router.get('/:id', function(req, res) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  User.findOne({
    _id: req.params.id,
    _company: req.user._company
  })
    .populate('_department')
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

router.patch('/:id', validateUserProps, function(req, res) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  let body = _.pick(req.body, [
    'country',
    'title',
    'firstName',
    'lastName',
    'phone',
    'role',
    'age',
    '_department',
    '_role',
    '_policy'
  ])

  Role.findOne({
    _id: body._role,
    _company: req.user._company
  })
    .then(role => {
      if (!role) {
        return res.status(404).send()
      }

      return User.findOneAndUpdate(
        {
          _id: req.params.id,
          _company: req.user._company
        },
        { $set: body },
        { new: true }
      )
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

router.delete('/:id', function(req, res) {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  User.findOneAndDelete({
    _id: req.params.id,
    _company: req.user._company
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
router.delete('/', function(req, res) {
  User.remove({
    _id: {
      $in: req.query.ids
    },
    _company: req.user._company
  })
    .then(data => {
      if (!data) {
        return res.status(404).send()
      }
      res.status(200).send(data)
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.put('/disabled', (req, res) => {
  let id = req.body.id
  let disabled = req.body.disabled

  User.findOneAndUpdate(
    {
      _id: id,
      _company: req.user._company
    },
    { $set: { disabled } },
    { new: true }
  )
    .then(user => {
      if (!user) {
        return res.status(404).send()
      }
      res.status(200).send({ user })
    })
    .catch(e => res.status(400).send())
})
router.put('/disabledMany', (req, res) => {
  let disabled = req.body.disabled
  User.updateMany(
    {
      _id: { $in: req.body.ids },
      _company: req.user._company
    },
    { $set: { disabled } },
    { new: true }
  )
    .then(data => {
      if (!data || data.n < 0) {
        return res.status(404).send()
      }
      res.status(200).send(data)
    })
    .catch(e => res.status(400).send())
})

router.post('/emails', (req, res) => {
  let emails = req.body.emails

  User.find({
    email: {
      $in: emails
    },
    _company: req.user._company
  })
    .then(users => {
      res.status(200).send({ users })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
