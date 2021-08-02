const crypto = require('crypto')
const { promisify } = require('util')
const jwt = require('jsonwebtoken')

const User = require('./../models/userModel')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')
const sendEmail = require('./../utils/email')


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

exports.protect = catchAsync(async (req, res, next) => {
    // 1) check if token exist and get it
    let token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access!', 401))
    }

    // 2) verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

    // 3) check if user still exist
    const user = await User.findById(decoded.id)
    if (!user) {
        return next(new AppError('This user no longer exist!', 401))
    }

    // 4) check if user changed password after token was generated
    if (user.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('Password recently changed! Please log in again', 401))
    }

    req.user = user
    next()
})

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError(`This resource is protected! You don't have access permissions!`, 403))
        }

        next()
    }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // get email
    if (!req.body.email) {
        return next(new AppError('Please provide your email', 400))
    }

    // check if user with that email exists
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        return next(new AppError('No user exists with this email!', 401))
    }

    // generate reset token. Encrypt and save in db
    const resetToken = user.createPasswordResetToken()
    await user.save({ validateBeforeSave: false })

    // send paaword reset token to user's email
    const resetUrl = `${req.protocol}://${req.get('host')}/api/users/resetPassword/${resetToken}`
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetUrl}.\nIf you didn't forget your password, please ignore this email.`

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password Reset Link (Expires in 10 Minutes)',
            message
        })

        res.status(200).json({
            status: 'success',
            message: 'Token sent'
        })

    } catch(err) {
        // delete passwordResetToken and passwordResetExpires fields from DB
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        await user.save({ validateBeforeSave: false })

        return next(new AppError('There was an error sending the email. Try again later!', 500))
    }
})

exports.resetPassword = catchAsync(async (req, res, next) => {
    // get user based on token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex')
    
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    })

    // if token has not expired and user still exists, set new password
    if (!user) {
        return next(new AppError('Password reset token is invalid or has expired!', 400))
    }

    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    // Handle changedPasswordAt in the User model

    // log user in
    respondWithToken(res, 200,user)
})

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) get user
    const user = await User.findById(req.user.id).select('+password')

    // 2) check password
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Your current password is wrong!', 401))
    }

    // 3) update password
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    await user.save()

    respondWithToken(res, 200, user)
})