require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const createAdmin = async () => {
    try {
        const { INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD, MONGODB_URI } = process.env;

        if (!INITIAL_ADMIN_NAME || !INITIAL_ADMIN_EMAIL || !INITIAL_ADMIN_PASSWORD) {
            console.error('Error: INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL, and INITIAL_ADMIN_PASSWORD must be configured in .env');
            process.exit(1);
        }

        await mongoose.connect(MONGODB_URI);

        const existingAdmin = await User.findOne({ userId: 'A001' });
        if (existingAdmin) {
            console.log('Admin account (A001) already exists.');
            process.exit(0);
        }

        const existingEmail = await User.findOne({ email: INITIAL_ADMIN_EMAIL });
        if (existingEmail) {
            console.error('Error: Email is already associated with another account.');
            process.exit(1);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(INITIAL_ADMIN_PASSWORD, salt);

        const adminUser = new User({
            userId: 'A001',
            name: INITIAL_ADMIN_NAME,
            email: INITIAL_ADMIN_EMAIL,
            password: hashedPassword,
            role: 'admin'
        });

        await adminUser.save();
        console.log('Successfully created initial Admin account (A001).');
        process.exit(0);

    } catch (error) {
        console.error('Error creating admin:', error.message);
        process.exit(1);
    }
};

createAdmin();
