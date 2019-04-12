const mongoose = require('mongoose')
const Schema = mongoose.Schema

const RoleSchema = new Schema({
  name: String,
  permissions: Array,
  users: Array,
  _company: mongoose.Schema.Types.ObjectId
})

module.exports = mongoose.model('Role', RoleSchema)
