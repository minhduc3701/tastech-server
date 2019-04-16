const express = require('express')
const router = express.Router()
const Request = require('../../models/request')
const User = require('../../models/user')

router.get('/', function(req, res) {
  Request.find({})
    .then(requests => res.status(200).send({ requests }))
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
