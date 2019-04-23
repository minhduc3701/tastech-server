const express = require('express')
const router = express.Router()
const _ = require('lodash')
const Ticket = require('../../models/ticket')

// @see http://open.pkfare.com/documents/show?id=2352d3737b0442d6a402fea86ed8bda2uk
router.post('/', (req, res) => {
  let ticket = new Ticket(req.body)

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
