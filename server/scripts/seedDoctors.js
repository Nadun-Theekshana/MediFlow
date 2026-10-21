require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');

const doctorsData = [
  // Consultant Physician / Internal Medicine
  { userId: 'D002', name: 'Dr. Nimal Perera', email: 'doctor002@mediflow.test', specialization: 'Consultant Physician / Internal Medicine' },
  { userId: 'D003', name: 'Dr. Kavindi Silva', email: 'doctor003@mediflow.test', specialization: 'Consultant Physician / Internal Medicine' },
  // Cardiologist
  { userId: 'D004', name: 'Dr. Ashen Fernando', email: 'doctor004@mediflow.test', specialization: 'Cardiologist' },
  { userId: 'D005', name: 'Dr. Dinithi Jayasinghe', email: 'doctor005@mediflow.test', specialization: 'Cardiologist' },
  // Neurologist
  { userId: 'D006', name: 'Dr. Ravindu Senanayake', email: 'doctor006@mediflow.test', specialization: 'Neurologist' },
  { userId: 'D007', name: 'Dr. Tharushi Wijesinghe', email: 'doctor007@mediflow.test', specialization: 'Neurologist' },
  // Dermatologist
  { userId: 'D008', name: 'Dr. Sachin Gunawardena', email: 'doctor008@mediflow.test', specialization: 'Dermatologist' },
  { userId: 'D009', name: 'Dr. Himashi Rodrigo', email: 'doctor009@mediflow.test', specialization: 'Dermatologist' },
  // Endocrinologist
  { userId: 'D010', name: 'Dr. Malith Abeysekara', email: 'doctor010@mediflow.test', specialization: 'Endocrinologist' },
  { userId: 'D011', name: 'Dr. Piumi Karunaratne', email: 'doctor011@mediflow.test', specialization: 'Endocrinologist' },
  // Gastroenterologist
  { userId: 'D012', name: 'Dr. Kavin Bandara', email: 'doctor012@mediflow.test', specialization: 'Gastroenterologist' },
  { userId: 'D013', name: 'Dr. Nethmi Samarasinghe', email: 'doctor013@mediflow.test', specialization: 'Gastroenterologist' },
  // Nephrologist
  { userId: 'D014', name: 'Dr. Dilan Wickramasinghe', email: 'doctor014@mediflow.test', specialization: 'Nephrologist' },
  { userId: 'D015', name: 'Dr. Sachini Ranasinghe', email: 'doctor015@mediflow.test', specialization: 'Nephrologist' },
  // Pulmonologist / Respiratory Physician
  { userId: 'D016', name: 'Dr. Chamod Dias', email: 'doctor016@mediflow.test', specialization: 'Pulmonologist / Respiratory Physician' },
  { userId: 'D017', name: 'Dr. Isuri Mendis', email: 'doctor017@mediflow.test', specialization: 'Pulmonologist / Respiratory Physician' },
  // Oncologist
  { userId: 'D018', name: 'Dr. Pasindu Ekanayake', email: 'doctor018@mediflow.test', specialization: 'Oncologist' },
  { userId: 'D019', name: 'Dr. Shenali de Silva', email: 'doctor019@mediflow.test', specialization: 'Oncologist' },
  // General Surgeon
  { userId: 'D020', name: 'Dr. Akila Rathnayake', email: 'doctor020@mediflow.test', specialization: 'General Surgeon' },
  { userId: 'D021', name: 'Dr. Madushi Peiris', email: 'doctor021@mediflow.test', specialization: 'General Surgeon' },
  // Orthopaedic Surgeon
  { userId: 'D022', name: 'Dr. Lahiru Jayawardena', email: 'doctor022@mediflow.test', specialization: 'Orthopaedic Surgeon' },
  { userId: 'D023', name: 'Dr. Thejani Herath', email: 'doctor023@mediflow.test', specialization: 'Orthopaedic Surgeon' },
  // ENT Surgeon
  { userId: 'D024', name: 'Dr. Harith Alwis', email: 'doctor024@mediflow.test', specialization: 'ENT Surgeon' },
  { userId: 'D025', name: 'Dr. Dulani Perera', email: 'doctor025@mediflow.test', specialization: 'ENT Surgeon' },
  // Ophthalmologist
  { userId: 'D026', name: 'Dr. Kasun Samarawickrama', email: 'doctor026@mediflow.test', specialization: 'Ophthalmologist' },
  { userId: 'D027', name: 'Dr. Oshadi Fernando', email: 'doctor027@mediflow.test', specialization: 'Ophthalmologist' },
  // Obstetrician & Gynaecologist
  { userId: 'D028', name: 'Dr. Thilina Rajapaksha', email: 'doctor028@mediflow.test', specialization: 'Obstetrician & Gynaecologist' },
  { userId: 'D029', name: 'Dr. Amaya Gunasekara', email: 'doctor029@mediflow.test', specialization: 'Obstetrician & Gynaecologist' },
  // Paediatrician
  { userId: 'D030', name: 'Dr. Minura Pathirana', email: 'doctor030@mediflow.test', specialization: 'Paediatrician' },
  { userId: 'D031', name: 'Dr. Kaushalya Silva', email: 'doctor031@mediflow.test', specialization: 'Paediatrician' },
  // Psychiatrist
  { userId: 'D032', name: 'Dr. Sandun Weerasinghe', email: 'doctor032@mediflow.test', specialization: 'Psychiatrist' },
  { userId: 'D033', name: 'Dr. Iresha Jayawardena', email: 'doctor033@mediflow.test', specialization: 'Psychiatrist' },
  // Anaesthetist
  { userId: 'D034', name: 'Dr. Naveen Karunaratne', email: 'doctor034@mediflow.test', specialization: 'Anaesthetist' },
  { userId: 'D035', name: 'Dr. Hansani Perera', email: 'doctor035@mediflow.test', specialization: 'Anaesthetist' },
  // Radiologist
  { userId: 'D036', name: 'Dr. Rukshan Fernando', email: 'doctor036@mediflow.test', specialization: 'Radiologist' },
  { userId: 'D037', name: 'Dr. Methmi Bandara', email: 'doctor037@mediflow.test', specialization: 'Radiologist' },
  // Urologist
  { userId: 'D038', name: 'Dr. Yasith Senanayake', email: 'doctor038@mediflow.test', specialization: 'Urologist' },
  { userId: 'D039', name: 'Dr. Dinuli Wickramasinghe', email: 'doctor039@mediflow.test', specialization: 'Urologist' }
];

