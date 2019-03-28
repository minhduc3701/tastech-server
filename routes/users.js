var express = require('express')
var router = express.Router()

router.get('/me', function(req, res, next) {
  res.send(req.user)
})

router.patch('/me', async (req, res) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = [
    'country',
    'title',
    'firstName',
    'lastName',
    'phone',
    'role',
    'age'
  ]
  const isValidOperation = updates.every(update =>
    allowedUpdates.includes(update)
  )

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' })
  }

  try {
    updates.forEach(update => (req.user[update] = req.body[update]))
    await req.user.save()
    res.send(req.user)
  } catch {
    res.status(400).send()
  }
})

module.exports = router
