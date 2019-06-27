const Tour = require('../models/Tour')

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// )



exports.getAllTours = async (req, res) => {
  try {
    const tours = await Tour.find()
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours
      }
    })
  } catch(e) {
    return res.status(404).json({
      status: 'error',
      message: e.message
    })
  }
}

exports.getTour = async (req, res) => {
  try {
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

  } catch(e) {
    return res.status(404).json({
      status: 'error',
      message: e.message
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

exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
      // new zwroci udated document
    })
    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    })
  } catch (e) {

    res.status(404).json({
      status: 'error',
      message: e.message
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
      data: null
    })
  } catch (e) {

    res.status(404).json({
      status: 'error',
      message: e.message
    })
  }
}
