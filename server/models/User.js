
import mongoose from "mongoose";

const educationSchema = new mongoose.Schema(
  {
    college: { type: String, default: "", trim: true },
    degree: { type: String, default: "", trim: true },
    branch: { type: String, default: "", trim: true },
    startYear: { type: String, default: "" },
    graduationYear: { type: String, default: "" },
    grade: { type: String, default: "", trim: true },
    achievements: { type: String, default: "" },
  },
  { _id: false }
);

const workExperienceSchema = new mongoose.Schema(
  {
    company: { type: String, default: "", trim: true },
    jobTitle: { type: String, default: "", trim: true },
    employmentType: { type: String, default: "", trim: true },
    location: { type: String, default: "", trim: true },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    current: { type: Boolean, default: false },
    description: { type: String, default: "", maxlength: 3000 },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, default: "", trim: true },
    description: { type: String, default: "", maxlength: 3000 },
    technologies: { type: String, default: "" },
    githubUrl: { type: String, default: "" },
    liveUrl: { type: String, default: "" },
  },
  { _id: false }
);

const certificationSchema = new mongoose.Schema(
  {
    title: { type: String, default: "", trim: true },
    organization: { type: String, default: "", trim: true },
    issueDate: { type: String, default: "" },
    expiryDate: { type: String, default: "" },
    credentialId: { type: String, default: "", trim: true },
    credentialUrl: { type: String, default: "" },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    role: {
      type: String,
      enum: ["student", "alumni", "admin"],
      required: true,
      default: "student",
    },

    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: true,
      index: true,
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },

    profilePhoto: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      default: "",
      trim: true,
    },

    state: {
      type: String,
      default: "",
      trim: true,
    },

    country: {
      type: String,
      default: "",
      trim: true,
    },

    headline: {
      type: String,
      default: "",
      trim: true,
      maxlength: 160,
    },

    branch: {
      type: String,
      default: "",
      trim: true,
    },

    education: {
      type: [educationSchema],
      default: [],
    },

    graduationYear: {
      type: Number,
      default: null,
    },

    company: {
      type: String,
      default: "",
      trim: true,
    },

    jobTitle: {
      type: String,
      default: "",
      trim: true,
    },

    workExperience: {
      type: [workExperienceSchema],
      default: [],
    },

    skills: {
      type: [String],
      default: [],
    },

    softSkills: {
      type: [String],
      default: [],
    },

    tools: {
      type: [String],
      default: [],
    },

    bio: {
      type: String,
      default: "",
      maxlength: 1000,
    },

    projects: {
      type: [projectSchema],
      default: [],
    },

    certifications: {
      type: [certificationSchema],
      default: [],
    },

    achievements: {
      type: [String],
      default: [],
    },

    linkedin: {
      type: String,
      default: "",
    },

    github: {
      type: String,
      default: "",
    },

    portfolio: {
      type: String,
      default: "",
    },

    resumeUrl: {
      type: String,
      default: "",
    },

    mentorshipAvailable: {
      type: Boolean,
      default: false,
    },

    mentorshipAreas: {
      type: [String],
      default: [],
    },

    mentorshipFormat: {
      type: String,
      default: "",
    },

    mentorshipAvailability: {
      type: String,
      default: "",
    },

    referralAvailable: {
      type: Boolean,
      default: false,
    },

    preferredRoles: {
      type: [String],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
