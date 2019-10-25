var express = require('express')
var router = express.Router()
const _ = require('lodash')
const Country = require('../models/country')
const Voucher = require('../models/voucher')
const Reward = require('../models/reward')
const User = require('../models/user')
const { ObjectID } = require('mongodb')
const apiUrbox = require('../modules/apiUrbox')
const { makeUrboxGiftData } = require('../modules/utils')
const moment = require('moment')
const { emailEzBizTripVoucherInfo } = require('../middleware/email')
const { urboxCurrencyExchange } = require('../middleware/currency')

let urboxKey = {
  app_id: process.env.URBOX_ID,
  app_secret: process.env.URBOX_SECRET
}

router.get('/countryFilter', async (req, res) => {
  try {
    let reqBody = { ...urboxKey, page_no: 1 }

    Promise.all([
      Country.find({}),
      Reward.aggregate([
        {
          $group: {
            _id: '$country'
          }
        }
      ])
    ])
      .then(results => {
        let fullCountryOptions = results[0]
        let rewardCountries = results[1]

        let countryOptions = [
          {
            value: 'VN',
            label: 'Vietnam'
          }
        ]
        rewardCountries.forEach(country => {
          let matchCountry = fullCountryOptions.find(
            fullCountryOption => fullCountryOption.cca2 === country._id
          )
          if (matchCountry) {
            countryOptions.push({
              value: matchCountry.cca2,
              label: matchCountry.name.common
            })
          }
        })

        res.status(200).send({
          countries: countryOptions
        })
      })
      .catch(error => {
        res.status(400).send()
      })
  } catch (error) {
    res.status(400).send()
  }
})

router.post('/', urboxCurrencyExchange, async (req, res) => {
  try {
    if (req.body.country === 'VN') {
      let reqBody = { ...urboxKey, ...req.body }
      let giftData = await apiUrbox.getGifts(reqBody)

      let filterData = await apiUrbox.getGiftFilter(urboxKey)
      let filter = filterData.data.data.items

      let categories = filter['CATEGORIES'].value.map(cat => {
        return {
          value: cat.id,
          label: cat.title
        }
      })
      categories.unshift({ value: '', label: 'All' })

      let brands = filter['BRANDS'].value.map(brand => {
        return {
          value: brand.id,
          label: brand.title
        }
      })
      brands.unshift({ value: '', label: 'All' })

      if (giftData.data.msg === 'success') {
        let gifts = giftData.data.data.items.map(item =>
          makeUrboxGiftData(item, req.currency.rate)
        )

        res.status(200).send({
          categories,
          brands,
          gifts: gifts,
          totalPage: giftData.data.data.totalPage
        })
      } else {
        res.status(200).send({
          categories,
          brands,
          gifts: [],
          totalPage: 0
        })
      }
    } else {
      let perPage = parseInt(req.body.per_page)
      let page = Math.max(0, parseInt(req.body.page_no))

      let options = {
        country: req.body.country
      }
      if (req.body.cat_id) {
        options['categoryName'] = req.body.cat_id
      }
      if (req.body.brand_id) {
        options['brand'] = req.body.brand_id
      }

      Promise.all([
        Reward.find(options)
          .limit(perPage)
          .skip(perPage * page)
          .sort({ updatedAt: -1 }),
        Reward.countDocuments(options),
        Reward.aggregate([
          {
            $match: {
              country: req.body.country
            }
          },
          {
            $group: {
              _id: '$categoryName'
            }
          }
        ]),
        Reward.aggregate([
          {
            $match: {
              country: req.body.country
            }
          },
          {
            $group: {
              _id: '$brand'
            }
          }
        ])
      ])
        .then(results => {
          let gifts = results[0]
          let totalPage = Math.ceil(results[1] / perPage)

          let categories = results[2].map(cat => {
            return {
              value: cat._id,
              label: cat._id
            }
          })
          categories.unshift({ value: '', label: 'All' })

          let brands = results[3].map(brand => {
            return {
              value: brand._id,
              label: brand._id
            }
          })
          brands.unshift({ value: '', label: 'All' })

          res.status(200).send({
            categories,
            brands,
            gifts,
            totalPage,
            total: results[1]
          })
        })
        .catch(error => {
          res.status(400).send()
        })
    }
  } catch (error) {
    res.status(400).send()
  }
})

