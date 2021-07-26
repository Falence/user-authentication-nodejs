const express = require('express')
const morgan = require('morgan')

const userRouter = require('./routes/userRoutes')
const globalErrorHandler = require('./controllers/errorController')
const AppError = require('./utils/appError')

const app = express()

// GLOBAL MIDDLEWARES

// Development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

// Body parser: Reads the data from the body to req.body
app.use(express.json())



// ROUTES
app.use('/api/users', userRouter)


// UNDEFINED ROUTES HANDLER
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
})


// GLOBAL ERROR HANDLER
app.use(globalErrorHandler)


module.exports = app