const express = require('express');
const { loginUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/login', loginUser);

router.get('/protected', protect, (req, res) => {
    res.status(200).json({
        message: 'Protected route accessed successfully',
        user: req.user
    });
});

module.exports = router;
