const express = require('express')
const router = express.Router()
const Account = require('../models/Account')
const ErrorResponse = require('../utils/errorResponse');
const {protect, authorize} = require('../middleware/auth')

// Get All Accounts before the modification
router.get('/', protect, async (req, res, next) => { 

    try {
        await Account.countDocuments(async function (err, count) {
            if (!err && count === 0) {
                res.status(204).json({
                    success: true,
                    message: "There are no accounts to fetch"
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
                    fetcheQuerys = await Account.find(JSON.parse(queryString)).select(fields);
                }
                else {
                    fetcheQuerys = await Account.find(JSON.parse(queryString));
                }
                
                res.status(200).json({
                    success: true,
                    fetcheQuerys
                })
                return
            }
        })
    } catch (error) {
        res.status(400).json(
            {
                message: "Error when fetching all accounts accounts",
                errorMessage: error
            }
        )
    }
})


// Post All Accounts before the modification
router.post('/', async (req, res) => { 

    try {

        let arrayOFUsernames = []
        const newAccounts = req.body
        const accountsWithEverything = newAccounts.filter(function(account){ 
            if(account.username && account.followers && account.following && account.profilePicture && account.imageUrl && account.date){
                arrayOFUsernames.push(account.username)
                return account
            }
        });
        const accounts = await Account.find({'username': { $in: arrayOFUsernames}}, function(err, docs){
            if(err){
                res.status(400).json({
                        success: false,
                        message: err
                    }
                )
            }
        });

        const accountsNames = accounts.map(function(account){
            return account.username
        })

        let accountsToBeUploaded = accountsWithEverything.filter(function(account){
            if(!accountsNames.includes(account.username)){
                return account
            }
        })

        accountsToBeUploaded = accountsToBeUploaded.map(function(account){
            account.followers = account.followers.toString().replace(/[.,\s]/g, '')
            account.followers = parseInt(account.followers, 10)
            account.following = account.following.toString().replace(/[.,\s]/g, '')
            account.following = parseInt(account.following, 10)
            return account
        })
        
        await Account.insertMany(accountsToBeUploaded)
  
        res.status(201).json(
            {
                success: true,
                message: "Many records added to the database"
            }
        )

    } 
    catch (error) {
 
        res.status(400).json(
            {
                message: "Error when uploading many accounts",
                error
            }
        )
    }
})


// Updating an account
router.patch('/:id', async (req, res) => { 

    const removeAccount = await Account.findById({_id: req.params.id})

    if(removeAccount.removeItem){

        await Account.findByIdAndDelete({_id: req.params.id})

        res.status(200).json({
            success: true,
            data: "Account Deleted"
        })
        return
    }
    
    try {
        await Account.findByIdAndUpdate(
            req.params.id, 
            req.body
        )
        
        res.status(201).json({
            success: true,
            data: "Account updated"
        })
        
    } 
    catch (error) {
     
        res.status(400).json(
            {
                message: "Error when updating an account",
                error
            }
        )
    }
})


// Get an array of names of kept accounts
router.get('/keepAccounts/names', async (req, res) => {

    try {
        
        const allKeptAccounts = await Account.find({
            keepItem: {
                $in: true
            }
        })

        const names = allKeptAccounts.map(function(account){
            return account.username
        })

        res.status(200).json(names)

        return
        
    } catch (error) {
        res.status(400).json(
            {
                message: "Error when fetching names kept accounts",
                errorMessage: error
            }
        )
    }

})


// Deleting all kept accounts 
router.delete('/oldRecords', async (req, res) => {

    try {

        const allOldRecords = await Account.find({ createdAt : {"$lt" : new Date(Date.now() - 7*24*60*60 * 1000) } })
        if(allOldRecords.length > 0){

            await Account.deleteMany( { createdAt : {"$lt" : new Date(Date.now() - 3*24*60*60 * 1000) } })

            res.status(200).json({
                success: true,
                message: "All old accounts are removed"
            })
        }
        else{
            res.status(200).json({
                success: true,
                message: "There are no old accounts"
            })
        }

        
        return
        
    } catch (error) {
        res.status(400).json(
            {
                message: "Error when removing all kept accounts",
                errorMessage: error
            }
        )
    }

})


// Delete a single account
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {

    try {

        await Account.findByIdAndDelete({_id: req.params.id})

        res.status(200).json({
            success: true,
            message: "Account removed"
        })

        return
        
    } catch (error) {
        return next(new ErrorResponse(error.message, 400));
    }

})


// Deleting all accounts 
router.delete('/', async (req, res) => {

    try {

        // Deleting all removed accounts = { removeItem : true }

        await Account.deleteMany(req.query);

        res.status(200).json({
            success: true,
            message: "All removed accounts are removed"
        })

        return
        
    } catch (error) {
        res.status(400).json(
            {
                message: "Error when removing all removed accounts",
                errorMessage: error
            }
        )
    }

})


// Getting a sinle account
router.get('/:id', async (req, res) => { 
    
    try {

        const singleAccount = await Account.findById({_id: req.params.id})
        
        res.status(200).json({
            success: true,
            singleAccount
        })
        
    } 
    catch (error) {
     
        res.status(400).json(
            {
                message: "Failed to get a single account",
                error
            }
        )
    }

})

module.exports = router;