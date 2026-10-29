import Opportunity from "../models/Opportunity.js";
import Referral from "../models/Referral.js";
import MentorshipRequest from "../models/MentorshipRequest.js";

const getOpportunities = async (req, res) => {
  try {
    const opportunities = await Opportunity.find().sort({ createdAt: -1 }).populate("postedBy", "name company role");
    return res.json({ success: true, data: opportunities });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createOpportunity = async (req, res) => {
  try {
    const { title, company, type, location, description, salary, remote, tags } = req.body;

    if (!title || !company) {
      return res.status(400).json({ success: false, message: "Title and company are required" });
    }

    if (!req.user || !["alumni", "admin"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Only alumni and admins can post opportunities" });
    }

    const opportunity = await Opportunity.create({
      title,
      company,
      type: type || "Internship",
      location: location || "Remote",
      description: description || "",
      salary: salary || "",
      remote: Boolean(remote),
      tags: Array.isArray(tags) ? tags : [],
      postedBy: req.user.id,
    });

    return res.status(201).json({ success: true, message: "Opportunity created", data: opportunity });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getReferrals = async (req, res) => {
  try {
    const userId = req.user.id;
    const filter = {};
    if (req.user.role === "student") filter.student = userId;
    if (req.user.role === "alumni") filter.alumni = userId;

    const referrals = await Referral.find(filter)
      .populate("student", "name email")
      .populate("alumni", "name email company")
      .populate("opportunity", "title company type");

    return res.json({ success: true, data: referrals });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createReferral = async (req, res) => {
  try {
    const { opportunity, alumni, message } = req.body;

    if (!req.user || req.user.role !== "student") {
      return res.status(403).json({ success: false, message: "Students can request referrals" });
    }

    if (!opportunity || !alumni) {
      return res.status(400).json({ success: false, message: "Opportunity and alumni are required" });
    }

    const referral = await Referral.create({
      student: req.user.id,
      alumni,
      opportunity,
      message: message || "",
    });

    return res.status(201).json({ success: true, message: "Referral requested", data: referral });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getMentorshipRequests = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === "student") filter.student = req.user.id;
    if (req.user.role === "alumni") filter.mentor = req.user.id;

    const requests = await MentorshipRequest.find(filter)
      .populate("student", "name email")
      .populate("mentor", "name email company")
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createMentorshipRequest = async (req, res) => {
  try {
    const { mentor, topic, availableTime, message } = req.body;

    if (!req.user || req.user.role !== "student") {
      return res.status(403).json({ success: false, message: "Students can request mentorship" });
    }

    if (!mentor || !topic) {
      return res.status(400).json({ success: false, message: "Mentor and topic are required" });
    }

    const request = await MentorshipRequest.create({
      student: req.user.id,
      mentor,
      topic,
      availableTime: availableTime || "",
      message: message || "",
    });

    return res.status(201).json({ success: true, message: "Mentorship request created", data: request });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export {
  getOpportunities,
  createOpportunity,
  getReferrals,
  createReferral,
  getMentorshipRequests,
  createMentorshipRequest,
};
