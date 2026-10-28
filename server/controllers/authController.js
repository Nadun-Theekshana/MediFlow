// Controller for authentication actions
// Handles user login and JWT token generation
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const loginUser = async (req, res) => {
  console.log('Login request body:', req.body);
    try {
        const { userId, password } = req.body;

        if (!userId || !password) {
            return res.status(400).json({ message: 'userId and password are required.' });
        }

        // Find user in DB
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(401).json({ message: 'Invalid userId or password.' });
        }

        // Check if account is active (undefined or true means active)
        if (user.isActive === false) {
            return res
                .status(403)
                .json({ message: 'This account is inactive. Please contact the administrator.' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid userId or password.' });
        }

        const token = jwt.sign(
            { userId: user.userId, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    loginUser
};
