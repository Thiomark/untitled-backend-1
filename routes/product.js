const express = require('express')
const router = express.Router()
const Product = require('../models/Product')
const ErrorResponse = require('../utils/errorResponse');
const {protect, authorize} = require('../middleware/auth')


// @desc      Get all Product
// @route     GET /api/v1/product
// @access    Public
router.get('/', async (req, res, next) => { 
    try {
        await Product.countDocuments(async function (err, count) {
            if (!err && count === 0) {
                res.status(204).json({
                    success: true,
                    message: "There are no products to fetch"
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
                    fetcheQuerys = await Product.find(JSON.parse(queryString)).select(fields);
                }
                else {
                    fetcheQuerys = await Product.find(JSON.parse(queryString));
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


// @desc      Post Many Products
// @route     GET /api/v1/product/productseeder
// @access    Private
router.post('/productseeder', protect, authorize('admin'), async (req, res, next) => { 

    try {

        // Filtering items without all fields

        let rejectedProducts = []
        const newProducts = req.body
        const productsWithAllFields = newProducts.filter(function(product){ 
            if(product.name && product.description && product.productCost && product.photo && product.imageUrl && product.category){
                rejectedProducts.push(product)
                return product
            }
        });

        await Product.insertMany(productsWithAllFields, function(err, user){
            if(err) return next(err)
            else{
                res.status(201).json({
                        success: true,
                        message: "Products added to the database",
                        "rejected Products": rejectedProducts
                    }
                )
            }
        })
    } 
    catch (err) {
        return next(new ErrorResponse(err.message, 500));
    }
})


// @desc      Update Product
// @route     GET /api/v1/product
// @access    Private
router.patch('/:id', protect, authorize('admin'), async (req, res, next) => { 

    try {
        await Product.findById({_id: req.params.id}, async function(err, product) {
            if(err) return next(err)
    
            if(!product){
                return next(new ErrorResponse('Product does not exist', 400));
            }
            else{
                res.status(201).json({
                    success: true,
                    data: "Product updated"
                })
            }
        });
        
    } 
    catch (err) {
        return next(new ErrorResponse(err.message, 400));
    }
})


// @desc      Delete Product
// @route     GET /api/v1/product
// @access    Private
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {

    try {

        await Product.findByIdAndDelete({_id: req.params.id}, async function(err, product) {
            if(err) return next(err)
    
            if(!product){
                return next(new ErrorResponse('Product does not exist', 400));
            }
            else{
                res.status(200).json({
                    success: true,
                    data: "Product deleted"
                })
            }
        })

        return
        
    } catch (err) {
        return next(new ErrorResponse(err.message, 400));
    }

})


// @desc      Delete all Product
// @route     GET /api/v1/product
// @access    Private
router.delete('/', protect, authorize('admin'), async (req, res, next) => {

    try {

        // Deleting all removed accounts = { removeItem : true }

        await Product.deleteMany(req.query);

        res.status(200).json({
            success: true,
            message: "Products removed"
        })

        return
        
    } catch (err) {
        return next(new ErrorResponse(err.message, 400));
    }

})


// @desc      Get a single Product
// @route     GET /api/v1/product
// @access    Public
router.get('/:id', async (req, res, next) => { 
    
    try {

        await Product.findById({_id: req.params.id}, async function(err, product) {
            if(err) return next(err)
    
            if(!product){
                return next(new ErrorResponse('Product does not exist', 400));
            }
            else{
                res.status(200).json({
                    success: true,
                    product
                })
            }
        })
    } 
    catch (err) {
        return next(new ErrorResponse(err.message, 400));
    }

})


module.exports = router;