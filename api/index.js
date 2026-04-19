console.log('Starting server...');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const User = require('./models/User');

const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
// Serve static files
app.use(express.static(path.join(__dirname, '../public/html')));
app.use('/css', express.static(path.join(__dirname, '../public/css')));
app.use('/js', express.static(path.join(__dirname, '../public/js')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// --- Routes ---

// Signup
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password, name, phone, provider } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        const newUser = new User({
            email,
            password,
            name,
            phone,
            provider: provider || 'email'
        });

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({ message: 'No account found with this email' });
        }

        if (user.provider === 'google') {
            return res.status(400).json({ message: 'This email is registered via Google. Please use "Continue with Google".' });
        }

        if (user.password !== password) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        res.json({ message: 'Login successful', user });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Register/Login Google User
app.post('/api/auth/google', async (req, res) => {
    try {
        const { email, name } = req.body;
        let user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            user = new User({
                email,
                name,
                provider: 'google'
            });
            await user.save();
        }

        res.json({ message: 'Google login successful', user });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Register/Login Phone User
app.post('/api/auth/phone', async (req, res) => {
    try {
        const { phone, name } = req.body;
        let user = await User.findOne({ phone });

        if (!user) {
            user = new User({
                phone,
                name,
                provider: 'phone'
            });
            await user.save();
        }

        res.json({ message: 'Phone login successful', user });
    } catch (error) {
        console.error('Phone login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
