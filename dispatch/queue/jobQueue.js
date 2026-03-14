import { Queue } from "bullmq";
import connection from "./connection.js";

export const jobQueue = new Queue("lendWeb-jobs", {
  connection,
});
