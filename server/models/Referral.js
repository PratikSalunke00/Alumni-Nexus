import { Schema, model } from "mongoose";

const referralSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    alumni: { type: Schema.Types.ObjectId, ref: "User", required: true },
    opportunity: { type: Schema.Types.ObjectId, ref: "Opportunity", required: true },
    message: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Referral = model("Referral", referralSchema);

export default Referral;
