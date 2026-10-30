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

- Client: `VITE_API_BASE_URL=http://localhost:8080`, `VITE_GOOGLE_CLIENT_ID`
- Server: `PORT=8080`, `MONGODB_URI=mongodb://127.0.0.1:27017/alumni-nexus`, `JWT_SECRET=replace_with_a_secure_secret`, `GOOGLE_CLIENT_ID`, `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`

Set `VITE_GOOGLE_CLIENT_ID` in `client/.env` and `GOOGLE_CLIENT_ID` in
`server/.env` to the same Google OAuth Web client ID. In Google Cloud Console,
open **APIs & Services → Credentials**, edit that OAuth 2.0 Client ID, and add
`http://localhost:5173` under **Authorized JavaScript origins** for local
development. If Vite starts on another port (for example, `5174`), add that
origin too. Add your deployed site's origin there as well when deploying.
Origins contain only the scheme, host, and optional port (no path). The API
allows localhost development ports for CORS; Google OAuth still requires each
used frontend origin to be authorized in Google Cloud Console. Restart both
development servers after changing environment variables.

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
- College-scoped community posts with ImageKit image uploads, likes, comments, and follows
- Frontend build validation

## Notes

Student and alumni accounts must be verified before publishing community posts. Feed, like, comment, and follow data is scoped to the signed-in user's college.

## Community feature testing

1. Configure MongoDB, JWT, and the ImageKit public/private keys in `server/.env`, then run the frontend and backend.
2. Sign in as a verified student or alumni and open `/community`. Unverified accounts can view the feed but cannot publish.
3. Publish text-only, image-only, and text-plus-image posts. Confirm image previews, removal, and image uploads work; try an unsupported file type and a file larger than 5 MB.
4. Like and unlike a post, refresh the page, and confirm the selected state and count persist.
5. Add a comment, refresh, then delete it as its author. Also confirm the post author can moderate a comment.
6. Follow an alumni from a student account, then unfollow. Alumni can follow students and alumni. Refresh the feed and confirm follow status and follower counts persist; self-follow and student-to-student follows are rejected.
7. Verify pagination by creating enough posts to use **Load more**.

Community API routes are available under both `/api/community/posts` and `/api/posts`. Follow routes are available under `/api/community/users/:userId` and `/api/users/:userId`.

## Verification commands

```bash
cd client && npm run build
cd server && npm start
```

## External requirements still needed

- A MongoDB instance for persistent storage
- JWT secret in `.env`
- ImageKit account credentials in `.env` for profile and community image uploads
- Email provider for production workflows
- Optional admin bootstrap workflow for privileged accounts
