import "./queue/worker.js";
import { startScheduler } from "./workers/scheduler.js";
startScheduler();
console.log("worker started");
