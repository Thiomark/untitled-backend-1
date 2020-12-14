const mongoose = require('mongoose')

const ReviewSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    // product: {
    //     type: mongoose.Schema.ObjectId,
    //     ref: 'product',
    //     required: true
    // },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: [true, 'Please add a rating between 1 and 5']
    },
    title: {
        type: String,
        trim: true,
        required: [true, 'Please add a title for the review'],
        maxlength: 100
    },
    comment: {
        type: String,
        required: [true, 'Please add the comment']
    },
    profilePicture: {
        type: String,
        default: "no-photo.jpg"
    },
    reviewModified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Review', ReviewSchema);