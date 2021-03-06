const request = require('supertest')
const app = require('../../src/app')
const mongoose = require('mongoose')
const User = require('../../src/models/user')
const Department = require('../../src/models/department')
const _ = require('lodash')
const {
  adminToken,
  setupDatabase,
  userId,
  user2Id,
  userCompany2Id,
  companyId,
  departmentId,
  departmentCompany2Id,
  departmentCompany
} = require('../fixtures/db.js')

beforeEach(setupDatabase)

// @see https://github.com/visionmedia/supertest/issues/520#issuecomment-469044925
// @see https://github.com/facebook/jest/issues/7287
afterAll(async () => {
  await new Promise(resolve => setTimeout(() => resolve(), 500)) // avoid jest open handle error
  mongoose.disconnect()
})

// test('Should create new department', async () => {
//   let newDepartment = await request(app)
//     .post(`/admin/departments`)
//     .set('Authorization', `Bearer ${adminToken}`)
//     .send({
//       name: 'New department',
//       employees: [userId, user2Id]
//     })
//     .expect(200)

//   expect(newDepartment.body.department).toMatchObject({
//     name: 'New department',
//     _company: companyId.toHexString()
//   })

//   let departmentUsersCount = await User.countDocuments({
//     _department: newDepartment.body.department._id,
//     _id: { $in: [userId, user2Id] }
//   })

//   expect(departmentUsersCount).toBe(2)
// })

// test('Should not update other company employee department when create', async () => {
//   let newDepartment = await request(app)
//     .post(`/admin/departments`)
//     .set('Authorization', `Bearer ${adminToken}`)
//     .send({
//       name: 'New department',
//       employees: [userId, user2Id, userCompany2Id]
//     })
//     .expect(200)

//   expect(newDepartment.body.department).toMatchObject({
//     name: 'New department',
//     _company: companyId.toHexString()
//   })

//   let departmentUsersCount = await User.countDocuments({
//     _department: newDepartment.body.department._id,
//     _id: { $in: [userId, user2Id, userCompany2Id] }
//   })

//   expect(departmentUsersCount).toBe(2)
// })

test('Should get department list', async () => {
  let res = await request(app)
    .get(`/admin/departments`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200)

  expect(res.body.departments.length).toBe(1)
  expect(res.body.departments[0]).toMatchObject({
    _id: departmentCompany._id.toHexString(),
    name: departmentCompany.name,
    _company: departmentCompany._company.toHexString()
  })
})

