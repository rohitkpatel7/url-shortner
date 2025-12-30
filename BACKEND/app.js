import express from "express";
import dotenv from "dotenv";

import analyticsRouter from "./src/routes/analytics.route.js";
import connectDB from "./src/config/monogo.config.js";
import redisClient from "./src/config/redis.config.js";
import { producer } from "./src/config/kafka.config.js";

import shortUrlRouter from "./src/routes/short_url.route.js";
import urlSchema from "./src/models/short_url.model.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// CREATE SHORT URL
// =========================
app.use("/api/create", shortUrlRouter);
app.use("/api/analytics", analyticsRouter);

// =========================
// REDIRECT WITH REDIS + EXPIRY + KAFKA
// =========================
app.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // 1️⃣ Redis check
    const cachedUrl = await redisClient.get(id);

    if (cachedUrl) {
      // Kafka event (Redis hit)
      await producer.send({
        topic: "url_clicks",
        messages: [
          {
            value: JSON.stringify({
              shortId: id,
              source: "redis",
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });

      return res.redirect(cachedUrl);
    }

    // 2️⃣ MongoDB lookup
    const url = await urlSchema.findOne({ short_url: id });

    if (!url) {
      return res.status(404).send("Not Found");
    }

    // 🔥 EXPIRY CHECK
    if (url.expiresAt && url.expiresAt < new Date()) {
      return res.status(410).send("Link expired");
    }

    // 3️⃣ Save to Redis with TTL
    let ttlInSeconds = null;

    if (url.expiresAt) {
      const diffMs = url.expiresAt.getTime() - Date.now();
      ttlInSeconds = Math.floor(diffMs / 1000);
    }

    if (ttlInSeconds && ttlInSeconds > 0) {
      await redisClient.set(id, url.full_url, { EX: ttlInSeconds });
    } else {
      await redisClient.set(id, url.full_url);
    }

    // Kafka event (MongoDB hit)
    await producer.send({
      topic: "url_clicks",
      messages: [
        {
          value: JSON.stringify({
            shortId: id,
            source: "mongodb",
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });

    res.redirect(url.full_url);

  } catch (error) {
    console.error("Redirect error:", error);
    res.status(500).send("Server Error");
  }
});

// =========================
// SERVER START
// =========================
const PORT = process.env.PORT || 5500;

app.listen(PORT, "0.0.0.0", async () => {
  await connectDB();
  await producer.connect();

  console.log("MongoDB connected");
  console.log("Redis connected");
  console.log("Kafka producer connected");
  console.log(`Server running on port ${PORT}`);
});
