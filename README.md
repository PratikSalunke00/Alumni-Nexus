# Alumni Nexus

Alumni Nexus is a college alumni-student collaboration platform built with React + Vite on the frontend and Express + MongoDB on the backend.

## Stack

- Frontend: React, Vite, React Router, Axios, Tailwind-compatible utility classes
- Backend: Node.js, Express, Mongoose, JWT, bcryptjs
- Database: MongoDB

## Project structure

- `client/` — React frontend
- `server/` — Express backend and MongoDB model layer

## Setup

### 1) Install dependencies

```bash
cd client && npm install
cd ../server && npm install
```

### 2) Configure environment variables

Copy the examples before running locally:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Then update values as needed.

Required variables:

- Client: `VITE_API_BASE_URL=http://localhost:8080`
- Server: `PORT=8080`, `MONGODB_URI=mongodb://127.0.0.1:27017/alumni-nexus`, `JWT_SECRET=replace_with_a_secure_secret`

## Run locally

### Frontend

```bash
cd client
npm run dev
```

### Backend

```bash
cd server
npm start
```

## Features currently implemented

- Landing page
- Login and signup screens
- Student, alumni, and admin role support in the auth flow
- Role-based dashboard route protection
- MongoDB connection helper and server route setup
- User registration and login API flow
- Review submission API and model
- Frontend build validation

## Notes

This repository is in active implementation. It includes a working foundation for auth and dashboard routing, but the larger full-scale alumni platform features described in the master spec remain a larger project phase beyond the current codebase baseline.

## Verification commands

```bash
cd client && npm run build
cd server && npm start
```

## External requirements still needed

- A MongoDB instance for persistent storage
- JWT secret in `.env`
- Email provider and storage integration for production workflows
- Optional admin bootstrap workflow for privileged accounts
