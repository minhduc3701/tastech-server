var express = require('express')
var router = express.Router()
const _ = require('lodash')
const Voucher = require('../models/voucher')
const User = require('../models/user')
const apiUrbox = require('../modules/apiUrbox')
const { makeUrboxGiftData } = require('../modules/utils')
const moment = require('moment')

let urboxKey = {
  app_id: process.env.URBOX_ID,
  app_secret: process.env.URBOX_SECRET
}

router.post('/ub', async (req, res) => {
  try {
    let reqBody = { ...urboxKey, ...req.body }
    let resData = await apiUrbox.getGifts(reqBody)

    if (resData.data.msg === 'success') {
      let gifts = resData.data.data.items.map(makeUrboxGiftData)
      res.status(200).send({
        gifts: gifts,
        totalPage: resData.data.data.totalPage
      })
    }
  } catch (error) {
    res.status(400).send()
  }
})

router.get('/ub/:id', async (req, res) => {
  try {
    let reqBody = { ...urboxKey, id: req.params.id }
    let resData = await apiUrbox.getGiftDetail(reqBody)
    let gift = {
      ...resData.data.data,
      pricePoint: parseInt(resData.data.data.price) / 1000
    }

    res.status(200).send({ gift })
  } catch (error) {
    res.status(400).send()
  }
})

router.post('/exchange', async (req, res) => {
  try {
    const giftPrice = parseInt(req.body.price)
    const siteUserId = 'ezbiztrip-' + req.user.id
    const transaction = require('order-id')(process.env.URBOX_SECRET)
    const transactionId = 'ezbiztrip-' + transaction.generate()

    let reqBody = {
      ...urboxKey,
      ttphone: process.env.URBOX_EZBIZTRIP_PHONE,
      ttemail: process.env.URBOX_EZBIZTRIP_EMAIL,
      fullname: process.env.URBOX_EZBIZTRIP_NAME,
      site_user_id: siteUserId,
      transaction_id: transactionId,
      dataBuy: [
        {
          priceId: req.body.id,
          quantity: '1'
        }
      ]
    }

    if (req.user.point < giftPrice) {
      return res.status(400).send({
        message: 'not enough points to redeem this voucher'
      })
    }

    let resData = await apiUrbox.requestVoucher(reqBody)

    if (resData.data.msg === 'success') {
      let remainingPoints = req.user.point - giftPrice / 1000
      let voucherData = {
        ...req.body,
        _buyer: req.user.id,
        siteUserId,
        transactionId,
        quantity: 1,
        pricePoint: giftPrice / 1000,
        currency: 'VND',
        content: req.body.content,
        note: req.body.note,
        office: req.body.office,
        cartId: resData.data.data.cart.id,
        cartNumber: resData.data.data.cart.cartNo,
        cartTotal: resData.data.data.cart.money_total,
        cartGiftLink: resData.data.data.cart.link_gift,
        cartGiftCode: resData.data.data.cart.code_link_gift[0].code,
        expiredDate: moment(
          resData.data.data.cart.code_link_gift[0].expired,
          'DD-MM-YYYY'
        ).format('YYYY-MM-DD')
      }

      let voucher = new Voucher(voucherData)
      await voucher.save()

      User.findByIdAndUpdate(
        req.user._id,
        { $set: { point: remainingPoints } },
        { new: true }
      )
        .then(user => {
          if (!user) {
            return res.status(404).send()
          }
          return res.status(200).send({
            data: resData.data.data,
            voucherId: voucher.id,
            remainingPoints: user.point
          })
        })
        .catch(e => {
          return res.status(400).send()
        })
    } else {
      res.status(400).send({
        res: resData.data
      })
    }
  } catch (error) {
    res.status(400).send()
  }
})

module.exports = router
