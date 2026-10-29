import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

import User from "../models/User.js";
import College from "../models/College.js";
import InvitationCode from "../models/InvitationCode.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const hashInvitationCode = (code) =>
  crypto
    .createHash("sha256")
    .update(code.trim().toUpperCase())
    .digest("hex");

const createAppToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from server/.env");
  }

  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      collegeId: user.collegeId?._id || user.collegeId,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

const userResponse = (user, collegeName = "") => ({
  _id: user._id,
  userId: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  collegeId: String(user.collegeId?._id || user.collegeId),
  collegeName: collegeName || user.collegeId?.name || "",
  verificationStatus: user.verificationStatus,
  profilePhoto: user.profilePhoto || "",
});

const sendAuthSuccess = async (res, user, status = 200) => {
  const populatedUser = await User.findById(user._id).populate(
    "collegeId",
    "name status"
  );

  if (!populatedUser) {
    return res.status(404).json({
      success: false,
      message: "User account was not found.",
    });
  }

  const college = populatedUser.collegeId;

  if (!college || college.status !== "active") {
    return res.status(403).json({
      success: false,
      message: "Your college is inactive or unavailable.",
    });
  }

  return res.status(status).json({
    success: true,
    message: "Google authentication successful.",
    token: createAppToken(populatedUser),
    user: userResponse(populatedUser, college.name),
  });
};

// --------------------------------------------------
// VALIDATE COLLEGE INVITATION CODE
// --------------------------------------------------

const getValidInvitation = async (code, role) => {
  if (!code?.trim()) return null;

  const now = new Date();

  return InvitationCode.findOne({
    codeHash: hashInvitationCode(code),
    active: true,
    allowedRoles: role,
    $and: [
      {
        $or: [
          { expiresAt: null },
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: now } },
        ],
      },
      {
        $or: [
          { maxUses: { $exists: false } },
          { $expr: { $lt: ["$usedCount", "$maxUses"] } },
        ],
      },
    ],
  });
};

// --------------------------------------------------
// GOOGLE STUDENT / ALUMNI REGISTRATION
// --------------------------------------------------

const registerGoogleStudentOrAlumni = async ({
  googleProfile,
  role,
  invitationCode,
}) => {
  if (!["student", "alumni"].includes(role)) {
    const error = new Error("Select student or alumni to register.");
    error.status = 400;
    throw error;
  }

  if (!invitationCode?.trim()) {
    const error = new Error("Your college invitation code is required.");
    error.status = 400;
    throw error;
  }

  const invitation = await getValidInvitation(invitationCode, role);

  if (!invitation) {
    const error = new Error(
      "Invalid, expired, exhausted, or unauthorized college invitation code."
    );
    error.status = 400;
    throw error;
  }

  const college = await College.findOne({
    _id: invitation.collegeId,
    status: "active",
  });

  if (!college) {
    const error = new Error("The invitation's college is unavailable.");
    error.status = 400;
    throw error;
  }

  // Reserve one use of the invitation only if it is still valid.
  const now = new Date();

  const updatedInvitation = await InvitationCode.findOneAndUpdate(
    {
      _id: invitation._id,
      active: true,
      allowedRoles: role,
      $and: [
        {
          $or: [
            { expiresAt: null },
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: now } },
          ],
        },
        {
          $or: [
            { maxUses: { $exists: false } },
            { $expr: { $lt: ["$usedCount", "$maxUses"] } },
          ],
        },
      ],
    },
    { $inc: { usedCount: 1 } },
    { new: true }
  );

  if (!updatedInvitation) {
    const error = new Error("This invitation code is no longer available.");
    error.status = 400;
    throw error;
  }

  try {
    // Google users do not need a password to sign in with Google.
    // The random password satisfies the current User schema.
    const randomPassword = crypto.randomBytes(32).toString("hex");
    const hashedPassword = await bcrypt.hash(randomPassword, 12);

    const user = await User.create({
      name: googleProfile.name,
      email: googleProfile.email,
      password: hashedPassword,
      role,
      collegeId: college._id,
      verificationStatus: "pending",
      googleId: googleProfile.sub,
      profilePhoto: googleProfile.picture || "",
    });

    return user;
  } catch (error) {
    await InvitationCode.updateOne(
      {
        _id: updatedInvitation._id,
        usedCount: { $gt: 0 },
      },
      { $inc: { usedCount: -1 } }
    ).catch(() => {});

    throw error;
  }
};

// --------------------------------------------------
// GOOGLE ADMIN REGISTRATION
// --------------------------------------------------

