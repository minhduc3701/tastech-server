var mongoose = require('mongoose')
mongoose.Promise = global.Promise

const { debugDb } = require('./debug')
const debug = require('debug')(debugDb)

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => debug('connection succesful'))
  .catch(err => debug(err))

module.exports = { mongoose }
