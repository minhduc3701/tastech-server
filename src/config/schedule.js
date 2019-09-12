const schedule = require('node-schedule')
const Trip = require('../models/trip')

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
