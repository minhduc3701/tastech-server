require('../config/config')
require('../config/mongoose')

const { populateAgent } = require('./data/prod')
const yargs = require('yargs')

const argv = yargs
  .options({
    e: {
      alias: 'email',
      describe: 'Email of user need to seed',
      required: true
    },
    p: {
      alias: 'password',
      describe: 'Password of user need to seed',
      required: true
    }
  })
  .help()
  .alias('help', 'h').argv

// seeding for production
let email = argv.e
let password = argv.p

populateAgent(email, password).then(results => {
  process.exit(0)
})
