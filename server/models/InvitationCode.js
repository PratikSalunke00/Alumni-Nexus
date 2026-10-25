
import mongoose from "mongoose";

const invitationCodeSchema = new mongoose.Schema(
  {
    codeHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: true,
      index: true,
    },

    allowedRoles: {
      type: [
        {
          type: String,
          enum: ["student", "alumni"],
        },
      ],
      default: ["student", "alumni"],
      required: true,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    maxUses: {
      type: Number,
      default: 1000,
      min: 1,
    },

    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const InvitationCode = mongoose.model(
  "InvitationCode",
  invitationCodeSchema
);

export default InvitationCode;
