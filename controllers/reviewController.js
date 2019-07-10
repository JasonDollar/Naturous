const Review = require('../models/Review')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')

exports.getAllReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find()

  res.status(200).json({
    status: 'success',
    data: {
      reviews,
    },
  })
})

exports.createReview = catchAsync(async (req, res, next) => {
  console.log(req.user)

  const newReview = await Review.create({ ...req.body, user: req.user._id })

  res.status(201).json({
    status: 'success',
    data: {
      review: newReview,
    },
  })
})