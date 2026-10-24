import { Schema, model } from "mongoose";

const mentorshipRequestSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mentor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    topic: { type: String, required: true, trim: true },
    availableTime: { type: String, default: "" },
    message: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const MentorshipRequest = model("MentorshipRequest", mentorshipRequestSchema);

export default MentorshipRequest;
