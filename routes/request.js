var express = require('express')
var router = express.Router()
var Request = require('../models/request')

router.post('/', function(req, res, next) {
  console.log('post request')
  const request = new Request(req.body)
  console.log(request)
  request.save()
  res.status(200).json(request)
})
router.get('/', function(req, res, next) {
  console.log('get request')

  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.write('Hello World')
  res.end()
})
module.exports = router
