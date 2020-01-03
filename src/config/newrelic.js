if (process.env.NEWRELIC_APP_NAME && process.env.NEWRELIC_LICENSE_KEY) {
  require('newrelic')
}
