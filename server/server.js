// Load environment variables from .env file
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to ensure MongoDB connection before handling routes
// Ensure DB connection before handling routes
const ensureDbConnected = async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error('Database connection error during request:', error.message);
        return res.status(503).json({
            message: 'Service unavailable. Database connection failed.'
        });
    }
};

app.use(cors());
app.use(express.json({ strict: false }));

app.use('/api/users', ensureDbConnected, userRoutes);
app.use('/api/auth', ensureDbConnected, authRoutes);
app.use('/api/appointments', ensureDbConnected, appointmentRoutes);
app.use('/api/prescriptions', ensureDbConnected, prescriptionRoutes);
app.get('/api/test', (req, res) => {
    res.json({ message: 'MediFlow backend is running successfully.' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
