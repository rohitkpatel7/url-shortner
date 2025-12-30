import express from "express";
import shortUrl from "../models/short_url.model.js";
import crypto from "crypto";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { url, alias, expiresInDays } = req.body;

    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }

    // Check alias uniqueness
    let shortCode = alias;
    if (shortCode) {
      const exists = await shortUrl.findOne({ short_url: shortCode });
      if (exists) {
        return res.status(409).json({ message: "Alias already in use" });
      }
    } else {
      shortCode = crypto.randomBytes(4).toString("hex");
    }

    // Expiry logic (SAFE)
    let expiresAt = null;
    if (expiresInDays) {
      const days = Number(expiresInDays);
      if (!isNaN(days) && days > 0) {
        expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      }
    }

    const newUrl = await shortUrl.create({
      full_url: url,
      short_url: shortCode,
      expiresAt,
    });

    // ✅ IMPORTANT RESPONSE (THIS WAS MISSING / BROKEN)
    return res.status(201).json({
      short_url: newUrl.short_url,
      expiresAt: newUrl.expiresAt,
    });

  } catch (error) {
    console.error("CREATE URL ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
