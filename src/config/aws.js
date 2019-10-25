const multer = require('multer')
const multerS3 = require('multer-s3')
const aws = require('aws-sdk')

aws.config.update({
  // Never share it!
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  // Never share it!
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  region: process.env.AWS_S3_REGION // region of your bucket
})

const s3 = new aws.S3()

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_NAME,
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function(req, file, cb) {
      let fileType = file.mimetype.split('/')
      let extension = fileType[fileType.length - 1]
      cb(null, Date.now().toString() + `.${extension}`)
    }
  }),
  // @see https://www.npmjs.com/package/multer#limits
  limits: {
    fileSize: 2 * 1024 * 1024 // we are allowing only 2 MB files
  }
})

module.exports = {
  upload
}
