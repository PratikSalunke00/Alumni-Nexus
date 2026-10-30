import mongoose from "mongoose";

export const COMMUNITY_CATEGORIES = [
  "General Discussion",
  "Achievement",
  "Project",
  "Internship / Job",
  "Event",
  "Technical Knowledge",
  "Announcement",
];

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: true,
      index: true,
    },
    content: {
      type: String,
      trim: true,
      default: "",
      maxlength: 5000,
    },
    image: {
      url: { type: String, trim: true },
      fileId: { type: String, trim: true },
      name: { type: String, trim: true, maxlength: 255 },
      size: { type: Number, min: 1 },
      mimeType: { type: String, trim: true },
      filePath: { type: String, trim: true },
      width: { type: Number, min: 1 },
      height: { type: Number, min: 1 },
    },
    category: {
      type: String,
      enum: COMMUNITY_CATEGORIES,
      default: "General Discussion",
    },
  },
  { timestamps: true }
);

postSchema.pre("validate", function () {
  if (!this.content?.trim() && !this.image?.url) {
    this.invalidate("content", "A post must include text or an image");
  }
});

postSchema.index({ collegeId: 1, createdAt: -1 });

export default mongoose.model("Post", postSchema);
