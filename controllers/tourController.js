const Tour = require('../models/Tour')
const APIFeatures = require('../utils/APIFeatures')

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = 5
  req.query.sort = '-ratingsAverage,price'
  req.query.fields = 'name,price,ratingsAverage,summary,diffculty'
  next()
}



exports.getAllTours = async (req, res) => {
  try {
    const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().paginate()

    const tours = await features.query

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours,
      },
    })
  } catch(e) {
    return res.status(404).json({
      status: 'error',
      message: e.message,
    })
  }
}

exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id)
    if (!tour) {
      return res.status(404).json({
        status: 'fail',
        message: 'Invalid ID',
      })
    }
  
    res.status(200).json({
      status: 'success',
      // results: tours.length,
      data: {
        tour,
      },
    })

  } catch(e) {
    return res.status(404).json({
      status: 'error',
      message: e.message,
    })
  }
}

exports.createTour = async (req, res) => {
  // const {name, price, rating, difficulty} = req.body
  try {
    const newTour = await Tour.create(req.body)

  // const saved = await newTour.save()
    return res.status(201).json({
      status: 'success',
      // results: tours.length,
      data: {
        tour: newTour,
      },
    })
  } catch(e) {
    return res.status(400).json({
      status: 'error',
      message: e.message,
    })
  }
}

exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      // new zwroci udated document
    })
    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    })
  } catch (e) {

    res.status(404).json({
      status: 'error',
      message: e.message,
    })
  }
  // const tour = tours.find(item => item.id === req.params.id)
  // const newTour = { ...tour, ...req.body }
  // console.log(newTour.duration)
  
}

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id)
    res.status(204).json({
      status: 'success',
      data: null,
    })
  } catch (e) {

    res.status(404).json({
      status: 'error',
      message: e.message,
    })
  }
}


exports.getTourStats = async (req, res) => {
  try {
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
  } catch(e) {
    res.status(404).json({
      status: 'error',
      message: e.message,
    })
  }
}

exports.getMonthlyPlan = async (req, res) => {
  try {
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
  } catch (e) {
    res.status(404).json({
      status: 'error',
      message: e.message,
    })
  }
}