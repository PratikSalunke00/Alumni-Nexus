import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./db.js";
import { getHome, getHealth } from "./controller/health.js";
import { postSignUp, postLogin, updateUser } from "./controller/auth.js";
import { checkJWT, requireRole } from "./middleware/jwt.js";
import { postReview, getReviews } from "./controller/review.js";
import { getCurrentProfile, updateCurrentProfile, submitVerificationRequest, getVerificationRequests, updateVerificationStatus } from "./controller/profile.js";
import { getOpportunities, createOpportunity, getReferrals, createReferral, getMentorshipRequests, createMentorshipRequest } from "./controller/community.js";
import imagekitRoutes from "./routes/imagekit.routes.js";
import studentProfileRoutes from './routes/studentProfileRoutes.js';

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 8080;

app.get("/health", getHealth);
app.get("/", getHome);

app.post("/signUp", postSignUp);
app.post("/login", postLogin);
app.put("/update-user", checkJWT, updateUser);
app.get("/profile/me", checkJWT, getCurrentProfile);
app.put("/profile/me", checkJWT, updateCurrentProfile);
app.post("/verification-requests", checkJWT, submitVerificationRequest);
app.get("/admin/verification-requests", checkJWT, requireRole(["admin"]), getVerificationRequests);
app.patch("/admin/verification-requests/:id", checkJWT, requireRole(["admin"]), updateVerificationStatus);
app.get("/opportunities", getOpportunities);
app.post("/opportunities", checkJWT, createOpportunity);
app.get("/referrals", checkJWT, getReferrals);
app.post("/referrals", checkJWT, createReferral);
app.get("/mentorship-requests", checkJWT, getMentorshipRequests);
app.post("/mentorship-requests", checkJWT, createMentorshipRequest);
app.get("/reviews", getReviews);
app.post("/reviews", postReview);
app.use("/api/student", imagekitRoutes);
app.use(express.json());
app.use('/api/student', studentProfileRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
