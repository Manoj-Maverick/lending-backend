// import { jobQueue } from "../queue/jobQueue.js";

// export async function startScheduler() {
//   // ✅ 1. Run once immediately
//   await jobQueue.add("overDueChecker", {});

//   // ✅ 2. Setup repeat (daily at 11 PM)
//   await jobQueue.add(
//     "overDueChecker",
//     {},
//     {
//       repeat: {
//         pattern: "0 23 * * *", // 11:00 PM daily
//       },
//       jobId: "overdue-repeat-job", // 🔥 prevents duplicates
//     }
//   );

//   console.log("Scheduler started (instant + cron)");
// }
import { jobQueue } from "../queue/jobQueue.js";

export async function startScheduler() {
  // ✅ 1. Run once ONLY if not already added
  await jobQueue.add(
    "overDueChecker",
    {},
    {
      jobId: "overdue-initial-run", // 🔥 prevents duplicate instant runs
      removeOnComplete: true,
      removeOnFail: true,
    },
  );

  // ✅ 2. Setup repeat (daily)
  await jobQueue.add(
    "overDueChecker",
    {},
    {
      jobId: "overdue-repeat-job", // 🔥 prevents duplicate cron jobs
      repeat: {
        pattern: "0 23 * * *",
      },
      removeOnComplete: true,
      removeOnFail: true,
    },
  );

  console.log("✅ Scheduler started (safe)");
}
