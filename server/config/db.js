const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = () => {
    // 1 = connected: reuse existing active connection
    if (mongoose.connection.readyState === 1) {
        cached.conn = mongoose.connection;
        return Promise.resolve(cached.conn);
    }

    // Reuse in-progress connection promise if another request initiated it
    if (cached.promise) {
        return cached.promise;
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        return Promise.reject(new Error('MONGODB_URI environment variable is not defined.'));
    }

    const opts = {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
        socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(uri, opts)
        .then((m) => {
            console.log(`MongoDB Connected: ${m.connection.host}`);
            cached.conn = m.connection;
            cached.promise = null;
            return cached.conn;
        })
        .catch((error) => {
            cached.promise = null;
            cached.conn = null;
            console.error(`MongoDB connection error: ${error.message}`);
            throw error;
        });

    return cached.promise;
};

module.exports = connectDB;
