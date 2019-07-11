const Tour = require('../models/Tour')
const APIFeatures = require('../utils/APIFeatures')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const factory = require('./handlerFactory')

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = 5
  req.query.sort = '-ratingsAverage,price'
  req.query.fields = 'name,price,ratingsAverage,summary,diffculty'
  next()
}



exports.getAllTours = catchAsync(async (req, res, next) => {

  const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().paginate()

  const tours = await features.query

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  })

})

exports.getTour = catchAsync(async (req, res, next) => {

  const tour = await Tour.findById(req.params.id).populate('reviews')
  if (!tour) {
    return next(new AppError('No tour found with that ID', 404))
  }

  res.status(200).json({
    status: 'success',
    // results: tours.length,
    data: {
      tour,
    },
  })
})


exports.createTour = catchAsync(async (req, res, next) => {
  // const {name, price, rating, difficulty} = req.body
  const newTour = await Tour.create(req.body)
  res.status(201).json({
    status: 'success',
    // results: tours.length,
    data: {
      tour: newTour,
    },
  })
})

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    // new zwroci udated document
  })
  if (!tour) {
    return next(new AppError('No tour found with that ID', 404))
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  })

  
})

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id)

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404))
//   }

//   res.status(204).json({
//     status: 'success',
//     data: null,
//   })

// })
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