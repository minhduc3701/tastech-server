const debug = require('debug')

module.exports = {
  debugServer: debug('tas-server-app:server'),
  debugMail: debug('tas-server-app:mail'),
  debugDb: debug('tas-server-app:db'),
  debugPkfare: debug('tas-server-app:pkfare')
}
