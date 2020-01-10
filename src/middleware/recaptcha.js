const _ = require('lodash')
const apiRecaptcha = require('../modules/apiRecaptcha')

const verifyRecaptcha = async (req, res, next) => {
  let captchaResponse = _.get(req.body, 'captchaResponse')

  // must have captcha client
  if (!captchaResponse) {
    return res.status(400).send()
  }

  // verify recaptcha
  try {
    let recaptchaVerifyRes = await apiRecaptcha.verify(captchaResponse)
    if (!recaptchaVerifyRes.data.success) {
      throw new Error('verify captcha fail')
    }
  } catch (e) {
    return res.status(400).send()
  }

  next()
}

module.exports = {
  verifyRecaptcha
}
