import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/alumni-nexus";
    const conn = await mongoose.connect(mongoUri);
    if (conn) {
      console.log("connected to mongodb");
    }
  } catch (e) {
    console.log(`Error connecting to mongodb ${e.message}`);
  }
};

export default connectDB;