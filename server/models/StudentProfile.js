
import mongoose from 'mongoose';

const educationSchema = new mongoose.Schema({
  college: { type: String, default: '' },
  degree: { type: String, default: '' },
  branch: { type: String, default: '' },
  currentYear: { type: String, default: '' },
  startYear: { type: String, default: '' },
  graduationYear: { type: String, default: '' },
  grade: { type: String, default: '' },
});

const projectSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  technologies: { type: String, default: '' },
  githubUrl: { type: String, default: '' },
  liveUrl: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
});

const certificationSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  organization: { type: String, default: '' },
  issueDate: { type: String, default: '' },
  credentialUrl: { type: String, default: '' },
});

const studentProfileSchema = new mongoose.Schema(
  {
    // One profile belongs to one authenticated user.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    fullName: { type: String, default: '' },
    email: { type: String, default: '' },
    mobile: { type: String, default: '' },
    dateOfBirth: { type: String, default: '' },
    gender: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: 'India' },
    postalCode: { type: String, default: '' },

    headline: { type: String, default: '' },
    about: { type: String, default: '' },
    showMobile: { type: Boolean, default: false },
    showAddress: { type: Boolean, default: false },

    education: {
      type: [educationSchema],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
    },
    projects: {
      type: [projectSchema],
      default: [],
    },
    certifications: {
      type: [certificationSchema],
      default: [],
    },

    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    leetcode: { type: String, default: '' },

    // Save ImageKit URLs here, not the file contents.
    photo: { type: String, default: '' },
    resume: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model(
  'StudentProfile',
  studentProfileSchema
);
