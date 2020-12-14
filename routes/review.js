const express = require('express')
const router = express.Router()
const Review = require('../models/Review')
const ErrorResponse = require('../utils/errorResponse');
const {protect, authorize} = require('../middleware/auth')


// @desc      Get all Review
// @route     GET /api/v1/review
// @access    Public
router.get('/', async (req, res, next) => { 
    try {
        await Review.countDocuments(async function (err, count) {
            if (!err && count === 0) {
                res.status(204).json({
                    success: true,
                    message: "There are no reviews to fetch"
                })
                return
            }
            else{

                // Creating a copy of the req query
                let reqQuery = {...req.query}

                // Fields to exclude from the req query
                const excludeFields = ['select', 'sort']

                // Goes those through every item in the excludeFields and delets the from reqQuery
                excludeFields.forEach(excludeParam => delete reqQuery[excludeParam])

                let queryString = JSON.stringify(reqQuery)
                queryString = queryString.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`)

                // Finding resource
                let fetcheQuerys
                
                // Select Fields
                if (req.query.select) {
                    const fields = req.query.select.split(',').join(' ');
                    fetcheQuerys = await Review.find(JSON.parse(queryString)).select(fields);
                }
                else {
                    fetcheQuerys = await Review.find(JSON.parse(queryString));
                }
                
                res.status(200).json({
                    success: true,
                    fetcheQuerys
                })
                return
            }
        })
    } catch (error) {
        return next(new ErrorResponse(err.message, 400));
    }
})


// @desc      Post a single Review
// @route     POST /api/v1/review
// @access    Private
router.post('/', protect, authorize('admin', 'user'), async (req, res, next) => { 

    try {

        // Adding the user to the request body
        req.body.user = req.user.id
        const data = req.body

        if(req.user.role === 'admin' && Array.isArray(data) && data.length >= 2){
            let rejectedReviews = []
            const newReviews = req.body
            const reviewsWithAllFields = newReviews.filter(function(review){ 
                if(review.product && review.title && review.comment){
                    return review
                }
                else{
                    rejectedReviews.push(review)
                }
            });

            await Review.insertMany(reviewsWithAllFields, function(err, user){
                if(err) return next(err)
                else{
                    res.status(201).json({
                        success: true,
                        message: "Reviews added to the database",
                        "rejected Reviews": rejectedReviews 
                    })
                }
            })
        }
        else{
            await Review.create(req.body, function(err, user){
                if(err) return next(err)
                else{
                    res.status(201).json({
                            success: true,
                            data
                        }
                    )
                }
            });
        }
    } 
    catch (err) {
        return next(new ErrorResponse(err.message, 500));
    }
})


// @desc      Update Review
// @route     PATCH /api/v1/review
// @access    Private
router.patch('/:id', protect, authorize('admin', 'user'), async (req, res, next) => { 

    try {

        await Review.findById({_id: req.params.id}, async function(err, review) {
            if(err) return next(err)
    
            if(!review){
                return next(new ErrorResponse('Review does not exist', 400));
            }
            else{
                const creatorOfTheReview = review.user.toString()

                if(creatorOfTheReview === req.user.id || req.user.role === 'admin'){ 

                    let updatedReview =  req.body

                    // Fields the user is not allowed to changed
                    updatedReview.reviewModified = true
                    delete updatedReview["createdAt"]
                    delete updatedReview["user"]

                    const newUpdatedReview = await Review.findByIdAndUpdate(req.params.id, updatedReview)
                    
                    res.status(201).json({
                        success: true,
                        newUpdatedReview
                    })
                }
                else{
                    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this review`, 404));
                }
            }
        })
        
    } catch (err) {
        return next(new ErrorResponse(err.message, 400));
    }
})


// @desc      Delete Review
// @route     GET /api/v1/review
// @access    Private
router.delete('/:id', protect, authorize('admin', 'user'), async (req, res, next) => {

    try {

        await Review.findById({_id: req.params.id}, async function(err, review) {
            if(err) return next(err)
    
            if(!review){
                return next(new ErrorResponse('Review does not exist', 400));
            }
            else{
                const creatorOfTheReview = review.user.toString()

                if(creatorOfTheReview === req.user.id || req.user.role === 'admin'){ 

                    await Review.findByIdAndDelete(req.params.id)
                    
                    res.status(201).json({
                        success: true,
                        message: "Review deleted"
                    })
                }
                else{
                    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this review`, 404));
                }
            }
        })
        
    } catch (err) {
        return next(new ErrorResponse(err.message, 400));
    }

})


// @desc      Delete all Review
// @route     GET /api/v1/review
// @access    Private
router.delete('/', protect, authorize('admin'), async (req, res, next) => {

    try {

        // Deleting all removed accounts = { removeItem : true }

        await Review.deleteMany(req.query);

        res.status(200).json({
            success: true,
            message: "Reviews removed"
        })

        return
        
    } catch (err) {
        return next(new ErrorResponse(err.message, 400));
    }

})


// @desc      Get a single Review
// @route     GET /api/v1/review
// @access    Public
router.get('/:id', async (req, res, next) => { 
    
    try {

        await Review.findById({_id: req.params.id}, async function(err, review) {
            if(err) return next(err)
    
            if(!review){
                return next(new ErrorResponse('Review does not exist', 400));
            }
            else{
                res.status(200).json({
                    success: true,
                    review
                })
            }
        })
    } 
    catch (err) {
        return next(new ErrorResponse(err.message, 400));
    }

})


module.exports = router;