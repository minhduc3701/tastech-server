var mongoose = require('mongoose')
mongoose.Promise = global.Promise
mongoose.set('useFindAndModify', false)

const { debugDb } = require('./debug')
const debug = require('debug')(debugDb)

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useCreateIndex: true
  })
  .then(() => debug('connection succesful'))
  .catch(err => debug(err))

module.exports = { mongoose }
