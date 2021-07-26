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
    }
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

const User = mongoose.model('User', userSchema)

module.exports = User