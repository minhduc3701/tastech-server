const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors())
app.use(express.json())

const port = 5050

// fake
app.post('/voiding', (req, res) => {
  res.status(200).send({
    errorCode: '0',
    errorMsg: 'ok',
    data: {
      orderNum: req.body.voidRequest.orderNum,
      voidOrderNum: 1432558799,
      passengers: req.body.voidRequest.passengers
    }
  })
})

app.listen(port, () => console.log(`Fake app listening on port ${port}!`))
