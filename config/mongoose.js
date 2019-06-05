var mongoose = require('mongoose')
mongoose.Promise = global.Promise
mongoose.set('useFindAndModify', false)

const { debugDb } = require('./debug')

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useCreateIndex: true
  })
  .then(() => debugDb('connection succesful'))
  .catch(err => debugDb(err))

module.exports = { mongoose }
