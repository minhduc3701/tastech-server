const express = require('express')
const router = express.Router()
const Region = require('../models/region')

router.post('/search', (req, res) => {
  Region.find({
    name: new RegExp(req.body.name, 'i')
  })
    .limit(10)
    .then(regions => res.status(200).send({ regions }))
    .catch(e => res.status(400).send())
})

module.exports = router
