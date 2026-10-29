import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

// ──────────────────────────────────────────────
// CHANGE PASSWORD (authenticated)
// ──────────────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current and new password required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters" });
    }

    const user = await User.findById(userId).select("+password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ success: false, message: "Current password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("changePassword error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// FORGOT PASSWORD — generate reset token
// ──────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // Always return success to prevent user enumeration
    if (!user) {
      return res.json({ success: true, message: "If an account exists, a reset link has been sent" });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = expiresAt;
    await user.save({ validateBeforeSave: false });

    // In a real deployment, send this via nodemailer. For now, return in response for development.
    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password/${rawToken}`;

    // TODO: replace with nodemailer email send
    console.log(`\n[DEV] Password reset link for ${email}:\n${resetUrl}\n`);

    return res.json({
      success: true,
      message: "If an account exists, a reset link has been sent",
      // Remove devResetUrl in production
      ...(process.env.NODE_ENV !== "production" && { devResetUrl: resetUrl }),
    });
  } catch (error) {
    console.error("forgotPassword error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// RESET PASSWORD — consume token
// ──────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }

    user.password = await bcrypt.hash(password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.json({ success: true, message: "Password reset successfully. You can now log in." });
  } catch (error) {
    console.error("resetPassword error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// LOGOUT — client-side token removal (stateless JWT)
// ──────────────────────────────────────────────
export const logout = async (req, res) => {
  // With stateless JWT there is nothing server-side to invalidate.
  // The client must delete the token. This endpoint exists for consistency
  // and future refresh-token blacklisting.
  return res.json({ success: true, message: "Logged out successfully" });
};