const seedDoctors = async () => {
  try {
    await connectDB();

    // Verify D001 status
    const existingD001 = await User.findOne({ userId: 'D001' });
    if (existingD001) {
      console.log('D001 detected: Yes (Preserved unchanged)');
    } else {
      console.log('D001 detected: No');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('1234', salt);

    let inserted = 0;
    let skipped = 0;
    let failed = 0;

    for (const doc of doctorsData) {
      // Duplicate protection: Never touch D001
      if (doc.userId === 'D001') {
        skipped++;
        continue;
      }

      // Check whether userId or email already exists
      const existingDoc = await User.findOne({
        $or: [{ userId: doc.userId }, { email: doc.email }]
      });

      if (existingDoc) {
        skipped++;
        continue;
      }

      try {
        const newDoctor = new User({
          userId: doc.userId,
          name: doc.name,
          email: doc.email,
          password: hashedPassword,
          role: 'doctor',
          specialization: doc.specialization,
          isActive: true
        });

        await newDoctor.save();
        inserted++;
      } catch (err) {
        failed++;
      }
    }

    console.log('\nSeed completed.');
    console.log(`\nInserted: ${inserted}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Failed: ${failed}`);
    console.log('\nDemo Doctor password: 1234\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed execution error:', error.message);
    process.exit(1);
  }
};

seedDoctors();
