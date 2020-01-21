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
    // @see https://stackoverflow.com/a/54118106
    // with test key to run tests on CI, there is no score field return
    // so the score will be bypass on CI with hostname === 'testkey.google.com'
    if (recaptchaVerifyRes.data.score <= 0.5) {
      throw new Error('captcha score <= 0.5')
    }
  } catch (e) {
    return res.status(400).send()
  }

  next()
}

module.exports = {
  verifyRecaptcha
}
