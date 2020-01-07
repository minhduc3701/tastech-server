const request = require('supertest')
const app = require('../../src/app')
const mongoose = require('mongoose')
const User = require('../../src/models/user')
const Policy = require('../../src/models/policy')
const _ = require('lodash')
const {
  adminToken,
  setupDatabase,
  userId,
  user2Id,
  userCompany2Id,
  companyId,
  policyId,
  policyCompany,
  policyCompany2Id,
  policyCompany2,
  policy2Id,
  policy2Company
} = require('../fixtures/db.js')

beforeEach(setupDatabase)

// @see https://github.com/visionmedia/supertest/issues/520#issuecomment-469044925
// @see https://github.com/facebook/jest/issues/7287
afterAll(async () => {
  await new Promise(resolve => setTimeout(() => resolve(), 500)) // avoid jest open handle error
  mongoose.disconnect()
})

test('Should create new policy which is enabled', async () => {
  let newPolicy = await request(app)
    .post(`/admin/policies`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'New policy',
      employees: [userId, user2Id],
      status: 'disabled' // request disabled but enabled by default
    })
    .expect(200)

  expect(newPolicy.body.policy).toMatchObject({
    name: 'New policy',
    _company: companyId.toHexString(),
    status: 'enabled'
  })

  let policyUsersCount = await User.countDocuments({
    _policy: newPolicy.body.policy._id,
    _id: { $in: [userId, user2Id] }
  })

  expect(policyUsersCount).toBe(2)
})

test('Should not update other company employee policy when create', async () => {
  let newPolicy = await request(app)
    .post(`/admin/policies`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'New policy',
      employees: [userId, user2Id, userCompany2Id]
    })
    .expect(200)

  expect(newPolicy.body.policy).toMatchObject({
    name: 'New policy',
    _company: companyId.toHexString()
  })

  let policyUsersCount = await User.countDocuments({
    _policy: newPolicy.body.policy._id,
    _id: { $in: [userId, user2Id, userCompany2Id] }
  })

  expect(policyUsersCount).toBe(2)
})

test('Should get policy list', async () => {
  let res = await request(app)
    .get(`/admin/policies`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200)

  expect(res.body.policies.length).toBe(2)
  expect(res.body.policies[0]).toMatchObject({
    _id: policyCompany._id.toHexString(),
    name: policyCompany.name,
    _company: policyCompany._company.toHexString(),
    status: 'default'
  })
})

test('Should not get a policy of other company', async () => {
  let res = await request(app)
    .get(`/admin/policies/${policyCompany2Id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(404)
})

test('Should not get a policy with invalid id', async () => {
  let res = await request(app)
    .get(`/admin/policies/invalid-policy-id`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(404)
})

test('Should not get a policy with non-exist id', async () => {
  let res = await request(app)
    .get(`/admin/policies/${new mongoose.Types.ObjectId()}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(404)
})

test('Should edit policy name and employees', async () => {
  let editPolicy = await request(app)
    .patch(`/admin/policies/${policyId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Policy 1 update',
      employees: [userId, user2Id],
      status: 'disabled' // request disabled, but result must default
    })
    .expect(200)

  expect(editPolicy.body.policy).toMatchObject({
    _id: policyId.toHexString(),
    name: 'Policy 1 update',
    _company: companyId.toHexString(),
    status: 'default'
  })

  let policyUsersCount = await User.countDocuments({
    _policy: policyId,
    _id: { $in: [userId, user2Id] }
  })

  expect(policyUsersCount).toBe(2)
})

test('Should not edit employees policy from other company when update', async () => {
  let editPolicy = await request(app)
    .patch(`/admin/policies/${policyId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Policy 1 update',
      employees: [userId, user2Id, userCompany2Id]
    })
    .expect(200)

  expect(editPolicy.body.policy).toMatchObject({
    _id: policyId.toHexString(),
    name: 'Policy 1 update',
    _company: companyId.toHexString()
  })

  let departmentUsersCount = await User.countDocuments({
    _policy: policyId,
    _id: { $in: [userId, user2Id] }
  })

  expect(departmentUsersCount).toBe(2)

  let departmentOtherUsersCount = await User.countDocuments({
    _policy: policyId,
    _id: userCompany2Id
  })

  expect(departmentOtherUsersCount).toBe(0)
})

test('Should remove current employees in policy that not in request list', async () => {
  await request(app)
    .patch(`/admin/policies/${policyId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Policy 1 update',
      employees: [userId, user2Id]
    })
    .expect(200)

  let policyUsersCount = await User.countDocuments({
    _policy: policyId,
    _id: { $in: [userId, user2Id] }
  })

  expect(policyUsersCount).toBe(2)

  await request(app)
    .patch(`/admin/policies/${policyId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Policy 1 update',
      employees: [userId]
    })
    .expect(200)

  policyUsersCount = await User.countDocuments({
    _policy: policyId,
    _id: { $in: [userId, user2Id] }
  })

  expect(policyUsersCount).toBe(1)
})

test('Should not edit policy if invalid id', async () => {
  await request(app)
    .patch(`/admin/policies/invalid-policy-id`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({})
    .expect(404)
})

test('Should not update policy of other company to employees', async () => {
  await request(app)
    .patch(`/admin/policies/${policyCompany2Id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Company 2 - update policy',
      employees: [userId, user2Id]
    })
    .expect(404)

  let policyUsersCount = await User.countDocuments({
    _policy: policyCompany2Id,
    _id: { $in: [userId, user2Id] }
  })

  expect(policyUsersCount).toBe(0)

  let policyCompany2Db = await Policy.findOne({
    _id: policyCompany2Id
  })
  expect(policyCompany2Db.name).not.toBe('Company 2 - update policy')
})

test('Should delete policy', async () => {
  let res = await request(app)
    .delete(`/admin/policies/${policy2Id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200)

  expect(res.body.policy).toMatchObject({
    _id: policy2Company._id.toHexString(),
    name: policy2Company.name,
    _company: policy2Company._company.toHexString()
  })

  expect(
    await Policy.countDocuments({
      _id: policy2Id
    })
  ).toBe(0)
})

test('Should not delete policy with invalid object id', async () => {
  let res = await request(app)
    .delete(`/admin/policies/invalid-policy-id`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(404)
})

test('Should not delete default policy', async () => {
  let res = await request(app)
    .delete(`/admin/policies/${policyId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(404)
})

test('Should not delete non-exist policy', async () => {
  let res = await request(app)
    .delete(`/admin/policies/${new mongoose.Types.ObjectId()}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(404)

  expect(
    await Policy.countDocuments({
      _id: policyCompany2Id
    })
  ).toBe(1)
})

test('Should not delete policy of other company', async () => {
  let res = await request(app)
    .delete(`/admin/policies/${policyCompany2Id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(404)

  expect(
    await Policy.countDocuments({
      _id: policyCompany2Id
    })
  ).toBe(1)
})

test('Should get users of all policies without resetPasswordToken and resetPasswordExpires', async () => {
  let res = await request(app)
    .get(`/admin/policies`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200)
  res.body.policies.map(policy => {
    policy.employees.map(employee => {
      expect(employee).not.toHaveProperty('resetPasswordToken')
      expect(employee).not.toHaveProperty('resetPasswordExpires')
    })
  })
})

test('Should get users of policy without resetPasswordToken and resetPasswordExpires', async () => {
  let res = await request(app)
    .get(`/admin/policies/${policy2Id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200)
  res.body.policy.employees.map(employee => {
    expect(employee).not.toHaveProperty('resetPasswordToken')
    expect(employee).not.toHaveProperty('resetPasswordExpires')
  })
})
