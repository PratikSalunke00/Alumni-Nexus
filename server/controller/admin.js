import User from "../models/User.js";
import College from "../models/College.js";
import InvitationCode from "../models/InvitationCode.js";
import Opportunity from "../models/Opportunity.js";
import VerificationRequest from "../models/VerificationRequest.js";
import MentorshipRequest from "../models/MentorshipRequest.js";
import Referral from "../models/Referral.js";
import crypto from "crypto";

const hashCode = (code) =>
  crypto.createHash("sha256").update(code.trim().toUpperCase()).digest("hex");

// ──────────────────────────────────────────────
// STATS
// ──────────────────────────────────────────────
export const getAdminStats = async (req, res) => {
  try {
    const collegeId = req.user.collegeId;

    const [totalUsers, totalAlumni, totalStudents, pendingVerifications, totalOpportunities, pendingOpportunities] =
      await Promise.all([
        User.countDocuments({ collegeId }),
        User.countDocuments({ collegeId, role: "alumni" }),
        User.countDocuments({ collegeId, role: "student" }),
        VerificationRequest.countDocuments({
          status: "pending",
          // Only count users of this college
          user: {
            $in: await User.find({ collegeId }).distinct("_id"),
          },
        }),
        Opportunity.countDocuments({ postedBy: { $in: await User.find({ collegeId }).distinct("_id") } }),
        Opportunity.countDocuments({ status: "open", postedBy: { $in: await User.find({ collegeId }).distinct("_id") } }),
      ]);

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalAlumni,
        totalStudents,
        pendingVerifications,
        totalOpportunities,
        pendingOpportunities,
      },
    });
  } catch (error) {
    console.error("getAdminStats error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// USER MANAGEMENT
// ──────────────────────────────────────────────
export const getAdminUsers = async (req, res) => {
  try {
    const collegeId = req.user.collegeId;
    const { page = 1, limit = 20, role, status, search } = req.query;

    const filter = { collegeId };

    if (role && ["student", "alumni", "admin"].includes(role)) {
      filter.role = role;
    }

    if (status === "active") filter.isActive = true;
    else if (status === "inactive") filter.isActive = false;
    else if (status === "verified") filter.verificationStatus = "verified";
    else if (status === "pending") filter.verificationStatus = "pending";

    if (search?.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
        { company: { $regex: search.trim(), $options: "i" } },
        { branch: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("getAdminUsers error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { suspend } = req.body; // boolean

    const user = await User.findOne({ _id: id, collegeId: req.user.collegeId });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === "admin" && user._id.toString() === req.user.userId) {
      return res.status(400).json({ success: false, message: "Cannot suspend yourself" });
    }

    user.isActive = suspend === false || suspend === "false" ? false : !user.isActive;
    if (typeof suspend === "boolean") user.isActive = !suspend;

    await user.save();

    return res.json({
      success: true,
      message: `User ${user.isActive ? "reactivated" : "suspended"} successfully`,
      data: { isActive: user.isActive },
    });
  } catch (error) {
    console.error("suspendUser error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.userId) {
      return res.status(400).json({ success: false, message: "Cannot delete your own account" });
    }

    const user = await User.findOneAndUpdate(
      { _id: id, collegeId: req.user.collegeId },
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, message: "User account deactivated" });
  } catch (error) {
    console.error("deleteUser error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// OPPORTUNITY MODERATION
// ──────────────────────────────────────────────
export const getAdminOpportunities = async (req, res) => {
  try {
    const collegeId = req.user.collegeId;
    const { page = 1, limit = 20, status } = req.query;

    const collegeUserIds = await User.find({ collegeId }).distinct("_id");
    const filter = { postedBy: { $in: collegeUserIds } };

    if (status && ["open", "closed", "draft"].includes(status)) {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [opportunities, total] = await Promise.all([
      Opportunity.find(filter)
        .populate("postedBy", "name email company role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Opportunity.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: opportunities,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    console.error("getAdminOpportunities error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOpportunityStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["open", "closed", "draft"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const opportunity = await Opportunity.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!opportunity) {
      return res.status(404).json({ success: false, message: "Opportunity not found" });
    }

    return res.json({ success: true, message: "Opportunity status updated", data: opportunity });
  } catch (error) {
    console.error("updateOpportunityStatus error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// INVITATION CODE MANAGEMENT
// ──────────────────────────────────────────────
export const getInvitationCodes = async (req, res) => {
  try {
    const codes = await InvitationCode.find({ collegeId: req.user.collegeId })
      .sort({ createdAt: -1 })
      .lean();

    // Never return the hash to the frontend; show masked placeholder
    const safe = codes.map(({ codeHash, ...rest }) => ({
      ...rest,
      codeHash: undefined,
      hasCode: true,
    }));

    return res.json({ success: true, data: safe });
  } catch (error) {
    console.error("getInvitationCodes error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createInvitationCode = async (req, res) => {
  try {
    const { code, allowedRoles, maxUses, expiresAt } = req.body;

    if (!code?.trim() || code.trim().length < 4 || code.trim().length > 64) {
      return res.status(400).json({ success: false, message: "Code must be 4-64 characters" });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : ["student", "alumni"];
    const validRoles = roles.filter((r) => ["student", "alumni"].includes(r));

    if (validRoles.length === 0) {
      return res.status(400).json({ success: false, message: "At least one valid role required" });
    }

    const codeHash = hashCode(code.trim());

    if (await InvitationCode.exists({ codeHash })) {
      return res.status(409).json({ success: false, message: "This code is already in use" });
    }

    const invCode = await InvitationCode.create({
      codeHash,
      collegeId: req.user.collegeId,
      allowedRoles: validRoles,
      maxUses: maxUses ? Number(maxUses) : 1000,
      usedCount: 0,
      active: true,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    return res.status(201).json({
      success: true,
      message: "Invitation code created",
      data: { ...invCode.toObject(), codeHash: undefined, code: code.trim() },
    });
  } catch (error) {
    console.error("createInvitationCode error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateInvitationCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { active, maxUses, expiresAt } = req.body;

    const code = await InvitationCode.findOne({ _id: id, collegeId: req.user.collegeId });

    if (!code) {
      return res.status(404).json({ success: false, message: "Invitation code not found" });
    }

    if (typeof active === "boolean") code.active = active;
    if (maxUses != null) code.maxUses = Number(maxUses);
    if (expiresAt !== undefined) code.expiresAt = expiresAt ? new Date(expiresAt) : null;

    await code.save();

    return res.json({ success: true, message: "Invitation code updated", data: { ...code.toObject(), codeHash: undefined } });
  } catch (error) {
    console.error("updateInvitationCode error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// REPORTS
// ──────────────────────────────────────────────
export const getAdminReports = async (req, res) => {
  try {
    const collegeId = req.user.collegeId;
    const collegeUserIds = await User.find({ collegeId }).distinct("_id");

    // Monthly user registration for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [
      userGrowth,
      verificationFunnel,
      mentorshipStats,
      referralStats,
      opportunityStats,
    ] = await Promise.all([
      User.aggregate([
        { $match: { collegeId: collegeId, createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              role: "$role",
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      VerificationRequest.aggregate([
        { $match: { user: { $in: collegeUserIds } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      MentorshipRequest.aggregate([
        { $match: { $or: [{ student: { $in: collegeUserIds } }, { mentor: { $in: collegeUserIds } }] } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Referral.aggregate([
        { $match: { $or: [{ student: { $in: collegeUserIds } }, { alumni: { $in: collegeUserIds } }] } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Opportunity.aggregate([
        { $match: { postedBy: { $in: collegeUserIds } } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
    ]);

    return res.json({
      success: true,
      data: {
        userGrowth,
        verificationFunnel,
        mentorshipStats,
        referralStats,
        opportunityStats,
      },
    });
  } catch (error) {
    console.error("getAdminReports error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// COLLEGE SETTINGS
// ──────────────────────────────────────────────
export const getCollegeSettings = async (req, res) => {
  try {
    const college = await College.findById(req.user.collegeId).lean();

    if (!college) {
      return res.status(404).json({ success: false, message: "College not found" });
    }

    return res.json({ success: true, data: college });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCollegeSettings = async (req, res) => {
  try {
    const { name, address, website, description } = req.body;

    const college = await College.findByIdAndUpdate(
      req.user.collegeId,
      { $set: { name, address, website, description } },
      { new: true, runValidators: true }
    );

    if (!college) {
      return res.status(404).json({ success: false, message: "College not found" });
    }

    return res.json({ success: true, message: "College settings updated", data: college });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
