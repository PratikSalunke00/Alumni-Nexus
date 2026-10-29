import { Schema, model } from "mongoose";

const applicationSchema = new Schema(
  {
    opportunity: {
      type: Schema.Types.ObjectId,
      ref: "Opportunity",
      required: true,
    },
    applicant: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coverLetter: { type: String, default: "" },
    resumeUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["applied", "reviewing", "shortlisted", "rejected", "hired"],
      default: "applied",
    },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

// One application per student per opportunity
applicationSchema.index({ opportunity: 1, applicant: 1 }, { unique: true });

const Application = model("Application", applicationSchema);

export default Application;
