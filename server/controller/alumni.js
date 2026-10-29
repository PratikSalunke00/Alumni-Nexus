import User from "../models/User.js";
import MentorshipRequest from "../models/MentorshipRequest.js";
import Referral from "../models/Referral.js";
import Opportunity from "../models/Opportunity.js";
import Application from "../models/Application.js";

// ──────────────────────────────────────────────
// ALUMNI DIRECTORY (for students to browse)
// ──────────────────────────────────────────────
export const getAlumniDirectory = async (req, res) => {
  try {
    const collegeId = req.user.collegeId;
    const { page = 1, limit = 20, search, company, skills } = req.query;

    const filter = {
      collegeId,
      role: "alumni",
      isActive: true,
    };

    if (search?.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { company: { $regex: search.trim(), $options: "i" } },
        { jobTitle: { $regex: search.trim(), $options: "i" } },
        { bio: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (company?.trim()) {
      filter.company = { $regex: company.trim(), $options: "i" };
    }

    if (skills?.trim()) {
      filter.skills = { $in: skills.split(",").map((s) => s.trim()) };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [alumni, total] = await Promise.all([
      User.find(filter)
        .select("name email profilePhoto company jobTitle bio skills graduationYear branch verificationStatus")
        .sort({ verificationStatus: 1, name: 1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: alumni,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("getAlumniDirectory error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// ALUMNI PUBLIC PROFILE
// ──────────────────────────────────────────────
export const getAlumniProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const collegeId = req.user.collegeId;

    const alumni = await User.findOne({ _id: id, collegeId, role: "alumni", isActive: true })
      .select("-password -googleId")
      .lean();

    if (!alumni) {
      return res.status(404).json({ success: false, message: "Alumni not found" });
    }

    return res.json({ success: true, data: alumni });
  } catch (error) {
    console.error("getAlumniProfile error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// ALUMNI STATS (for their own dashboard)
// ──────────────────────────────────────────────
export const getMyAlumniStats = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const [totalOpportunities, pendingReferrals, pendingMentorship, resolvedReferrals] = await Promise.all([
      Opportunity.countDocuments({ postedBy: userId }),
      Referral.countDocuments({ alumni: userId, status: "pending" }),
      MentorshipRequest.countDocuments({ mentor: userId, status: "pending" }),
      Referral.countDocuments({ alumni: userId, status: "approved" }),
    ]);

    return res.json({
      success: true,
      data: {
        totalOpportunities,
        pendingReferrals,
        pendingMentorship,
        resolvedReferrals,
      },
    });
  } catch (error) {
    console.error("getMyAlumniStats error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// MENTORSHIP REQUEST ACTIONS (alumni side)
// ──────────────────────────────────────────────
export const updateMentorshipRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.userId || req.user.id;

    if (!["accepted", "declined"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be accepted or declined" });
    }

    const request = await MentorshipRequest.findOne({ _id: id, mentor: userId });

    if (!request) {
      return res.status(404).json({ success: false, message: "Mentorship request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ success: false, message: "Request is no longer pending" });
    }

    request.status = status;
    await request.save();

    return res.json({ success: true, message: `Mentorship request ${status}`, data: request });
  } catch (error) {
    console.error("updateMentorshipRequestStatus error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// REFERRAL ACTIONS (alumni side)
// ──────────────────────────────────────────────
export const updateReferralStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.userId || req.user.id;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be approved or rejected" });
    }

    const referral = await Referral.findOne({ _id: id, alumni: userId });

    if (!referral) {
      return res.status(404).json({ success: false, message: "Referral not found" });
    }

    if (referral.status !== "pending") {
      return res.status(400).json({ success: false, message: "Referral is no longer pending" });
    }

    referral.status = status;
    await referral.save();

    return res.json({ success: true, message: `Referral ${status}`, data: referral });
  } catch (error) {
    console.error("updateReferralStatus error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// APPLY TO OPPORTUNITY (student side)
// ──────────────────────────────────────────────
export const applyToOpportunity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;

    if (req.user.role !== "student") {
      return res.status(403).json({ success: false, message: "Only students can apply" });
    }

    const opportunity = await Opportunity.findOne({ _id: id, status: "open" });
    if (!opportunity) {
      return res.status(404).json({ success: false, message: "Opportunity not found or closed" });
    }

    const existing = await Application.findOne({ opportunity: id, applicant: userId });
    if (existing) {
      return res.status(409).json({ success: false, message: "You have already applied" });
    }

    const application = await Application.create({
      opportunity: id,
      applicant: userId,
      coverLetter: req.body.coverLetter || "",
      resumeUrl: req.body.resumeUrl || "",
    });

    return res.status(201).json({ success: true, message: "Application submitted", data: application });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "You have already applied" });
    }
    console.error("applyToOpportunity error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// MY APPLICATIONS (student side)
// ──────────────────────────────────────────────
export const getMyApplications = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const applications = await Application.find({ applicant: userId })
      .populate("opportunity", "title company type location status")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: applications });
  } catch (error) {
    console.error("getMyApplications error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// ALUMNI INSIGHTS
// ──────────────────────────────────────────────
export const getAlumniInsights = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const [mentorshipByStatus, referralsByStatus, myOpportunities] = await Promise.all([
      MentorshipRequest.aggregate([
        { $match: { mentor: userId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Referral.aggregate([
        { $match: { alumni: userId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Opportunity.find({ postedBy: userId })
        .select("title type status createdAt")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return res.json({
      success: true,
      data: { mentorshipByStatus, referralsByStatus, myOpportunities },
    });
  } catch (error) {
    console.error("getAlumniInsights error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
