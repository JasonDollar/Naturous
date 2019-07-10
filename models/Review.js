const { Schema, model } = require('mongoose')
// const slugify = require('slugify')
// const validator = require('validator')

const reviewSchema = new Schema ({})

const Review = model('Review', reviewSchema)

module.exports = Review