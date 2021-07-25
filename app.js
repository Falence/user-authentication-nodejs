const express = require('express')
const morgan = require('morgan')

const userRoute = require('./routes/userRoutes')
const globalErrorHandler = require('./controllers/errorController')

const app = express()

// GLOBAL MIDDLEWARES

// Development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

// Body parser: Reads the data from the body to req.body
app.use(express.json())



// ROUTES
app.use('/api/users', userRoute)


// UNDEFINED ROUTES HANDLER


// GLOBAL ERROR HANDLER
app.use(globalErrorHandler)


module.exports = app