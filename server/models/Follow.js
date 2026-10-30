import mongoose from "mongoose";

const followSchema = new mongoose.Schema(
  {
    followerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    followingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

followSchema.index(
  { collegeId: 1, followerId: 1, followingId: 1 },
  { unique: true }
);
followSchema.index({ collegeId: 1, followingId: 1 });

export default mongoose.model("Follow", followSchema);
