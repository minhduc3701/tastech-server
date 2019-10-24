const schedule = require('node-schedule')
const moment = require('moment')
const Trip = require('../models/trip')
const Order = require('../models/order')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

// run everyday at 0h 0m 0s (00:00:00)
schedule.scheduleJob('0 0 0 */1 * *', function() {
  Trip.updateMany(
    {
      status: {
        $in: ['ongoing', 'approved']
      },
      endDate: { $lt: Date.now() - 86400000 } // minus 1 day
    },
    {
      $set: {
        status: 'finished'
      }
    }
  )
    .then(results => {
      console.log('cron job for updating ongoing to finished trips', results)
    })
    .catch(e => {
      console.log('cron job for updating ongoing to finished trips', e)
    })
})

// run everyday at 0h 0m 0s (00:00:00)
schedule.scheduleJob('0 0 0 */1 * *', function() {
  Trip.updateMany(
    {
      status: {
        $in: ['waiting', 'rejected']
      },
      endDate: { $lt: Date.now() }
    },
    {
      $set: {
        status: 'completed'
      }
    }
  )
    .then(results => {
      console.log(
        'cron job for updating waiting or rejected trip to completed trips',
        results
      )
    })
    .catch(e => {
      console.log(
        'cron job for updating waiting or rejected trip to completed trips',
        e
      )
    })
})

// run everyday at 0h 0m 0s (00:00:00)
schedule.scheduleJob('0 0 0 */1 * *', function() {
  let fiveDayAgo = moment().subtract(5, 'days')
  console.log(fiveDayAgo.format('YYYY-MM-DD 00:00:00'))
  console.log(fiveDayAgo.format('YYYY-MM-DD 23:59:59'))

  Order.find({
    status: { $in: ['processing', 'completed'] },
    createdAt: {
      $gte: new Date(fiveDayAgo.format('YYYY-MM-DD 00:00:00')),
      $lte: new Date(fiveDayAgo.format('YYYY-MM-DD 23:59:59'))
    }
  })
    .then(orders => {
      console.log('cron job will capture ' + orders.length + ' orders')
      return Promise.all(
        orders.map(order => stripe.charges.capture(order.chargeId))
      )
    })
    .then(results => {
      console.log('capture results', results)
    })
    .catch(e => {
      console.log('cron job for capturing processing and completed orders', e)
    })
})
