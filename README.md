# MediFlow – Hospital Patient Management & Appointment System

MediFlow is a web-based Hospital Patient Management and Appointment System developed as a university project using the **MERN stack**.

The main purpose of this application is to simplify hospital appointment management, patient registration, doctor availability scheduling, and prescription management.

The system provides separate dashboards for **Administrators, Doctors, and Patients**, allowing each user to access functions based on their role.

## Live Website

**MediFlow:** https://mediflow-client-eta.vercel.app/

## Technologies Used

**Frontend**
- React.js
- Vite
- HTML5
- CSS3
- JavaScript

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose

**Authentication**
- JSON Web Tokens (JWT)
- bcryptjs for password hashing

**Deployment**
- Vercel – Frontend and Backend
- MongoDB Atlas – Cloud Database
- GitHub – Version Control

## Main Features

### 1. Administrator

- Secure administrator login.
- Create doctor and patient accounts.
- Automatically generate unique user IDs.
- View and manage registered doctors and patients.
- View patient appointment requests.
- Approve pending appointments.
- Manage cancelled appointment records.

### 2. Doctor

- Secure doctor login.
- View doctor profile information.
- Manage weekly availability schedules.
- View assigned appointments.
- Create prescriptions for patients.
- Manage prescription information.

### 3. Patient

- Register a new patient account.
- Automatically receive a unique Patient ID.
- Secure patient login.
- View the patient dashboard.
- Select a consultant type and doctor.
- Request appointments using available dates and times.
- View appointment status.
- Cancel appointments.
- View prescriptions provided by doctors.

## User Authentication

MediFlow uses JWT-based authentication to protect user accounts and application routes.

The system supports three user roles:

- **Admin:** User IDs beginning with `A`
- **Doctor:** User IDs beginning with `D`
- **Patient:** User IDs beginning with `P`

Each user is redirected to the appropriate dashboard after a successful login.

Passwords are stored using bcrypt hashing.

## Project Structure

```text
MediFlow/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── config/
│   │   └── App.jsx
│   └── package.json
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── server.js
│   └── package.json
│
└── README.md
```

## Database

The application uses MongoDB Atlas to store and manage information.

The main database collections are:

- **Users:** Administrator, doctor, and patient information.
- **Appointments:** Appointment requests, schedules, and status.
- **Prescriptions:** Prescription records created by doctors.

## Running the Project Locally

### 1. Clone the Repository

```bash
git clone https://github.com/Nadun-Theekshana/MediFlow.git
cd MediFlow
```

### 2. Set Up the Backend

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory and configure:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
```

Ensure MongoDB is available and the database connection details are correct.

Start the backend:

```bash
node server.js
```

### 3. Set Up the Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

The frontend normally runs at:

http://localhost:5173

The backend normally runs at:

http://localhost:5000

The frontend uses `VITE_API_URL` when configured and otherwise connects to the local backend.

## Deployment

MediFlow is deployed using Vercel.

- The React frontend is hosted on Vercel.
- The Express backend is deployed separately on Vercel.
- MongoDB Atlas provides cloud database storage.
- The frontend communicates with the backend using REST APIs.

## Project Objective

The objective of MediFlow is to provide a simple and user-friendly platform for managing hospital-related operations.

The application reduces manual appointment handling and allows patients, doctors, and administrators to access relevant information through separate dashboards.

## Project Information

**Project Name:** MediFlow

**Project Type:** University Web Application Development Project

**Technology:** MERN Stack

**Version:** 1.0

**Status:** Developed and Deployed
