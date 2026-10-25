
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import College from "../models/College.js";
import InvitationCode from "../models/InvitationCode.js";

const hashInvitationCode = (code) =>
  crypto
    .createHash("sha256")
    .update(code.trim().toUpperCase())
    .digest("hex");

const createToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      collegeId: user.collegeId,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

const validateCredentials = ({ name, email, password }) => {
  if (!name?.trim() || !email?.trim() || !password) {
    return "Name, email, and password are required.";
  }

  if (password.length < 8) {
    return "Password must contain at least 8 characters.";
  }

  return null;
};

const invitationFilter = (code, role) => ({
  codeHash: hashInvitationCode(code),
  active: true,
  allowedRoles: role,
  $or: [
    { expiresAt: null },
    { expiresAt: { $exists: false } },
    { expiresAt: { $gt: new Date() } },
  ],
  $expr: { $lt: ["$usedCount", "$maxUses"] },
});

// STUDENT AND ALUMNI REGISTRATION
const registerWithInvitation = async (req, res, role) => {
  let reservedInvitationId = null;

  try {
    const { name, email, password, invitationCode } = req.body;

    const validationError = validateCredentials({
      name,
      email,
      password,
    });

    if (validationError || !invitationCode?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          validationError ||
          "Name, email, password, and invitation code are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const filter = invitationFilter(invitationCode, role);
    const invitation = await InvitationCode.findOne(filter);

    if (!invitation) {
      return res.status(400).json({
        success: false,
        message: "Invalid, expired, or unavailable invitation code.",
      });
    }

    const college = await College.findOne({
      _id: invitation.collegeId,
      status: "active",
    });

    if (!college) {
      return res.status(400).json({
        success: false,
        message: "This college is inactive or unavailable.",
      });
    }

    // Atomically reserve one use of the invitation code.
    const reserved = await InvitationCode.findOneAndUpdate(
      filter,
      { $inc: { usedCount: 1 } },
      { new: true }
    );

    if (!reserved) {
      return res.status(400).json({
        success: false,
        message: "The invitation code is no longer available.",
      });
    }

    reservedInvitationId = reserved._id;

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      collegeId: college._id,
      verificationStatus: "pending",
    });

    const token = createToken(user);

    return res.status(201).json({
      success: true,
      message:
        role === "student"
          ? "Student registered successfully."
          : "Alumni registered successfully.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        collegeId: user.collegeId,
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (error) {
    if (reservedInvitationId) {
      await InvitationCode.updateOne(
        {
          _id: reservedInvitationId,
          usedCount: { $gt: 0 },
        },
        { $inc: { usedCount: -1 } }
      ).catch(() => {});
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    console.error(`${role} registration error:`, error);

    return res.status(500).json({
      success: false,
      message: `${role === "student" ? "Student" : "Alumni"} registration failed.`,
    });
  }
};

export const registerStudent = (req, res) =>
  registerWithInvitation(req, res, "student");

export const registerAlumni = (req, res) =>
  registerWithInvitation(req, res, "alumni");

// COLLEGE ADMIN REGISTRATION
export const registerAdmin = async (req, res) => {
  let collegeId = null;
  let adminId = null;

  try {
    const {
      name,
      email,
      password,
      collegeName,
      collegeAddress,
      adminInvitationCode,
    } = req.body;

    const validationError = validateCredentials({
      name,
      email,
      password,
    });

    if (
      validationError ||
      !collegeName?.trim() ||
      !adminInvitationCode?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          validationError ||
          "College name and your chosen invitation code are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const plainCode = adminInvitationCode.trim();

    if (plainCode.length < 4 || plainCode.length > 64) {
      return res.status(400).json({
        success: false,
        message: "Invitation code must contain 4 to 64 characters.",
      });
    }

    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const codeHash = hashInvitationCode(plainCode);

    if (await InvitationCode.exists({ codeHash })) {
      return res.status(409).json({
        success: false,
        message: "This invitation code is already in use. Choose another.",
      });
    }

    const college = await College.create({
      name: collegeName.trim(),
      address: collegeAddress?.trim() || "",
      status: "active",
    });

    collegeId = college._id;

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "admin",
      collegeId: college._id,
      verificationStatus: "verified",
    });

    adminId = admin._id;

    if (College.schema.path("createdBy")) {
      await College.updateOne(
        { _id: college._id },
        { $set: { createdBy: admin._id } }
      );
    }

    await InvitationCode.create({
      collegeId: college._id,
      codeHash,
      active: true,
      allowedRoles: ["student", "alumni"],
      expiresAt: null,
      usedCount: 0,
      maxUses: 1000,
    });

    return res.status(201).json({
      success: true,
      message: "College and admin account created successfully.",
      // Return the code entered by the admin; only its hash is stored.
      invitationCode: plainCode,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        collegeId: college._id,
      },
    });
  } catch (error) {
    // Roll back records created during this registration attempt.
    if (adminId) {
      await User.deleteOne({ _id: adminId }).catch(() => {});
    }

    if (collegeId) {
      await InvitationCode.deleteMany({ collegeId }).catch(() => {});
      await College.deleteOne({ _id: collegeId }).catch(() => {});
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "The email, college name, or invitation code already exists.",
      });
    }

    console.error("Admin registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Admin registration failed.",
    });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    })
      .select("+password")
      .populate("collegeId", "name status");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "This account is inactive.",
      });
    }

    if (!user.collegeId || user.collegeId.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your college is inactive or unavailable.",
      });
    }

    const token = createToken({
      ...user.toObject(),
      collegeId: user.collegeId._id,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        collegeId: user.collegeId._id,
        collegeName: user.collegeId.name,
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};

// UPDATE USER PROFILE
export const updateUser = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
    }

    const allowedFields = [
      "name",
      "phone",
      "branch",
      "graduationYear",
      "company",
      "jobTitle",
      "skills",
      "bio",
      "profilePhoto",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid profile fields provided.",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        collegeId: user.collegeId,
        verificationStatus: user.verificationStatus,
        phone: user.phone,
        branch: user.branch,
        graduationYear: user.graduationYear,
        company: user.company,
        jobTitle: user.jobTitle,
        skills: user.skills,
        bio: user.bio,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile.",
    });
  }
};
