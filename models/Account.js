const mongoose = require('mongoose')

const AccountSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true,
        unique: true
    },
    followers: {
        type: Number,
        required: true
    },
    following: {
        type: Number,
        required: true
    },
    profilePicture: {
        type: String,
        required: true
    },
    accountsOrigin: {
        type: String,
        required: true
    },
    removeItem: {
        type: Boolean,
        default: false
    },
    keepItem: {
        type: Boolean,
        default: false
    },
    imageUrl: {
        type: [String],
        default: null
    },
    date: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
  })

module.exports = mongoose.model('Account', AccountSchema);