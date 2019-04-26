const mongoose = require('mongoose')
const Schema = mongoose.Schema

const DepartmentSchema = new Schema({
  _company: mongoose.Schema.Types.ObjectId,
  name: {
    type: String,
    required: true
  },
  employees: [
    {
      type: 'ObjectId'
    }
  ]
})

module.exports = mongoose.model('Department', DepartmentSchema)
