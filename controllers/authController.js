const jwt = require('jsonwebtoken')
const User = require('./../models/userModel')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')


const generateToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}

const respondWithToken = (res, statusCode, user) => {
    const token = generateToken(user._id)
    user.password = undefined

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
}
 
exports.signup = catchAsync(async (req, res, next) => {
    const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
    })
    
    respondWithToken(res, 201,user)
})

exports.login = catchAsync(async (req, res, next) => {
    // 1) check if email and password are provided
    const { email, password } = req.body
    if (!email || !password) {
        return next(new AppError('Provide your email and password!', 400))
    }

    // 2) check if user exist and password is correct
    const user = await User.findOne({ email }).select('+password')
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password!', 401))
    }

    // 3) generate token and respond
    respondWithToken(res, 201,user)
})

exports.protect = (req, res, next) => {}

exports.restrictTo = (req, res, next) => {}

exports.forgotPassword = (req, res, next) => {}

exports.resetPassword = (req, res, next) => {}

exports.updatePassword = (req, res, next) => {}