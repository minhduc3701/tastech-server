const mongoose = require('mongoose')
const Schema = mongoose.Schema

const RoleSchema = new Schema({
  name: String,
  type: String,
  permissions: Array,
  _company: mongoose.Schema.Types.ObjectId,
  _partner: {
    type: 'ObjectId',
    ref: 'Partner'
  }
})

module.exports = mongoose.model('Role', RoleSchema)
