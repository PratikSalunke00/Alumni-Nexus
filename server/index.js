import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./db.js";
import { getHome, getHealth } from "./controller/health.js";
import { postSignUp, postLogin, updateUser } from "./controller/auth.js";
import { checkJWT } from "./middleware/jwt.js";
import { postReview, getReviews } from "./controller/review.js";

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 8080;

app.get("/health", getHealth);
app.get("/", getHome);

app.post("/signUp", postSignUp);
app.post("/login", postLogin);
app.put("/update-user", checkJWT, updateUser);
app.get("/reviews", getReviews);
app.post("/reviews", postReview);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
