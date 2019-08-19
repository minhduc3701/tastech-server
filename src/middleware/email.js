const { logger } = require('../config/winston')
const { mail } = require('../config/mail')
const mailTemplates = require('../config/mailTemplates.js')

const submitTrip = async (req, res) => {
  let mailOptions = mailTemplates.submitTrip(req.user)
  mail.sendMail(mailOptions, function(err, info) {
    if (err) {
      debugMail(error)
    }
  })
}

const changeTripStatus = async (req, res) => {
  if (req.trip) {
    console.log(req.trip)
    let mailOptions = mailTemplates.changeTripStatus(req.user, req.trip)
    mail.sendMail(mailOptions, function(err, info) {
      if (err) {
        debugMail(error)
        logger.info('mail: ', { err: err })
      }
    })
  } else {
    logger.info('trip: ', { err: 'No trip' })
  }
}

module.exports = {
  submitTrip,
  changeTripStatus
}
