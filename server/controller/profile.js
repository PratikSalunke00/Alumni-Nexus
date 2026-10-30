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

    if (!["alumni", "student"].includes(req.user.role || user.role)) {
      return res.status(403).json({ success: false, message: "Only students and alumni may submit verification requests" });
    }

    // Check if there is an existing pending request
    let request = await VerificationRequest.findOne({ user: user._id, status: "pending" });
    if (request) {
      if (req.body.evidence) {
        request.evidence = req.body.evidence;
        await request.save();
      }
      return res.status(200).json({ success: true, message: "Verification request updated", data: request });
    }

    request = await VerificationRequest.create({
      user: user._id,
      type: (req.user.role || user.role) === "alumni" ? "alumni" : "student",
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
    let collegeId = req.user?.collegeId;
    if (!collegeId && req.user?.id) {
      const adminUser = await User.findById(req.user.id).select("collegeId").lean();
      collegeId = adminUser?.collegeId;
    }

    // Find all student and alumni users in this college
    const collegeFilter = collegeId
      ? { collegeId, role: { $in: ["student", "alumni"] } }
      : { role: { $in: ["student", "alumni"] } };

    const collegeUsers = await User.find(collegeFilter)
      .select("_id name email role company branch jobTitle headline verificationStatus createdAt profilePhoto")
      .lean();
    const collegeUserIds = collegeUsers.map((u) => u._id);

    // Auto-create VerificationRequest for any user with verificationStatus: "pending" who does not have an existing VerificationRequest
    const pendingUsers = collegeUsers.filter((u) => u.verificationStatus === "pending");
    for (const u of pendingUsers) {
      const existing = await VerificationRequest.findOne({ user: u._id });
      if (!existing) {
        await VerificationRequest.create({
          user: u._id,
          type: u.role === "alumni" ? "alumni" : "student",
          evidence: u.headline || u.branch || u.company || `New ${u.role} registration awaiting verification`,
          status: "pending",
          createdAt: u.createdAt || new Date(),
        });
      }
    }

    const requests = await VerificationRequest.find({
      user: { $in: collegeUserIds },
    })
      .populate("user", "name email role company designation branch headline profilePhoto verificationStatus")
      .sort({ createdAt: -1 });

    const validRequests = requests.filter((r) => r.user);
    return res.json({ success: true, data: validRequests });
  } catch (error) {
    console.error("getVerificationRequests error:", error);
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

    let request = await VerificationRequest.findById(id);
    if (!request) {
      // Fallback: id might be a User ID
      const user = await User.findById(id);
      if (user) {
        request = await VerificationRequest.findOne({ user: user._id });
        if (!request) {
          request = await VerificationRequest.create({
            user: user._id,
            type: user.role === "alumni" ? "alumni" : "student",
            evidence: user.headline || user.branch || user.company || `New ${user.role} registration`,
            status,
            rejectionReason: status === "rejected" ? (rejectionReason || "") : "",
            reviewedBy: req.user.id,
            reviewedAt: new Date(),
          });
        }
      }
    }

    if (!request) {
      return res.status(404).json({ success: false, message: "Verification request not found" });
    }

    request.status = status;
    request.rejectionReason = status === "rejected" ? (rejectionReason || "") : "";
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();

    await request.save();

    const userVerificationStatus = status === "approved" ? "verified" : status === "rejected" ? "rejected" : "pending";
    await User.findByIdAndUpdate(request.user, {
      verificationStatus: userVerificationStatus,
    });

    const populated = await VerificationRequest.findById(request._id).populate(
      "user",
      "name email role company designation branch headline profilePhoto verificationStatus"
    );

    return res.json({ success: true, message: "Verification status updated", data: populated });
  } catch (error) {
    console.error("updateVerificationStatus error:", error);
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
