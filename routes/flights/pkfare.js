const express = require('express')
const router = express.Router()
const _ = require('lodash')

// @see http://open.pkfare.com/documents/show?id=2352d3737b0442d6a402fea86ed8bda2uk
router.post('/', (req, res) => {
  let body = _.pick(req.body, [
    'orderNum',
    'airPnr',
    'paymentGate',
    'serialNum',
    'merchantOrder',
    'permitVoid',
    'lastVoidTime',
    'voidServiceFee',
    'currency',
    'ticketNums'
  ])

  if (!body.orderNum) {
    return res.status(400).send({
      errorCode: 1,
      errorMsg: 'Failure'
    })
  }

  res.status(200).send({
    errorCode: 0,
    errorMsg: 'ok'
  })
})

module.exports = router
