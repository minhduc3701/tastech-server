const express = require('express')
const router = express.Router()
const Region = require('../models/region')

router.post('/search', (req, res) => {
  let params = req.body.keyword !== '' ? { name: req.body.keyword } : {}

  Region.find(params)
    .then(regions => res.status(200).send({ regions }))
    .catch(e => res.status(400).send())
})

module.exports = router
