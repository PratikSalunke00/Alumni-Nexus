import { Schema, model } from "mongoose";

const userSchema = new Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    mobile: {
        type: Number,
    },
    city: {
        type: String,
    },
    country: {
        type: String,
    },
    pincode: {
        type: Number,
    },
    whatsappNumber: {
        type: Number,
    },
    address: {
        type: String,
    },
    role: {
      type: String,
      enum: ["student", "alumni", "admin"],
      default: "student",
    },
    department: {
      type: String,
      default: "",
    },
    branch: {
      type: String,
      default: "",
    },
    graduationYear: {
      type: Number,
      default: null,
    },
    company: {
      type: String,
      default: "",
    },
    designation: {
      type: String,
      default: "",
    },
    experience: {
      type: Number,
      default: 0,
    },
    bio: {
      type: String,
      default: "",
    },
    skills: {
      type: [String],
      default: [],
    },
    projects: {
      type: [String],
      default: [],
    },
    certifications: {
      type: [String],
      default: [],
    },
    github: {
      type: String,
      default: "",
    },
    portfolio: {
      type: String,
      default: "",
    },
    linkedin: {
      type: String,
      default: "",
    },
    preferredRoles: {
      type: [String],
      default: [],
    },
    locations: {
      type: [String],
      default: [],
    },
    careerInterests: {
      type: [String],
      default: [],
    },
    mentorshipAvailable: {
      type: Boolean,
      default: false,
    },
    referralPreference: {
      type: String,
      default: "",
    },
    profileVisibility: {
      type: String,
      enum: ["public", "private", "college"],
      default: "public",
    },
    profileImage: {
      type: String,
      default: "",
    },
    resumeUrl: {
      type: String,
      default: "",
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
    },
    collegeEmail: {
      type: String,
      default: "",
    },
    password: {
        type: String,
        required: true,
    },
    photos: {
        type: [String],
        default: [],
    },

}, { timestamps: true })

const User = model("User", userSchema);

export default User