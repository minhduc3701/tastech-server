var mongoose = require('mongoose')
mongoose.Promise = global.Promise

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('connection succesful'))
  .catch(err => console.error(err))

module.exports = { mongoose }
