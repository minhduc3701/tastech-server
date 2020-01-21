const axios = require('axios')

const recaptchaHttp = axios.create({
  baseURL: 'https://www.google.com'
})

const endpoints = {
  siteverify: 'recaptcha/api/siteverify'
}

const apiRecaptcha = {
  // @see https://developers.google.com/recaptcha/docs/verify
  verify: response => {
    // @see https://stackoverflow.com/a/52416003
    return recaptchaHttp.post(
      `${endpoints.siteverify}?secret=${
        process.env.RECAPTCHA_V3_SECRET_KEY
      }&response=${response}`
    )
  }
}

module.exports = apiRecaptcha
