import "dotenv/config";

import express from "express";
import cors from "cors";
import connectDB from "./db.js";
import { getHome, getHealth } from "./controller/health.js";
import { checkJWT, requireRole } from "./middleware/jwt.js";
import studentProfileRoutes from "./routes/studentProfileRoutes.js";
import imagekitRoutes from "./routes/imagekit.routes.js";
import { postReview, getReviews } from "./controller/review.js";
import {
  getCurrentProfile,
  updateCurrentProfile,
  submitVerificationRequest,
  getVerificationRequests,
  updateVerificationStatus,
} from "./controller/profile.js";
import {
  getOpportunities,
  createOpportunity,
  getReferrals,
  createReferral,
  getMentorshipRequests,
  createMentorshipRequest,
  getCommunityPosts,
  getCommunityPost,
  createCommunityPost,
  updateCommunityPost,
  deleteCommunityPost,
  likeCommunityPost,
  unlikeCommunityPost,
  getCommunityFollowStatus,
  getCommunityComments,
  createCommunityComment,
  deleteCommunityComment,
  followCommunityUser,
  unfollowCommunityUser,
} from "./controller/updatePost.js";
import {
  registerStudent,
  registerAlumni,
  registerAdmin,
  login,
  updateUser,
} from "./controller/auth.js";
import { googleAuth } from "./controller/googleAuth.js";
import {
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
} from "./controller/authExtensions.js";

// Admin controller
import {
  getAdminStats,
  getAdminUsers,
  suspendUser,
  deleteUser,
  getAdminOpportunities,
  updateOpportunityStatus,
  getInvitationCodes,
  createInvitationCode,
  updateInvitationCode,
  getAdminReports,
  getCollegeSettings,
  updateCollegeSettings,
} from "./controller/admin.js";

// Alumni + Student controller
import {
  getAlumniDirectory,
  getAlumniProfile,
  getMyAlumniStats,
  updateMentorshipRequestStatus,
  updateReferralStatus,
  applyToOpportunity,
  getMyApplications,
  getAlumniInsights,
} from "./controller/alumni.js";

const app = express();
const configuredClientOrigin =
  process.env.CLIENT_URL || "http://localhost:5173";

app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      const isLocalDevelopmentOrigin =
        process.env.NODE_ENV !== "production" &&
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin || "");

      if (
        !origin ||
        origin === configuredClientOrigin ||
        isLocalDevelopmentOrigin
      ) {
        return callback(null, true);
      }

      return callback(new Error("Origin is not allowed by CORS."));
    },
    credentials: true,
  })
);

// ──────────────────────────────────────────────
// HEALTH
// ──────────────────────────────────────────────
app.get("/health", getHealth);
app.get("/", getHome);

// ──────────────────────────────────────────────
// AUTHENTICATION
// ──────────────────────────────────────────────
app.post("/api/auth/google", googleAuth);
app.post("/api/auth/register/student", registerStudent);
app.post("/api/auth/register/alumni", registerAlumni);
app.post("/api/auth/register/admin", registerAdmin);
app.post("/api/auth/login", login);
app.post("/api/auth/logout", checkJWT, logout);
app.post("/api/auth/forgot-password", forgotPassword);
app.post("/api/auth/reset-password/:token", resetPassword);
app.post("/api/auth/change-password", checkJWT, changePassword);

// ──────────────────────────────────────────────
// USER PROFILE
// ──────────────────────────────────────────────
app.put("/api/auth/users", checkJWT, updateUser);
app.get("/api/auth/profile/me", checkJWT, getCurrentProfile);
app.put("/api/auth/profile/me", checkJWT, updateCurrentProfile);
app.get(
  "/api/alumni/profile/me",
  checkJWT,
  requireRole(["alumni"]),
  getCurrentProfile
);
app.put(
  "/api/alumni/profile/me",
  checkJWT,
  requireRole(["alumni"]),
  updateCurrentProfile
);

// ──────────────────────────────────────────────
// STUDENT PROFILE (ImageKit upload)
// ──────────────────────────────────────────────
app.use("/api/student", studentProfileRoutes);
app.use("/api/student", checkJWT, imagekitRoutes);
app.use("/api", checkJWT, imagekitRoutes);

// ──────────────────────────────────────────────
// VERIFICATION REQUESTS
// ──────────────────────────────────────────────
app.post("/api/auth/verification-requests", checkJWT, submitVerificationRequest);
app.get("/api/admin/verification-requests", checkJWT, requireRole(["admin"]), getVerificationRequests);
app.patch("/api/admin/verification-requests/:id", checkJWT, requireRole(["admin"]), updateVerificationStatus);

// ──────────────────────────────────────────────
// COMMUNITY — OPPORTUNITIES
// ──────────────────────────────────────────────
app.get("/api/opportunities", checkJWT, getOpportunities);
app.post("/api/opportunities", checkJWT, createOpportunity);
app.post("/api/opportunities/:id/apply", checkJWT, requireRole(["student"]), applyToOpportunity);
app.get("/api/applications/me", checkJWT, requireRole(["student"]), getMyApplications);

// ──────────────────────────────────────────────
// COMMUNITY — REFERRALS
// ──────────────────────────────────────────────
app.get("/api/referrals", checkJWT, getReferrals);
app.post("/api/referrals", checkJWT, createReferral);
app.patch("/api/referrals/:id/status", checkJWT, requireRole(["alumni"]), updateReferralStatus);

