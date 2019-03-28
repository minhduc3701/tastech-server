const express = require('express')
const router = express.Router()
const Request = require('../../models/request')

router.get('/', function(req, res) {
  Request.find({})
    .then(requests => res.status(200).send({ requests }))
    .catch(e => res.status(400).send())
})

module.exports = router
