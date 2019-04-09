const mongoose = require('mongoose')
const Schema = mongoose.Schema

const RoleSchema = new Schema({
  name: String,
  permissions: Array
})

module.exports = mongoose.model('Role', RoleSchema)
