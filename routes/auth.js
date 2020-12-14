const express = require('express')
const User = require('../models/User')
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const ErrorResponse = require('../utils/errorResponse');
const {protect} = require('../middleware/auth')

router.post('/register', async (req, res, next) => { 

    const {name, email, password} = req.body;
    
    if(!name || !email || !password){
        return next(new ErrorResponse('Please provide all fields', 400));
    }

    User.create(req.body, function(err, user){
        if(err){
            next(err)
            return
        }
        else{
            sendTokenResponse(user, 201, res)
        }
    }) 
})

router.post('/login', async (req, res, next) => { 

    const {email, password} = req.body;

    // Validate the email and the password
    
    if(!email || !password){
        return next(new ErrorResponse('Please provide an email and the password', 400));
    }

    await User.findOne({email}, async function(err, user) {
        if(err) throw err

        if(!user){
            return next(new ErrorResponse('Invalid credentials', 401));
        }
        else{

            const passwordFromDB = user.password
            const checkForMatch = await bcrypt.compare(password, passwordFromDB);

            if(!checkForMatch){
                return next(new ErrorResponse('Invalid credentials', 401));
            }
            else {
                sendTokenResponse(user, 201, res)
            }
        }
    });
})

router.get('/me', protect, async (req, res, next) => { 

    try {
        let user = await User.findById(req.user.id);
        user.password = "******"

        res.status(200).json({
            success: true,
            data: user
        })
    } catch (error) {
        return next(new ErrorResponse(error.message, 400));
    }

    

})

// Get token from model, create cookie and send response
function sendTokenResponse(user, statusCode, res){

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
  
    const options = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };
  
    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }
  
    res
      .status(statusCode)
      .cookie('token', token, options)
      .json({
        success: true,
        token
      });
  };
  

module.exports = router;