const registerGoogleAdmin = async ({
  googleProfile,
  collegeName,
  collegeAddress,
  adminInvitationCode,
}) => {
  if (!collegeName?.trim() || !adminInvitationCode?.trim()) {
    const error = new Error(
      "College name and admin invitation code are required."
    );
    error.status = 400;
    throw error;
  }

  if (
    adminInvitationCode.trim().length < 4 ||
    adminInvitationCode.trim().length > 64
  ) {
    const error = new Error(
      "The admin invitation code must be between 4 and 64 characters."
    );
    error.status = 400;
    throw error;
  }

  const codeHash = hashInvitationCode(adminInvitationCode);

  const existingCode = await InvitationCode.findOne({ codeHash });

  if (existingCode) {
    const error = new Error(
      "This invitation code is already in use. Choose a different one."
    );
    error.status = 409;
    throw error;
  }

  let college;
  let admin;

  try {
    college = await College.create({
      name: collegeName.trim(),
      address: collegeAddress?.trim() || "",
      status: "active",
    });

    const randomPassword = crypto.randomBytes(32).toString("hex");
    const hashedPassword = await bcrypt.hash(randomPassword, 12);

    admin = await User.create({
      name: googleProfile.name,
      email: googleProfile.email,
      password: hashedPassword,
      role: "admin",
      collegeId: college._id,
      verificationStatus: "verified",
      googleId: googleProfile.sub,
      profilePhoto: googleProfile.picture || "",
    });

    await InvitationCode.create({
      collegeId: college._id,
      codeHash,
      allowedRoles: ["student", "alumni"],
      active: true,
      expiresAt: null,
      usedCount: 0,
      maxUses: 1000,
    });

    if (College.schema.path("createdBy")) {
      await College.updateOne(
        { _id: college._id },
        { $set: { createdBy: admin._id } }
      );
    }

    return admin;
  } catch (error) {
    if (admin) {
      await User.deleteOne({ _id: admin._id }).catch(() => {});
    }

    if (college) {
      await InvitationCode.deleteMany({
        collegeId: college._id,
      }).catch(() => {});

      await College.deleteOne({ _id: college._id }).catch(() => {});
    }

    throw error;
  }
};

// --------------------------------------------------
// GOOGLE AUTHENTICATION
// --------------------------------------------------

export const googleAuth = async (req, res) => {
  try {
    const {
      credential,
      action,
      role,
      invitationCode,
      collegeName,
      collegeAddress,
      adminInvitationCode,
    } = req.body;

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: "GOOGLE_CLIENT_ID is missing from server/.env",
      });
    }

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required.",
      });
    }

    if (!["login", "register"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be login or register.",
      });
    }

    // Verify the Google identity on the server.
    let ticket;

    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (error) {
      const invalidCredential =
        /Wrong number of segments|Can't parse token|No pem found|Invalid token signature|No issue time in token|No expiration time in token|using invalid format|Expiration time too far in future|Token used too early|Token used too late|Invalid issuer|Wrong recipient/i.test(
          error.message || ""
        );

      if (invalidCredential) {
        return res.status(401).json({
          success: false,
          message:
            "Google credential is invalid for this application. Check the Google OAuth client ID and authorized JavaScript origins.",
        });
      }

      console.error("Google credential verification failed:", {
        name: error.name,
        code: error.code,
        status: error.response?.status,
      });

      return res.status(502).json({
        success: false,
        message: "Google could not verify your account right now. Please try again.",
      });
    }

    const payload = ticket.getPayload();

    if (
      !payload?.sub ||
      !payload.email ||
      payload.email_verified !== true
    ) {
      return res.status(401).json({
        success: false,
        message: "Google did not provide a verified email address.",
      });
    }

    const googleProfile = {
      sub: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name || payload.email.split("@")[0],
      picture: payload.picture || "",
    };

    const user = await User.findOne({
      email: googleProfile.email,
    });

    // ----------------------------------------------
    // EXISTING USER LOGIN
    // ----------------------------------------------

    if (action === "login") {
      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "No Alumni Nexus account exists for this Google email. Register first.",
        });
      }

      if (user.googleId && user.googleId !== googleProfile.sub) {
        return res.status(409).json({
          success: false,
          message:
            "This account is linked to a different Google identity.",
        });
      }

      if (!user.googleId) {
        user.googleId = googleProfile.sub;
        await user.save();
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "This account is inactive.",
        });
      }

      return await sendAuthSuccess(res, user);
    }

    // ----------------------------------------------
    // NEW GOOGLE REGISTRATION
    // ----------------------------------------------

    if (user) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists. Please log in instead.",
      });
    }

    // FIRST REQUEST: no role is required yet.
    // Verify Google, return the profile, and let the frontend
    // display its role-selection form.
    if (!role) {
      return res.status(200).json({
        success: true,
        isNewUser: true,
        googleProfile: {
          sub: googleProfile.sub,
          name: googleProfile.name,
          email: googleProfile.email,
          picture: googleProfile.picture,
        },
      });
    }

    // SECOND REQUEST: the user has selected a role.
    if (!["student", "alumni", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Select a valid role: student, alumni, or admin.",
      });
    }

    let registeredUser;

    if (role === "admin") {
      registeredUser = await registerGoogleAdmin({
        googleProfile,
        collegeName,
        collegeAddress,
        adminInvitationCode,
      });
    } else {
      registeredUser = await registerGoogleStudentOrAlumni({
        googleProfile,
        role,
        invitationCode,
      });
    }

    return await sendAuthSuccess(res, registeredUser, 201);
  } catch (error) {
    console.error("Google authentication error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email or Google identity already exists.",
      });
    }

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Google authentication failed.",
    });
  }
};