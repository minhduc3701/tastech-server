const pdf = require('html-pdf')
const fs = require('fs')
const { s3Upload } = require('../config/aws')
const { getImageUri } = require('../modules/utils')

const createPdf = async content => {
  const stream = await new Promise((resolve, reject) => {
    pdf.create(content).toStream((err, stream) => {
      if (err) {
        reject(reject)
        return
      }
      resolve(stream)
    })
  })

  const fileName = `${+new Date()}.pdf`
  const pdfPath = `${__dirname}/../../tmp/${fileName}`
  stream.pipe(fs.createWriteStream(pdfPath))

  s3Upload(pdfPath, fileName, 'application/pdf')

  return {
    pdfUri: getImageUri(fileName),
    pdfName: fileName
  }
}

module.exports = {
  createPdf
}
