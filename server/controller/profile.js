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
  phone: "phone",
  mobile: "phone",
  city: "city",
  state: "state",
  country: "country",
  branch: "branch",
  graduationYear: "graduationYear",
  company: "company",
  jobTitle: "jobTitle",
  designation: "jobTitle",
  headline: "headline",
  bio: "bio",
  about: "bio",
  education: "education",
  workExperience: "workExperience",
  skills: "skills",
  softSkills: "softSkills",
  tools: "tools",
  projects: "projects",
  certifications: "certifications",
  achievements: "achievements",
  github: "github",
  portfolio: "portfolio",
  linkedin: "linkedin",
  preferredRoles: "preferredRoles",
  mentorshipAvailable: "mentorshipAvailable",
  mentorshipAreas: "mentorshipAreas",
  mentorshipFormat: "mentorshipFormat",
  mentorshipAvailability: "mentorshipAvailability",
  referralAvailable: "referralAvailable",
  profilePhoto: "profilePhoto",
  profileImage: "profilePhoto",
  resumeUrl: "resumeUrl",
  photo: "profilePhoto",
  resume: "resumeUrl",
};

const isValidUrl = (value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};

const preserveCollegeId = (user) => {
  if (user?.collegeId?.name) {
    user.collegeName = user.collegeId.name;
    user.collegeId = user.collegeId._id;
  }
  return user;
};

const getCurrentProfile = async (req, res) => {
  try {
    let user = await User.findById(req.user.id)
      .populate("collegeId", "name")
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user = preserveCollegeId(user);
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

    const protectedFields = [
      "role",
      "verified",
      "verificationStatus",
      "collegeId",
      "isActive",
    ];
    if (protectedFields.some((field) => field in incoming)) {
      return res.status(403).json({
        success: false,
        message: "Account access and verification fields cannot be changed through profile updates",
      });
    }

    Object.entries(profileFieldMap).forEach(([incomingKey, schemaKey]) => {
      if (incoming[incomingKey] !== undefined) {
        update[schemaKey] = incoming[incomingKey];
      }
    });

    const arrayFields = [
      "education",
      "workExperience",
      "skills",
      "softSkills",
      "tools",
      "projects",
      "certifications",
      "achievements",
      "preferredRoles",
      "mentorshipAreas",
    ];
    for (const field of arrayFields) {
      if (field in update && !Array.isArray(update[field])) {
        return res.status(400).json({
          success: false,
          message: `${field} must be an array`,
        });
      }
    }

    for (const field of ["skills", "softSkills", "tools", "achievements", "preferredRoles", "mentorshipAreas"]) {
      if (Array.isArray(update[field]) && update[field].some((item) => typeof item !== "string")) {
        return res.status(400).json({
          success: false,
          message: `${field} must contain only text values`,
        });
      }
    }

    for (const field of ["education", "workExperience", "projects", "certifications"]) {
      if (Array.isArray(update[field]) && update[field].some((item) => !item || typeof item !== "object" || Array.isArray(item))) {
        return res.status(400).json({
          success: false,
          message: `${field} must contain valid profile entries`,
        });
      }
    }

    for (const field of ["mentorshipAvailable", "referralAvailable"]) {
      if (field in update && typeof update[field] !== "boolean") {
        return res.status(400).json({
          success: false,
          message: `${field} must be a boolean`,
        });
      }
    }

    if (incoming.graduationYear !== undefined) {
      const year = incoming.graduationYear === "" || incoming.graduationYear === null
        ? null
        : Number(incoming.graduationYear);
      if (year !== null && (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 10)) {
        return res.status(400).json({
          success: false,
          message: "graduationYear must be a valid year",
        });
      }
      update.graduationYear = year;
    }

    const urlFields = [
      "github",
      "portfolio",
      "linkedin",
      "profilePhoto",
      "resumeUrl",
    ];
    for (const field of urlFields) {
      if (update[field] && !isValidUrl(update[field])) {
        return res.status(400).json({ success: false, message: `${field} must be a valid URL` });
      }
    }

    const nestedUrlFields = [
      ...(Array.isArray(update.projects)
        ? update.projects.flatMap((project, index) => [
            [`Project ${index + 1} GitHub URL`, project.githubUrl],
            [`Project ${index + 1} live URL`, project.liveUrl],
          ])
        : []),
      ...(Array.isArray(update.certifications)
        ? update.certifications.map((certification, index) => [
            `Certification ${index + 1} credential URL`,
            certification.credentialUrl,
          ])
        : []),
    ];

    for (const [label, url] of nestedUrlFields) {
      if (url && !isValidUrl(url)) {
        return res.status(400).json({
          success: false,
          message: `${label} must be a valid URL`,
        });
      }
    }

    let updatedUser = await User.findByIdAndUpdate(userId, update, {
      new: true,
      runValidators: true,
    })
      .populate("collegeId", "name")
      .lean();

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    updatedUser = preserveCollegeId(updatedUser);
    delete updatedUser.password;
    return res.json({ success: true, message: "Profile updated successfully", data: updatedUser });
  } catch (error) {
    const status = ["ValidationError", "CastError"].includes(error.name)
      ? 400
      : error.code === 11000
        ? 409
        : 500;
    return res.status(status).json({ success: false, message: error.message });
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
