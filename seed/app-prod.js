require('../config/config')
require('../config/mongoose')

const { populateTasAdmin } = require('./production')
const yargs = require('yargs')

const argv = yargs
  .options({
    e: {
      alias: 'email',
      describe: 'Email of user need to seed'
    },
    p: {
      alias: 'password',
      describe: 'Password of user need to seed'
    }
  })
  .help()
  .alias('help', 'h').argv

// seeding for production
let email = argv.e
let password = argv.p

populateTasAdmin(email, password).then(results => {
  process.exit(0)
})
