const express = require('express')
const reviewController = require('../controllers/reviewController')
const authController = require('../controllers/authController')

// mergeParams has access to params from other routers
const router = express.Router({ mergeParams: true })

router.route('/')
  .get(reviewController.getAllReviews)
  .post(authController.protect,authController.restrictTo('user'), reviewController.createReview)

module.exports = router