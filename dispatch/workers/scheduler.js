import { jobQueue } from "../queue/jobQueue.js";

export async function startScheduler() {
  // ✅ 1. Run once immediately
  await jobQueue.add("overDueChecker", {});

  // ✅ 2. Setup repeat (daily at 11 PM)
  await jobQueue.add(
    "overDueChecker",
    {},
    {
      repeat: {
        pattern: "0 23 * * *", // 11:00 PM daily
      },
      jobId: "overdue-repeat-job", // 🔥 prevents duplicates
    }
  );

  console.log("Scheduler started (instant + cron)");
}