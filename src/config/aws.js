const multer = require('multer')
const multerS3 = require('multer-s3')
const aws = require('aws-sdk')
const fs = require('fs')

aws.config.update({
  // Never share it!
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  // Never share it!
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  region: process.env.AWS_S3_REGION // region of your bucket
})

const s3 = new aws.S3()

const createFileFilter = mimetypes => {
  return (req, file, cb) => {
    if (mimetypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb({ code: 'WRONG_FILE_EXTENSION' }, false)
    }
  }
}

const fileUpload = context => {
  let mimetypes
  switch (context) {
    case 'avatar':
      mimetypes = ['image/jpeg', 'image/png']
      break
    case 'receipts':
      mimetypes = ['image/jpeg', 'image/png', 'application/pdf']
      break
    default:
      mimetypes = []
      break
  }

  return multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.AWS_S3_NAME,
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: function(req, file, cb) {
        let fileType = file.mimetype.split('/')
        let extension = fileType[fileType.length - 1]
        let fileName = Date.now().toString() + '___' + file.originalname
        // if (extension === 'pdf') {
        //   fileName += `.${extension}`
        // }
        cb(null, fileName)
      }
    }),
    fileFilter: createFileFilter(mimetypes),
    // @see https://www.npmjs.com/package/multer#limits
    limits: {
      fileSize: 2 * 1024 * 1024 // we are allowing only 2 MB files
    }
  })
}

// @see https://stackoverflow.com/a/43327573
// @see http://blog.katworksgames.com/2014/01/26/nodejs-deploying-files-to-aws-s3/
const s3Upload = (source, target, contentType) => {
  fs.readFile(source, function(err, data) {
    if (!err) {
      var params = {
        Bucket: process.env.AWS_S3_NAME,
        Key: target,
        Body: data,
        ContentType: contentType || 'application/octet-stream'
      }

      s3.putObject(params, function(err, data) {
        if (!err) {
          // console.log('[s3] file uploaded:');
          // console.log(data);
          fs.unlink(source, () => {
            // console.log('deleted file')
          }) // optionally delete the file
        } else {
          // console.log(err);
        }
      })
    }
  })
}

module.exports = {
  fileUpload,
  s3Upload
}
