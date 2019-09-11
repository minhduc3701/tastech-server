const express = require('express')
const router = express.Router()
const User = require('../../models/user')
const { createUser } = require('../../middleware/users')
const { ObjectID } = require('mongodb')
const _ = require('lodash')
const { getCache, setCache, deleteCache } = require('../../config/cache')

router.post('/', createUser, (req, res) => {
  User.findOneAndUpdate(
    { _id: req.user._id },
    {
      $set: {
        _company: req.admin._company
      }
    }
  )
    .then(user => {})
    .catch(e => {})
})

router.get('/', function(req, res) {
  getCache('admin-users')
    .then(users => users)
    .catch(e =>
      User.find({
        _company: req.user._company,
        _id: { $ne: req.user._id }
      })
        .sort([['_id', -1]])
        .populate('_department')
        .populate('_role')
        .populate('_policy')
    )
    .then(users => {
      res.status(200).send({ users })

      // cache for using later
      setCache('admin-users', users)
    })
    .catch(e => res.status(400).send())
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

router.patch('/:id', function(req, res) {
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

  User.findOneAndUpdate(
    {
      _id: req.params.id,
      _company: req.user._company
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

      deleteCache('admin-users')
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
