import express from "express";
import Analytics from "../models/analytics.model.js";

const router = express.Router();

router.get("/:shortId", async (req, res) => {
  try {
    const { shortId } = req.params;

    const analytics = await Analytics.find({ shortId });

    const totalClicks = analytics.length;
    const redisClicks = analytics.filter(a => a.source === "redis").length;
    const mongoClicks = analytics.filter(a => a.source === "mongodb").length;

    res.json({
      shortId,
      totalClicks,
      redis: redisClicks,
      mongodb: mongoClicks,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
