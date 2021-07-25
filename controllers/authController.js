const jwt = require('jsonwebtoken')
const User = require('./../models/userModel')
const catchAsync = require('./../utils/catchAsync')


const generateToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}

exports.signup = catchAsync(async (req, res, next) => {
    const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
    })

    const token = generateToken(user._id)
    user.password = undefined

    res.status(200).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
})

exports.login = (req, res, next) => {}

exports.protect = (req, res, next) => {}

exports.restrictTo = (req, res, next) => {}

exports.forgotPassword = (req, res, next) => {}

exports.resetPassword = (req, res, next) => {}

exports.updatePassword = (req, res, next) => {}