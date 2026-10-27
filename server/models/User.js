const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'doctor', 'patient']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isConsultant: {
        type: Boolean,
        default: false
    },
    consultantType: {
        type: String,
        default: ''
    },
    specialization: {
        type: String,
        enum: [
            "Consultant Physician / Internal Medicine",
            "Cardiologist",
            "Neurologist",
            "Dermatologist",
            "Endocrinologist",
            "Gastroenterologist",
            "Nephrologist",
            "Pulmonologist / Respiratory Physician",
            "Oncologist",
            "General Surgeon",
            "Orthopaedic Surgeon",
            "ENT Surgeon",
            "Ophthalmologist",
            "Obstetrician & Gynaecologist",
            "Paediatrician",
            "Psychiatrist",
            "Anaesthetist",
            "Radiologist",
            "Urologist",
            "Other"
        ]
    },
    availabilityDay: {
        type: String,
        enum: [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday'
        ]
    },
    availabilityTime: {
        type: String
    },
    weeklyAvailability: [
        new mongoose.Schema(
            {
                day: {
                    type: String,
                    enum: [
                        'Monday',
                        'Tuesday',
                        'Wednesday',
                        'Thursday',
                        'Friday',
                        'Saturday',
                        'Sunday'
                    ],
                    required: true
                },
                time: {
                    type: String,
                    required: true
                }
            },
            { _id: false }
        )
    ]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
