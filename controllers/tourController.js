const Tour = require('../models/Tour')
const catchAsync = require('../utils/catchAsync')
// const AppError = require('../utils/appError')
const factory = require('./handlerFactory')

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = 5
  req.query.sort = '-ratingsAverage,price'
  req.query.fields = 'name,price,ratingsAverage,summary,diffculty'
  next()
}



exports.getAllTours = factory.getAll(Tour)

exports.getTour = factory.getOne(Tour, { path: 'reviews'  })

exports.createTour = factory.createOne(Tour)

exports.updateTour = factory.updateOne(Tour)

exports.deleteTour = factory.deleteOne(Tour)


exports.getTourStats = catchAsync(async (req, res, next) => {

  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 }},
    },
    {
      $group: {
        _id:  { $toUpper: '$difficulty' }, // wartosci difficulty stana sie id i powstana tu 3 grupy o id: easy, medium i difficult
        numTours: { $sum: 1 }, // 1 oznacza ze sumujemy ilosc dokumentow a nie ich poszczegolne pola
        numRatings: {$sum: '$ratingsQuantity' },
        averageRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 }, // 1 -> ascending
    },
  ])

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  })

})

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {

  const year = req.params.year * 1

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates'},
        numTourStart: { $sum: 1},
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStart: -1 },
    },
    // {
    //   $limit: 6,
    // },
  ])

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  })
})