// ──────────────────────────────────────────────
// COMMUNITY — MENTORSHIP
// ──────────────────────────────────────────────
app.get("/api/mentorship-requests", checkJWT, getMentorshipRequests);
app.post("/api/mentorship-requests", checkJWT, createMentorshipRequest);
app.patch("/api/mentorship-requests/:id/status", checkJWT, requireRole(["alumni"]), updateMentorshipRequestStatus);

// ──────────────────────────────────────────────
// COMMUNITY FEED
// ──────────────────────────────────────────────
const communityRoles = ["student", "alumni", "admin"];
app.get("/api/community/posts", checkJWT, requireRole(communityRoles), getCommunityPosts);
app.post("/api/community/posts", checkJWT, requireRole(communityRoles), createCommunityPost);
app.get("/api/community/posts/:postId", checkJWT, requireRole(communityRoles), getCommunityPost);
app.put("/api/community/posts/:postId", checkJWT, requireRole(communityRoles), updateCommunityPost);
app.delete("/api/community/posts/:postId", checkJWT, requireRole(communityRoles), deleteCommunityPost);
app.post("/api/community/posts/:postId/like", checkJWT, requireRole(communityRoles), likeCommunityPost);
app.delete("/api/community/posts/:postId/like", checkJWT, requireRole(communityRoles), unlikeCommunityPost);
app.get("/api/community/posts/:postId/comments", checkJWT, requireRole(communityRoles), getCommunityComments);
app.post("/api/community/posts/:postId/comments", checkJWT, requireRole(communityRoles), createCommunityComment);
app.delete("/api/community/comments/:commentId", checkJWT, requireRole(communityRoles), deleteCommunityComment);
app.post("/api/community/users/:userId/follow", checkJWT, requireRole(communityRoles), followCommunityUser);
app.delete("/api/community/users/:userId/follow", checkJWT, requireRole(communityRoles), unfollowCommunityUser);
app.get("/api/community/users/:userId/follow-status", checkJWT, requireRole(communityRoles), getCommunityFollowStatus);

// Keep the community-prefixed API used by the app while exposing the
// conventional resource paths for clients that integrate with the feed.
app.get("/api/posts", checkJWT, requireRole(communityRoles), getCommunityPosts);
app.post("/api/posts", checkJWT, requireRole(communityRoles), createCommunityPost);
app.get("/api/posts/:postId", checkJWT, requireRole(communityRoles), getCommunityPost);
app.put("/api/posts/:postId", checkJWT, requireRole(communityRoles), updateCommunityPost);
app.delete("/api/posts/:postId", checkJWT, requireRole(communityRoles), deleteCommunityPost);
app.post("/api/posts/:postId/like", checkJWT, requireRole(communityRoles), likeCommunityPost);
app.delete("/api/posts/:postId/like", checkJWT, requireRole(communityRoles), unlikeCommunityPost);
app.get("/api/posts/:postId/comments", checkJWT, requireRole(communityRoles), getCommunityComments);
app.post("/api/posts/:postId/comments", checkJWT, requireRole(communityRoles), createCommunityComment);
app.delete("/api/posts/:postId/comments/:commentId", checkJWT, requireRole(communityRoles), deleteCommunityComment);
app.post("/api/users/:userId/follow", checkJWT, requireRole(communityRoles), followCommunityUser);
app.delete("/api/users/:userId/follow", checkJWT, requireRole(communityRoles), unfollowCommunityUser);
app.get("/api/users/:userId/follow-status", checkJWT, requireRole(communityRoles), getCommunityFollowStatus);

// ──────────────────────────────────────────────
// ALUMNI DIRECTORY & STATS
// ──────────────────────────────────────────────
app.get("/api/alumni", checkJWT, getAlumniDirectory);
app.get("/api/alumni/stats/me", checkJWT, requireRole(["alumni"]), getMyAlumniStats);
app.get("/api/alumni/insights/me", checkJWT, requireRole(["alumni"]), getAlumniInsights);
app.get("/api/alumni/:id", checkJWT, getAlumniProfile);

// ──────────────────────────────────────────────
// REVIEWS
// ──────────────────────────────────────────────
app.get("/api/reviews", getReviews);
app.post("/api/reviews", postReview);

// ──────────────────────────────────────────────
// ADMIN — STATS & MANAGEMENT
// ──────────────────────────────────────────────
app.get("/api/admin/stats", checkJWT, requireRole(["admin"]), getAdminStats);
app.get("/api/admin/users", checkJWT, requireRole(["admin"]), getAdminUsers);
app.patch("/api/admin/users/:id/suspend", checkJWT, requireRole(["admin"]), suspendUser);
app.delete("/api/admin/users/:id", checkJWT, requireRole(["admin"]), deleteUser);
app.get("/api/admin/opportunities", checkJWT, requireRole(["admin"]), getAdminOpportunities);
app.patch("/api/admin/opportunities/:id/status", checkJWT, requireRole(["admin"]), updateOpportunityStatus);
app.get("/api/admin/invitation-codes", checkJWT, requireRole(["admin"]), getInvitationCodes);
app.post("/api/admin/invitation-codes", checkJWT, requireRole(["admin"]), createInvitationCode);
app.patch("/api/admin/invitation-codes/:id", checkJWT, requireRole(["admin"]), updateInvitationCode);
app.get("/api/admin/reports", checkJWT, requireRole(["admin"]), getAdminReports);
app.get("/api/admin/college-settings", checkJWT, requireRole(["admin"]), getCollegeSettings);
app.put("/api/admin/college-settings", checkJWT, requireRole(["admin"]), updateCollegeSettings);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
