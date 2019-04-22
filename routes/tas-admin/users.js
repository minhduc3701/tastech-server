const express = require('express')
const router = express.Router()
const User = require('../../models/user')
const { createUser } = require('../../middleware/users')
const { ObjectID } = require('mongodb')
const _ = require('lodash')

router.get('/', function(req, res) {
  let perPage = 50
  let page = Math.max(0, req.query.page)
  let data = {}

  // @see https://stackoverflow.com/questions/5539955/how-to-paginate-with-mongoose-in-node-js
  Promise.all([
    User.find({})
      .limit(perPage)
      .skip(perPage * page)
      .sort([['_id', -1]]),
    User.count({})
  ])
    .then(results => {
      let users = results[0]
      let total = results[1]
      res.status(200).send({ page, total, count: users.length, users })
    })
    .catch(e => res.status(400).send())
})

router.post('/', createUser)

router.get('/:id', function(req, res) {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  User.findById(id)
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
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
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
    'type',
    '_company',
    '_department',
    '_admin'
  ])

  User.findByIdAndUpdate(id, { $set: body }, { new: true })
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
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  User.findByIdAndDelete(id)
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

module.exports = router