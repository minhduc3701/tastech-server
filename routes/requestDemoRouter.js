/* eslint-disable no-param-reassign */
const express = require('express');
const requestDemoController = require('../controllers/requestDemoController');

function route(requestDemo) {
  const requestDemoRouter = express.Router();
  const controller = requestDemoController(requestDemo);

  requestDemoRouter.route('/')
    .post(controller.post)
    .get(controller.get);

  return requestDemoRouter;
}

module.exports = route;
