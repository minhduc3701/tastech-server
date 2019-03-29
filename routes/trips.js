var express = require('express')
var router = express.Router()
var Trip = require('../models/trip')
router.get('/', function(req, res, next) {
  Trip.find({
    _creator: req.user._id
  })
    .then(trips => {
      res.send({ trips })
    })
    .catch(e => {
      res.send({ error: 'Not Found' })
    })
})

module.exports = router
