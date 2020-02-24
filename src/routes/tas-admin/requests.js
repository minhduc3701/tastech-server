const express = require('express')
const router = express.Router()
const Request = require('../../models/request')
const User = require('../../models/user')
const _ = require('lodash')
const { ObjectID } = require('mongodb')

router.get('/', async function(req, res) {
  let perPage = 10
  let page = Math.max(0, _.get(req, 'query.page', 0))

  try {
    let results = await Promise.all([
      Request.find()
        .limit(perPage)
        .skip(perPage * page)
        .sort([['_id', -1]]),
      Request.countDocuments()
    ])

    let requests = results[0]
    let total = results[1]
    let users = await User.find({
      email: { $in: requests.map(r => r.email) }
    })

    requests = requests.map(r => ({
      ...r.toJSON(),
      users: users
        .filter(user => user.email === r.email)
        .map(user => _.pick(user, ['disabled', 'email', '_id']))
    }))

    res.status(200).send({
      requests,
      page,
      perPage,
      total,
      totalPage: Math.ceil(total / perPage)
    })
  } catch (e) {
    res.status(400).send()
  }
})

router.get('/:id', function(req, res) {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  Request.findById(id)
    .then(request => {
      if (!request) {
        return res.status(404).send()
      }

      res.status(200).send({ request })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.patch('/:id', (req, res) => {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  let body = _.pick(req.body, ['status'])

  Request.findByIdAndUpdate(
    id,
    {
      $set: { status: body.status }
    },
    { new: true }
  )
    .then(request => {
      if (!request) {
        res.status(404).send()
      }

      res.status(200).send(request)
    })
    .catch(e => res.status(400).send())
})

router.post('/:id/notes', (req, res) => {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  let body = _.pick(req.body, ['note', 'status'])

  Request.findByIdAndUpdate(
    id,
    {
      $push: {
        notes: body
      }
    },
    { new: true }
  )
    .then(request => {
      if (!request) {
        res.status(404).send()
      }

      res.status(200).send(request)
    })
    .catch(e => res.status(400).send())
})

router.put('/disabled', (req, res) => {
  let email = req.body.email
  let disabled = req.body.disabled

  User.findOneAndUpdate({ email }, { $set: { disabled } }, { new: true })
    .then(user => {
      if (!user) {
        return res.status(404).send()
      }
      res.status(200).send({ user })
    })
    .catch(e => res.status(400).send())
})

module.exports = router
