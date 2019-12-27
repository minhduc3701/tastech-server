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
  companyDepartment
} = require('../fixtures/db.js')

beforeEach(setupDatabase)

test('Should create new department', async () => {
  let newDepartment = await request(app)
    .post(`/admin/departments`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'New department',
      employees: [userId, user2Id]
    })
    .expect(200)

  expect(newDepartment.body.department).toMatchObject({
    name: 'New department',
    _company: companyId.toHexString()
  })

  let departmentUsersCount = await User.countDocuments({
    _department: newDepartment.body.department._id,
    _id: { $in: [userId, user2Id] }
  })

  expect(departmentUsersCount).toBe(2)
})

test('Should not update other company employee department when create', async () => {
  let newDepartment = await request(app)
    .post(`/admin/departments`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'New department',
      employees: [userId, user2Id, userCompany2Id]
    })
    .expect(200)

  expect(newDepartment.body.department).toMatchObject({
    name: 'New department',
    _company: companyId.toHexString()
  })

  let departmentUsersCount = await User.countDocuments({
    _department: newDepartment.body.department._id,
    _id: { $in: [userId, user2Id, userCompany2Id] }
  })

  expect(departmentUsersCount).toBe(2)
})

test('Should get department list', async () => {
  let res = await request(app)
    .get(`/admin/departments`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200)

  expect(res.body.departments.length).toBe(1)
  expect(res.body.departments[0]).toMatchObject({
    _id: companyDepartment._id.toHexString(),
    name: companyDepartment.name,
    _company: companyDepartment._company.toHexString()
  })
})

test('Should get a department', async () => {
  let res = await request(app)
    .get(`/admin/departments/${departmentId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200)

  expect(res.body.department).toMatchObject({
    _id: companyDepartment._id.toHexString(),
    name: companyDepartment.name,
    _company: companyDepartment._company.toHexString()
  })
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

test('Should edit department name and employees', async () => {
  let editDepartment = await request(app)
    .patch(`/admin/departments/${departmentId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Department 1 update',
      employees: [userId, user2Id]
    })
    .expect(200)

  expect(editDepartment.body.department).toMatchObject({
    _id: departmentId.toHexString(),
    name: 'Department 1 update',
    _company: companyId.toHexString()
  })

  let departmentUsersCount = await User.countDocuments({
    _department: departmentId,
    _id: { $in: [userId, user2Id] }
  })

  expect(departmentUsersCount).toBe(2)
})

test('Should not edit employees department from other company when update', async () => {
  let editDepartment = await request(app)
    .patch(`/admin/departments/${departmentId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Department 1 update',
      employees: [userId, user2Id, userCompany2Id]
    })
    .expect(200)

  expect(editDepartment.body.department).toMatchObject({
    _id: departmentId.toHexString(),
    name: 'Department 1 update',
    _company: companyId.toHexString()
  })

  let departmentUsersCount = await User.countDocuments({
    _department: departmentId,
    _id: { $in: [userId, user2Id] }
  })

  expect(departmentUsersCount).toBe(2)

  let departmentOtherUsersCount = await User.countDocuments({
    _department: departmentId,
    _id: userCompany2Id
  })

  expect(departmentOtherUsersCount).toBe(0)
})

test('Should remove current employees in department when not in request list', async () => {
  await request(app)
    .patch(`/admin/departments/${departmentId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Department 1 update',
      employees: [userId, user2Id]
    })
    .expect(200)

  let departmentUsersCount = await User.countDocuments({
    _department: departmentId,
    _id: { $in: [userId, user2Id] }
  })

  expect(departmentUsersCount).toBe(2)

  await request(app)
    .patch(`/admin/departments/${departmentId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Department 1 update',
      employees: [userId]
    })
    .expect(200)

  departmentUsersCount = await User.countDocuments({
    _department: departmentId,
    _id: { $in: [userId, user2Id] }
  })

  expect(departmentUsersCount).toBe(1)
})

test('Should not edit if invalid id', async () => {
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
    _id: companyDepartment._id.toHexString(),
    name: companyDepartment.name,
    _company: companyDepartment._company.toHexString()
  })

  let departmentsCount = await Department.countDocuments({
    _company: companyId
  })

  expect(departmentsCount).toBe(0)
})
