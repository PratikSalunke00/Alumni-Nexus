import express from "express";
import crypto from "crypto";

const router = express.Router();

router.get("/imagekit-auth/auth", (req, res) => {
  try {
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

    if (!publicKey || !privateKey) {
      return res.status(500).json({
        message: "ImageKit environment variables are missing",
      });
    }

    const token = crypto.randomUUID();
    const expire = Math.floor(Date.now() / 1000) + 30 * 60;

    const signature = crypto
      .createHmac("sha1", privateKey)
      .update(token + expire)
      .digest("hex");

    return res.json({
      token,
      expire,
      signature,
      publicKey,
    });
  } catch (error) {
    console.error("ImageKit authentication error:", error);
    return res.status(500).json({
      message: "Failed to generate ImageKit authentication",
    });
  }
});

export default router;