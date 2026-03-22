import Redis from "ioredis";
const REDIS_URL =
  "redis://default:gQAAAAAAATZQAAIncDE4MWVlNzFjMDRjYTY0MjM4ODk2MjQ2NmZkNDljM2YxZnAxNzk0NDA@peaceful-falcon-79440.upstash.io:6379";
// const connection = new IORedis({
//   host: "127.0.0.1",
//   port: 6379,
//   maxRetriesPerRequest: null,
// });

// export default connection;

const connection = new Redis(process.env.REDIS_URL, {
  tls: {}, // 🔥 IMPORTANT for Upstash
});

connection.on("connect", () => {
  console.log("✅ Redis connected");
});

connection.on("error", (err) => {
  console.error("❌ Redis error:", err);
});

export default connection;
