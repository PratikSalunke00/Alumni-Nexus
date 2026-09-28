import dotenv from "dotenv";
dotenv.config(); 

import express from "express";
import cors from "cors";
import connectDB from "./db.js";


dotenv.config();
const app = express();
app.use(express.json());

app.use(cors());

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
