// Middleware to protect routes using JWT authentication
// It verifies the token and adds user info to req.user
const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = {
                userId: decoded.userId,
                role: decoded.role
            };

            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin only.' });
    }
};

const patientOnly = (req, res, next) => {
    if (req.user && req.user.role === 'patient') {
        return next();
    }
    res.status(403).json({ message: 'Access denied. Patient only.' });
};

const doctorOnly = (req, res, next) => {
    if (req.user && req.user.role === 'doctor') {
        return next();
    }
    res.status(403).json({ message: 'Access denied. Doctor only.' });
};

module.exports = { protect, adminOnly, patientOnly, doctorOnly };
