const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: function() { return this.provider === 'email' || this.provider === 'google'; },
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: function() { return this.provider === 'email'; }
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: function() { return this.provider === 'phone'; }
    },
    provider: {
        type: String,
        enum: ['email', 'google', 'phone'],
        default: 'email'
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);
