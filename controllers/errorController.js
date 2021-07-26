const AppError = require('./../utils/appError')

const handleDuplicateFieldDB = err => {
    return new AppError(`${err.keyValue.email} has already been taken. Use a different one!`, 400)
}

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message)
    const message = `Invalid data input: ${errors.join(' ')}`
    return new AppError(message, 400)
}

const handleJWTError = () => new AppError('Invalid token!', 401)
const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again!', 401)


const sendDevError = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    })
}

const sendProdError = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        })
    } else {
        console.log(`ERROR: ${err}`) 

        res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        })
    }
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500
    err.status = err.status || 'error'

    if (process.env.NODE_ENV === 'development') {
        sendDevError(err, res)
    } else if (process.env.NODE_ENV === 'production') {
        if (err.code === 11000) err = handleDuplicateFieldDB(err)
        if (err.name === 'ValidationError') err = handleValidationErrorDB(err)
        if (err.name === 'JsonWebTokenError') err = handleJWTError()
        if (err.name === 'TokenExpiredError') err = handleJWTExpiredError()
        sendProdError(err, res)
    }
}