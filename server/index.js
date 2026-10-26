import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./db.js";
import { getHome, getHealth } from "./controller/health.js";
import { checkJWT, requireRole } from "./middleware/jwt.js";
import studentProfileRoutes from "./routes/studentProfileRoutes.js";
import imagekitRoutes from "./routes/imagekit.routes.js";
import { postReview, getReviews } from "./controller/review.js";
import { getCurrentProfile, updateCurrentProfile, submitVerificationRequest, getVerificationRequests, updateVerificationStatus } from "./controller/profile.js";
import { getOpportunities, createOpportunity, getReferrals, createReferral, getMentorshipRequests, createMentorshipRequest } from "./controller/community.js";
import {
  registerStudent,
  registerAlumni,
  registerAdmin,
  login,
  updateUser,
} from "./controller/auth.js";
import { googleAuth } from "./controller/googleAuth.js";

const app = express();
app.use(express.json());
app.use(cors());
app.use("/api/student", studentProfileRoutes);
app.use("/api/student", checkJWT, imagekitRoutes);

const PORT = process.env.PORT || 8080;

app.get("/health", getHealth);
app.get("/", getHome);

// Authentication routes
app.post("/api/auth/google", googleAuth);
app.post("/api/auth/register/student", registerStudent);
app.post("/api/auth/register/alumni", registerAlumni);
app.post("/api/auth/register/admin", registerAdmin);
app.post("/api/auth/login", login);

app.put("/api/auth/users", checkJWT, updateUser);

app.get("/api/auth/profile/me", checkJWT, getCurrentProfile);
app.put("/api/auth/profile/me", checkJWT, updateCurrentProfile);

app.post("/api/auth/verification-requests", checkJWT, submitVerificationRequest);
app.get("/api/admin/verification-requests", checkJWT, requireRole(["admin"]), getVerificationRequests);
app.patch("/api/admin/verification-requests/:id", checkJWT, requireRole(["admin"]), updateVerificationStatus);
app.get("/api/opportunities", getOpportunities);
app.post("/api/opportunities", checkJWT, createOpportunity);
app.get("/api/referrals", checkJWT, getReferrals);
app.post("/api/referrals", checkJWT, createReferral);
app.get("/api/mentorship-requests", checkJWT, getMentorshipRequests);
app.post("/api/mentorship-requests", checkJWT, createMentorshipRequest);
app.get("/api/reviews", getReviews);
app.post("/api/reviews", postReview);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
