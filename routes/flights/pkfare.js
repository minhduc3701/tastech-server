const express = require('express')
const router = express.Router()
const _ = require('lodash')
const Ticket = require('../../models/ticket')
const bodyParser = require('body-parser')

// @see http://open.pkfare.com/documents/show?id=2352d3737b0442d6a402fea86ed8bda2uk
// @see https://stackoverflow.com/a/30099608
router.post('/', bodyParser.text({ type: '*/*' }), (req, res) => {
  let body

  try {
    body = JSON.parse(req.body)
  } catch (e) {
    return res.status(400).send({
      errorCode: 1,
      errorMsg: 'Failure'
    })
  }

  let ticket = new Ticket(body)

  ticket
    .save()
    .then(() => {
      res.status(200).send({
        errorCode: 0,
        errorMsg: 'ok'
      })
    })
    .catch(e => {
      res.status(400).send({
        errorCode: 1,
        errorMsg: 'Failure'
      })
    })
})

module.exports = router
