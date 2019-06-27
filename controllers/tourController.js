const Tour = require('../models/Tour')

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// )



exports.getAllTours = async (req, res) => {
  const tours = await Tour.find()
  res.status(200).json({
    status: 'success',
    requestedAt: req.time,
    results: tours.length,
    data: {
      tours
    }
  })
}

exports.getTour = async (req, res) => {
  const tour = await Tour.findById(req.params.id)
  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID'
    })
  }

  res.status(200).json({
    status: 'success',
    // results: tours.length,
    data: {
      tour
    }
  })
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
        tour: newTour
      }
    })
  } catch(e) {
    return res.status(400).json({
      status: 'error',
      message: e.message
    })
  }
}

exports.updateTour = (req, res) => {
  // const tour = tours.find(item => item.id === req.params.id)
  // const newTour = { ...tour, ...req.body }
  // console.log(newTour.duration)
  // res.status(200).json({
  //   status: 'success',
  //   data: {
  //     tour: newTour
  //   }
  // })
  res.status(404).json()
}

exports.deleteTour = (req, res) => {
  console.log(req)

  res.status(204).json({
    status: 'success',
    data: null
  })
}
