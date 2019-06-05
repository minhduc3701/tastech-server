const schedule = require('node-schedule')
const Trip = require('../models/trip')

// run everyday at 0h 0m 0s (00:00:00)
schedule.scheduleJob('0 0 0 */1 * *', function() {
  Trip.updateMany(
    {
      status: 'ongoing',
      $or: [
        {
          returnDate: { $eq: null },
          departureDate: { $lt: Date.now() }
        },
        {
          returnDate: { $lt: Date.now() }
        }
      ]
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
