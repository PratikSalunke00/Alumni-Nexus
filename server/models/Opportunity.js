import { Schema, model } from "mongoose";

const opportunitySchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["Internship", "Full Time", "Part Time", "Freelance", "Campus"],
      default: "Internship",
    },
    location: { type: String, default: "Remote" },
    remote: { type: Boolean, default: false },
    description: { type: String, default: "" },
    salary: { type: String, default: "" },
    tags: { type: [String], default: [] },
    postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["open", "closed", "draft"], default: "open" },
    applicationDeadline: { type: Date },
  },
  { timestamps: true }
);

const Opportunity = model("Opportunity", opportunitySchema);

export default Opportunity;
