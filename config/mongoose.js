var mongoose = require('mongoose')
mongoose.Promise = global.Promise

mongoose
  .connect('mongodb://localhost:27017/server-db')
  .then(() => console.log('connection succesful'))
  .catch(err => console.error(err))

module.exports = { mongoose }
