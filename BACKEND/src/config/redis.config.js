import Redis from "ioredis";

let redisClient = null;

if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL);

    redisClient.on("connect", () => {
      console.log("Redis connected");
    });

    redisClient.on("error", (err) => {
      console.log("Redis Error:", err.message);
    });
  } catch (err) {
    console.log("Redis disabled");
  }
} else {
  console.log("Redis URL not provided, skipping Redis");
}

export default redisClient;
