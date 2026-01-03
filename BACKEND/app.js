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
// ROUTES
// =========================
app.use("/api/create", shortUrlRouter);
app.use("/api/analytics", analyticsRouter);

// =========================
// REDIRECT WITH OPTIONAL REDIS + OPTIONAL KAFKA
// =========================
app.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // 1️⃣ Redis cache check (OPTIONAL)
    let cachedUrl = null;
    if (redisClient) {
      cachedUrl = await redisClient.get(id);
    }

    if (cachedUrl) {
      // Kafka event (Redis hit) – non-blocking
      try {
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
      } catch {
        // ignore kafka failure
      }

      return res.redirect(cachedUrl);
    }

    // 2️⃣ MongoDB lookup
    const url = await urlSchema.findOne({ short_url: id });

    if (!url) {
      return res.status(404).send("Not Found");
    }

    // 3️⃣ Expiry check
    if (url.expiresAt && url.expiresAt < new Date()) {
      return res.status(410).send("Link expired");
    }

    // 4️⃣ Save to Redis (OPTIONAL)
    if (redisClient) {
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
    }

    // Kafka event (MongoDB hit) – non-blocking
    try {
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
    } catch {
      // ignore kafka failure
    }

    return res.redirect(url.full_url);

  } catch (error) {
    console.error("Redirect error:", error);
    return res.status(500).send("Server Error");
  }
});

// =========================
// SERVER START (PRODUCTION SAFE)
// =========================
const PORT = process.env.PORT || 5500;

app.listen(PORT, "0.0.0.0", async () => {
  await connectDB();

  try {
    await producer.connect();
    console.log("Kafka producer connected");
  } catch {
    console.warn("Kafka not available, running without analytics");
  }

  console.log("MongoDB connected");
  console.log("Redis optional");
  console.log(`Server running on port ${PORT}`);
});
