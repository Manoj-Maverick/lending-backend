import { jobQueue } from "../queue/jobQueue.js";
export async function startScheduler() {
  await jobQueue.add(
    "overDueChecker",
    {},
    {
      repeat: {
        pattern: "0 23 * * *",
      },
    },
  );

  console.log("Scheduler started");
}
