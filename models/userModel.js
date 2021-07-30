const crypto = require('crypto')
const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name!']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email address!'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email!']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password!'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password!'],
        validate: {
            validator: function(confirmPassword) {
                return confirmPassword === this.password
            },
            message: 'Passwords are not the same!'
        }
    },
    role: {
        type: String,
        default: 'user'
    },
    changedPasswordAt: Date,
    passwordResetToken: String,
    passwordResetExpires: String
})

// Encrypt password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next()

    this.password = await bcrypt.hash(this.password, 14)
    this.passwordConfirm = undefined
    next()
})


userSchema.methods.correctPassword = async function(candidatePassword, password) {
    return await bcrypt.compare(candidatePassword, password)
}

userSchema.methods.changedPasswordAfter = function(tokenTimeStamp) {
    if (this.changedPasswordAt) {
        const passwordChangeTime = parseInt(this.changedPasswordAt.getTime()) / 1000
        return passwordChangeTime > tokenTimeStamp
    }  
    
    return false
}

userSchema.methods.createPasswordResetToken = function() {
    // create random string
    const resetToken = crypto.randomBytes(32).toString('hex')

    // encrypt token
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')

    console.log({ resetToken }, this.passwordResetToken)

    // password reset expires in
    this.passwordResetExpires = Date.now() + (10 * 6 * 1000) // 10 minutes
    return resetToken
}


const User = mongoose.model('User', userSchema)

module.exports = User