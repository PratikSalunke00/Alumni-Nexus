import User from "../models/User.js";
import VerificationRequest from "../models/VerificationRequest.js";


const sanitizeUser = (user) => {
  if (!user) return null;
  const data = user.toObject ? user.toObject() : { ...user };
  delete data.password;
  return data;
};

const profileFieldMap = {
  name: "name",
  email: "email",
  mobile: "mobile",
  city: "city",
  country: "country",
  department: "department",
  branch: "branch",
  graduationYear: "graduationYear",
  role: "role",
  company: "company",
  designation: "designation",
  experience: "experience",
  bio: "bio",
  skills: "skills",
  projects: "projects",
  certifications: "certifications",
  github: "github",
  portfolio: "portfolio",
  linkedin: "linkedin",
  preferredRoles: "preferredRoles",
  locations: "locations",
  careerInterests: "careerInterests",
  mentorshipAvailable: "mentorshipAvailable",
  referralPreference: "referralPreference",
  profileVisibility: "profileVisibility",
  profileImage: "profileImage",
  resumeUrl: "resumeUrl",
  verified: "verified",
  collegeEmail: "collegeEmail",
  department: "department",
};

const isValidUrl = (value) => {
  if (!value) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const getCurrentProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    delete user.password;
    return res.json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateCurrentProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const incoming = req.body || {};
    const update = {};

    Object.entries(profileFieldMap).forEach(([incomingKey, schemaKey]) => {
      if (incoming[incomingKey] !== undefined) {
        update[schemaKey] = incoming[incomingKey];
      }
    });

    if (incoming.skills && Array.isArray(incoming.skills)) {
      update.skills = incoming.skills;
    }

    if (incoming.preferredRoles && Array.isArray(incoming.preferredRoles)) {
      update.preferredRoles = incoming.preferredRoles;
    }

    if (incoming.locations && Array.isArray(incoming.locations)) {
      update.locations = incoming.locations;
    }

    if (incoming.careerInterests && Array.isArray(incoming.careerInterests)) {
      update.careerInterests = incoming.careerInterests;
    }

    if (incoming.projects && Array.isArray(incoming.projects)) {
      update.projects = incoming.projects;
    }

    if (incoming.certifications && Array.isArray(incoming.certifications)) {
      update.certifications = incoming.certifications;
    }

    const urlFields = ["github", "portfolio", "linkedin", "profileImage", "resumeUrl"];
    for (const field of urlFields) {
      if (update[field] && !isValidUrl(update[field])) {
        return res.status(400).json({ success: false, message: `${field} must be a valid URL` });
      }
    }

    if (incoming.role && !["student", "alumni", "admin"].includes(incoming.role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, update, { new: true, runValidators: true }).lean();

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    delete updatedUser.password;
    return res.json({ success: true, message: "Profile updated successfully", data: updatedUser });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const submitVerificationRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if ((req.user.role || user.role) !== "alumni") {
      return res.status(403).json({ success: false, message: "Only alumni may submit verification requests" });
    }

    const request = await VerificationRequest.create({
      user: user._id,
      type: "alumni",
      evidence: req.body.evidence || "",
      status: "pending",
    });

    return res.status(201).json({ success: true, message: "Verification request submitted", data: request });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getVerificationRequests = async (req, res) => {
  try {
    const requests = await VerificationRequest.find()
      .populate("user", "name email role company designation verified")
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateVerificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!status || !["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid verification status" });
    }

    const request = await VerificationRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Verification request not found" });
    }

    request.status = status;
    request.rejectionReason = status === "rejected" ? (rejectionReason || "") : "";
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();

    await request.save();

    if (status === "approved") {
      await User.findByIdAndUpdate(request.user, { verified: true, verificationStatus: "verified" });
    }

    if (status === "rejected") {
      await User.findByIdAndUpdate(request.user, { verified: false, verificationStatus: "rejected" });
    }

    return res.json({ success: true, message: "Verification status updated", data: request });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export {
  getCurrentProfile,
  updateCurrentProfile,
  submitVerificationRequest,
  getVerificationRequests,
  updateVerificationStatus,
  sanitizeUser,
};
