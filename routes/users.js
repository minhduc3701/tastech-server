var express = require('express')
var router = express.Router()

router.get('/me', function(req, res, next) {
  res.send(req.user)
})

module.exports = router