router.get('/ub/:id', urboxCurrencyExchange, async (req, res) => {
  try {
    let reqBody = { ...urboxKey, id: req.params.id }
    let resData = await apiUrbox.getGiftDetail(reqBody)

    let gift = {
      ...resData.data.data,
      _id: resData.data.data.id,
      supplier: 'urbox',
      country: 'VN',
      currency: 'VND',
      pricePoint: Math.round(
        parseInt(resData.data.data.price) * req.currency.rate
      )
    }

    res.status(200).send({ gift })
  } catch (error) {
    res.status(400).send()
  }
})

router.get('/ezbiztrip/:id', async (req, res) => {
  try {
    Reward.findById(req.params.id)
      .then(gift => {
        if (!gift) {
          return res.status(404).send()
        }
        return res.status(200).send({
          gift
        })
      })
      .catch(e => {
        return res.status(400).send()
      })
  } catch (error) {
    res.status(400).send()
  }
})

router.post(
  '/exchange',
  urboxCurrencyExchange,
  async (req, res, next) => {
    try {
      let userPoint = req.user.point
      let giftPoint = 0

      let giftId = req.body._id
      let newVoucherData = {}

      // check if user has not enough point
      if (req.body.supplier === 'urbox') {
        let giftReqBody = { ...urboxKey, id: giftId }
        let giftRes = await apiUrbox.getGiftDetail(giftReqBody)

        if (giftRes.data.msg !== 'success') {
          return res.status(400).send({
            res: giftRes.data
          })
        }

        giftPoint = Math.round(
          parseInt(giftRes.data.data.price) * req.currency.rate
        )

        if (userPoint < giftPoint) {
          return res.status(400).send({
            message: 'not enough points to redeem this voucher'
          })
        }

        // if enough point, request voucher then save to db
        const siteUserId = 'ezbiztrip-' + req.user._id
        const transaction = require('order-id')(process.env.URBOX_SECRET)
        const transactionId = 'ezbiztrip-' + transaction.generate()

        let ubReqBody = {
          ...urboxKey,
          ttphone: process.env.URBOX_EZBIZTRIP_PHONE,
          ttemail: process.env.URBOX_EZBIZTRIP_EMAIL,
          fullname: process.env.URBOX_EZBIZTRIP_NAME,
          site_user_id: siteUserId,
          transaction_id: transactionId,
          dataBuy: [
            {
              priceId: giftId,
              quantity: '1'
            }
          ]
        }

        let ubResData = await apiUrbox.requestVoucher(ubReqBody)
        if (ubResData.data.msg !== 'success') {
          return res.status(400).send({
            res: ubResData.data
          })
        }

        newVoucherData = {
          ...req.body,
          _buyer: req.user._id,
          _company: req.user._company,
          pricePoint: giftPoint,
          siteUserId,
          transactionId,
          quantity: 1,
          cartId: ubResData.data.data.cart.id,
          cartNumber: ubResData.data.data.cart.cartNo,
          cartTotal: ubResData.data.data.cart.money_total,
          cartGiftLink: ubResData.data.data.cart.link_gift,
          cartGiftCode: ubResData.data.data.cart.code_link_gift[0].code,
          expiredDate: moment(
            ubResData.data.data.cart.code_link_gift[0].expired,
            'DD-MM-YYYY'
          ).format('YYYY-MM-DD')
        }
      } else if (req.body.supplier === 'ezbiztrip') {
        let gift = await Reward.findById(giftId)

        if (!gift) {
          return res.status(404).send()
        }

        giftPoint = gift.pricePoint

        if (userPoint < giftPoint) {
          return res.status(400).send({
            message: 'not enough points to redeem this voucher'
          })
        }

        newVoucherData = {
          _buyer: req.user._id,
          _company: req.user._company,
          ...req.body
        }
      }

      newVoucherData = _.omit(newVoucherData, ['_id', '__v'])
      let voucher = new Voucher(newVoucherData)
      await voucher.save()

      const remainingPoints = userPoint - giftPoint
      User.findByIdAndUpdate(
        req.user._id,
        { $set: { point: remainingPoints } },
        { new: true }
      )
        .then(user => {
          if (!user) {
            return res.status(404).send()
          }

          res.status(200).send({
            message: 'success',
            voucherId: voucher.id,
            remainingPoints: user.point
          })
        })
        .catch(error => {
          return res.status(400).send()
        })

      next()
    } catch (error) {
      res.status(400).send()
    }
  },
  emailEzBizTripVoucherInfo
)

module.exports = router
