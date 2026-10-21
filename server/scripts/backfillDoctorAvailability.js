// server/scripts/backfillDoctorAvailability.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const AVAILABILITY_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

const AVAILABILITY_TIMES = [
  '09:00',
  '10:30',
  '13:30',
  '15:00'
];

function calculateDoctorSchedule(userId) {
  const number = parseInt(String(userId).replace(/\D/g, ''), 10) || 1;
  const dayIndex = (number - 1) % AVAILABILITY_DAYS.length;
  const timeIndex = Math.floor((number - 1) / AVAILABILITY_DAYS.length) % AVAILABILITY_TIMES.length;
  return {
    availabilityDay: AVAILABILITY_DAYS[dayIndex],
    availabilityTime: AVAILABILITY_TIMES[timeIndex]
  };
}

const backfillDoctorAvailability = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('Error: MONGODB_URI not found in environment');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for Doctor availability backfill.');

    const doctors = await User.find({ role: 'doctor' });
    console.log(`Found ${doctors.length} doctors.`);

    let updatedCount = 0;
    for (const doc of doctors) {
      if (!doc.availabilityDay || !doc.availabilityTime) {
        const schedule = calculateDoctorSchedule(doc.userId);
        await User.collection.updateOne(
          { _id: doc._id },
          {
            $set: {
              availabilityDay: schedule.availabilityDay,
              availabilityTime: schedule.availabilityTime
            }
          }
        );
        console.log(`Assigned ${doc.userId} (${doc.name}) -> ${schedule.availabilityDay} at ${schedule.availabilityTime}`);
        updatedCount++;
      } else {
        console.log(`${doc.userId} already has availability: ${doc.availabilityDay} ${doc.availabilityTime}`);
      }
    }

    console.log(`Backfill complete. Total updated: ${updatedCount}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Backfill error:', error.message);
    process.exit(1);
  }
};

backfillDoctorAvailability();