test('Should get a department', async () => {
  let res = await request(app)
    .get(`/admin/departments/${departmentId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200)

  expect(res.body.department).toMatchObject({
    _id: departmentCompany._id.toHexString(),
    name: departmentCompany.name,
    _company: departmentCompany._company.toHexString()
  })
})

test('Should not get a department of other company', async () => {
  let res = await request(app)
    .get(`/admin/departments/${departmentCompany2Id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(404)
})

test('Should not get a department with invalid id', async () => {
  let res = await request(app)
    .get(`/admin/departments/invalid-department-id`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(404)
})

test('Should not get a department with non-exist id', async () => {
  let res = await request(app)
    .get(`/admin/departments/${new mongoose.Types.ObjectId()}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(404)
})

// test('Should edit department name and employees', async () => {
//   let editDepartment = await request(app)
//     .patch(`/admin/departments/${departmentId}`)
//     .set('Authorization', `Bearer ${adminToken}`)
//     .send({
//       name: 'Department 1 update',
//       employees: [userId, user2Id]
//     })
//     .expect(200)

//   expect(editDepartment.body.department).toMatchObject({
//     _id: departmentId.toHexString(),
//     name: 'Department 1 update',
//     _company: companyId.toHexString()
//   })

//   let departmentUsersCount = await User.countDocuments({
//     _department: departmentId,
//     _id: { $in: [userId, user2Id] }
//   })

//   expect(departmentUsersCount).toBe(2)
// })

// test('Should not edit employees department from other company when update', async () => {
//   let editDepartment = await request(app)
//     .patch(`/admin/departments/${departmentId}`)
//     .set('Authorization', `Bearer ${adminToken}`)
//     .send({
//       name: 'Department 1 update',
//       employees: [userId, user2Id, userCompany2Id]
//     })
//     .expect(200)

//   expect(editDepartment.body.department).toMatchObject({
//     _id: departmentId.toHexString(),
//     name: 'Department 1 update',
//     _company: companyId.toHexString()
//   })

//   let departmentUsersCount = await User.countDocuments({
//     _department: departmentId,
//     _id: { $in: [userId, user2Id] }
//   })

//   expect(departmentUsersCount).toBe(2)

//   let departmentOtherUsersCount = await User.countDocuments({
//     _department: departmentId,
//     _id: userCompany2Id
//   })

//   expect(departmentOtherUsersCount).toBe(0)
// })

// test('Should remove current employees in department that not in request list', async () => {
//   await request(app)
//     .patch(`/admin/departments/${departmentId}`)
//     .set('Authorization', `Bearer ${adminToken}`)
//     .send({
//       name: 'Department 1 update',
//       employees: [userId, user2Id]
//     })
//     .expect(200)

//   let departmentUsersCount = await User.countDocuments({
//     _department: departmentId,
//     _id: { $in: [userId, user2Id] }
//   })

//   expect(departmentUsersCount).toBe(2)

//   await request(app)
//     .patch(`/admin/departments/${departmentId}`)
//     .set('Authorization', `Bearer ${adminToken}`)
//     .send({
//       name: 'Department 1 update',
//       employees: [userId]
//     })
//     .expect(200)

//   departmentUsersCount = await User.countDocuments({
//     _department: departmentId,
//     _id: { $in: [userId, user2Id] }
//   })

//   expect(departmentUsersCount).toBe(1)
// })

test('Should not edit department if invalid id', async () => {
  await request(app)
    .patch(`/admin/departments/invalid-department-id`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({})
    .expect(404)
})

test('Should not update department of other company to employees', async () => {
  await request(app)
    .patch(`/admin/departments/${departmentCompany2Id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Company 2 - update department',
      employees: [userId, user2Id]
    })
    .expect(404)

  let departmentUsersCount = await User.countDocuments({
    _department: departmentCompany2Id,
    _id: { $in: [userId, user2Id] }
  })

  expect(departmentUsersCount).toBe(0)

  let departmentCompany2 = await Department.findOne({
    _id: departmentCompany2Id
  })
  expect(departmentCompany2.name).not.toBe('Company 2 - update department')
})

test('Should delete department', async () => {
  let res = await request(app)
    .delete(`/admin/departments/${departmentId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200)

  expect(res.body.department).toMatchObject({
    _id: departmentCompany._id.toHexString(),
    name: departmentCompany.name,
    _company: departmentCompany._company.toHexString()
  })

  let departmentsCount = await Department.countDocuments({
    _id: departmentId
  })

  expect(departmentsCount).toBe(0)
})

test('Should not delete department with invalid object id', async () => {
  let res = await request(app)
    .delete(`/admin/departments/invalid-department-id`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(404)
})

test('Should not delete non-exist policy', async () => {
  let res = await request(app)
    .delete(`/admin/departments/${new mongoose.Types.ObjectId()}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(404)
})

test('Should not delete policy of other company', async () => {
  let res = await request(app)
    .delete(`/admin/departments/${departmentCompany2Id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(404)

  expect(
    await Department.countDocuments({
      _id: departmentCompany2Id
    })
  ).toBe(1)
})

test('Should get users of all departments without resetPasswordToken and resetPasswordExpires', async () => {
  let res = await request(app)
    .get(`/admin/departments`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200)
  res.body.departments.map(department => {
    department.employees.map(employee => {
      expect(employee).not.toHaveProperty('resetPasswordToken')
      expect(employee).not.toHaveProperty('resetPasswordExpires')
    })
  })
})

test('Should get users of department without resetPasswordToken and resetPasswordExpires', async () => {
  let res = await request(app)
    .get(`/admin/departments/${departmentId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200)
  res.body.department.employees.map(employee => {
    expect(employee).not.toHaveProperty('resetPasswordToken')
    expect(employee).not.toHaveProperty('resetPasswordExpires')
  })
})
