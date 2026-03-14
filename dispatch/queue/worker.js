import { Worker } from "bullmq";
import connection from "./connection.js";
import { overdueChecker } from "../jobs/overdue.job.js";
function testJob(data) {
  console.log(data.a + data.b);
  console.log("test ran.");
}
const worker = new Worker(
  "lendWeb-jobs",
  async (job) => {
    switch (job.name) {
      case "test-check":
        return testJob(job.data);
      case "overDueChecker":
        return overdueChecker();
      default:
        throw new Error("Unknown job type" + job.name);
    }
  },
  { connection },
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.log(`Job ${job.id} failed`, err);
});
