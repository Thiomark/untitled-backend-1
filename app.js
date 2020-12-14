const express = require('express')
const dotenv = require('dotenv')
const cookieParser = require('cookie-parser')
const connectDB = require('./config/db')
const cors = require('cors')
const errorHandler = require('./middleware/error')


dotenv.config({"path": "./config/config.env"})

connectDB()

const app = express()

app.use(cors())

// Express middleware
app.use(express.json())

// Cookie parser
app.use(cookieParser());

app.use('/api/v1/accounts', require('./routes/account'))
app.use('/api/v1/user', require('./routes/auth'))
app.use('/api/v1/reviews', require('./routes/review'))
app.all('*', (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Can't find ${req.originalUrl} on the server`
    })
})

// Error handhler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 6666

app.listen(PORT, () => {
    console.log(`Server started...`)
})