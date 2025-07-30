// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({

    fullname: {
        type: String,
        trim: true,
        default: ""
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },

    password: {
        type: String,
        required: true,
    },

    phone: {
        type: String,
        // required: true,
    },

    role: {
        type: String,
        enum: ['vendor', 'supplier'],
        required: true,
    },

    // Onboarding fields
    businessName: {
        type: String,
        trim: true,
        default: ""
    },

    businessType: {
        type: String,
        trim: true,
        default: ""
    },

    businessAddress: {
        type: String,
        trim: true,
        default: ""
    },

    city: {
        type: String,
        trim: true,
        default: ""
    },

    state: {
        type: String,
        trim: true,
        default: ""
    },

    pincode: {
        type: String,
        trim: true,
        default: ""
    },

    // Location fields
    latitude: {
        type: Number,
        default: null
    },

    longitude: {
        type: Number,
        default: null
    },

    locationPermission: {
        type: String,
        enum: ['granted', 'denied', 'prompt'],
        default: 'prompt'
    },

    onboardingCompleted: {
        type: Boolean,
        default: false
    },

    onboardingDate: {
        type: Date
    },

    createdAt: {
        type: Date,
        default: Date.now,
    }

});

// Pre-save hook to hash passwords
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Pre-save hook to normalize role spelling (for backward compatibility)
userSchema.pre('save', function (next) {
    if (this.role === 'vender') {
        this.role = 'vendor';
    }
    next();
});

// Password comparison method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};
const User = mongoose.model('User', userSchema);
module.exports = User
