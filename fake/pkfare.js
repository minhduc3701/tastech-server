const express = require('express')
const cors = require('cors')
const _ = require('lodash')

const app = express()

app.use(cors())
app.use(express.json())

const port = 5050

// fake
app.get('/voiding', (req, res) => {
  console.log(req.query.param)
  let buff = new Buffer(req.query.param, 'base64')
  let text = buff.toString('ascii')

  try {
    let data = JSON.parse(text)

    return res.status(200).send({
      errorCode: '0',
      errorMsg: 'ok',
      data: {
        ..._.pick(data.voidRequest, ['orderNum', 'passengers']),
        voidOrderNum: Date.now()
      }
    })
  } catch (e) {
    res.status(400).send({ error: e })
  }
})

app.listen(port, () => console.log(`Fake app listening on port ${port}!`))
