const { Schema, model } = require('mongoose')
const Tour = require('./Tour')
// const slugify = require('slugify')
// const validator = require('validator')

const reviewSchema = new Schema ({
  review: {
    type: String,
    required: [true, 'Review cannot be empty!'],
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  tour: {
    type: Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Review must belong to a tour'],
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User',
    required: [true, 'Review must belong to an user'],
  },
})

// each combination of tour and user is unique
reviewSchema.index({ tour: 1, user: 1 }, { unique: true })

reviewSchema.pre(/^find/, function(next) {
  // this.populate({
  //   path: 'user',
  //   select: 'name photo',
  // }).populate({
  //   path: 'tour',
  //   select: 'name duration price',
  // })
  this.populate({
    path: 'user',
    select: 'name photo',
  })
  next()
})

reviewSchema.statics.calcAverageRatings = async function(tourId) {
  // this points to model
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    }, {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ])

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    })
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    })
  }
}

reviewSchema.post('save', function() {
  // this points to doc being saved, this.constructor - points to the model
  this.constructor.calcAverageRatings(this.tour)
})

//findByIdAnd - it uses findOneAnd 
reviewSchema.pre(/^findOneAnd/, async function(next) {
  // saving r variable for next middleware, r has also the whole model access
  this.r = await this.findOne()
  console.log(this.r)
  next()
})

reviewSchema.post(/^findOneAnd/, async function() {
  await this.r.constructor.calcAverageRatings(this.r.tour)
})



const Review = model('Review', reviewSchema)

module.exports = Review