const express = require('express')
const router = express.Router()
const City = require('../models/city')
const Airport = require('../models/airport')

const _ = require('lodash')

router.post('/search', function(req, res, next) {
  // City.find({
  //   $or: [{
  //     alternate_names: {
  //       $elemMatch: {
  //         $eq: _.toLower(_.trim(req.body.name))
  //       }
  //     }
  //   },
  //   { 'name' : { '$regex' : '.*' + _.trim(req.body.name) + '.*', '$options' : 'i' } }
  //   ]
  // },
  // { name: 1}
  // )
  // // .limit(5)
  //   .then(cities => {
  //     let cityIds = []
  //     console.log(cities)
  //     cities.map(city => {
  //         cityIds.push(city._doc._id)
  //       }
  //     )
  //     console.log(cityIds)
  //     return Airport.find(
  //       {
  //         city_name_geo_name_id: {$in : cityIds}
  //       }
  //     )
  //   })
  //   .then(airports => {
  //     console.log(airports)
  //     res.status(200).send(airports)
  //   })
  //   .catch(e => {
  //     console.log(e)
  //     res.status(400).send()
  //   })
  City.aggregate([
    {
      $match: {
        $or: [
          { name: { $regex: `^${_.trim(req.body.name)}`, $options: 'i' } },
          { name: { $regex: `.*${_.trim(req.body.name)}.*`, $options: 'i' } },
          {
            alternate_names: {
              $elemMatch: {
                $eq: _.toLower(_.trim(req.body.name))
              }
            }
          }
        ]
      }
    },
    { $limit: 10 },
    {
      $project: {
        name: 1
        // "criteria": {
        //   $cond: [
        //     // { 'name': { $regex: `^${_.trim(req.body.name)}`, $options: 'i' } },
        //     { $match : { name : _.trim(req.body.name) } },
        //     3,1
        //     // {
        //     //   "$cond": [
        //     //     { 'name': { $regex: `.*${_.trim(req.body.name)}.*`, $options: 'i' } },
        //     //     2,
        //     //     1
        //     //   ]
        //     // }
        //   ]
        // }
      }
    }
    // { "$sort": { "criteria": -1 } }
  ])
    .then(cities => {
      let cityIds = []
      cities.map(city => {
        cityIds.push(city._id)
      })
      return Airport.find({
        city_name_geo_name_id: { $in: cityIds }
      })
    })
    .then(airports => {
      res.status(200).send(airports)
    })
    .catch(e => {
      console.log(e)
      res.status(400).send()
    })
})

module.exports = router
