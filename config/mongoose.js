var mongoose = require('mongoose')
mongoose.Promise = global.Promise

mongoose
  .connect('mongodb://localhost:27017/node-auth')
  .then(() => console.log('connection succesful'))
  .catch(err => console.error(err))

module.exports = { mongoose }
