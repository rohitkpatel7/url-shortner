import { generateNanoId } from "../utils/helper.js";
import shortUrl from "../models/short_url.model.js";

export const createShortUrl = async (req, res) => {
  try {
    const { url, expiresInDays, alias } = req.body;
    const shortCode = alias ? alias : generateNanoId(7);

    // 🧹 Alias format validation
     if (alias) {
         const aliasRegex = /^[a-zA-Z0-9-]+$/;

         if (!aliasRegex.test(alias)) {
          return res.status(400).json({
          message: "Alias can contain only letters, numbers, and hyphens"
           });
         }
      }

  // 🔒 Check if alias already exists
    if (alias) {
       const existing = await shortUrl.findOne({ short_url: alias });
       if (existing) {
        return res.status(409).json({
        message: "Alias already in use"
        });
      }
    }

    let expiresAt = null;

    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(expiresInDays));
    }

    const newShortUrl = new shortUrl({
      full_url: url,
      short_url: shortCode,
      expiresAt,
    });

    await newShortUrl.save();

    res.status(201).json({
      short_url: shortCode,
      expiresAt,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
