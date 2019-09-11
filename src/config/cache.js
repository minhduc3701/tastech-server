const NodeCache = require('node-cache')
const appCache = new NodeCache()

const setCache = (key, value, ttl) => {
  return new Promise((resolve, reject) => {
    appCache.set(key, value, ttl, (err, success) => {
      if (!err && success) {
        resolve(success)
      }

      reject(err)
    })
  })
}

const getCache = key => {
  return new Promise((resolve, reject) => {
    appCache.get(key, function(err, value) {
      if (!err) {
        if (value == undefined) {
          reject(err)
        } else {
          resolve(value)
        }
      }

      reject(err)
    })
  })
}

const deleteCache = key => deleteCaches([key])

const deleteCaches = keys => {
  return new Promise((resolve, reject) => {
    appCache.del(keys, (err, count) => {
      if (!err) {
        resolve(count)
      }

      reject(err)
    })
  })
}

module.exports = {
  appCache,
  setCache,
  getCache,
  deleteCache
}
