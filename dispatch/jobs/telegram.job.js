import db from "../../db.js";
import { TODAY_COLLECTION_QUERY } from "../reports/queries/collection.query.js";
import { OVERDUE_COLLECTION_QUERY } from "../reports/queries/overdue.query.js";
import { sendTelegramMessage } from "../services/telegram.service.js";
import { formatTodayCollectionsBranchReport } from "../reports/formatters/telegram.formatters.js";
import { formatOverdueBranchReport } from "../reports/formatters/telegram.formatters.js";
export async function SendTodayReport() {
  const { rows } = await db.query(TODAY_COLLECTION_QUERY);

  const today = new Date();
  const dateStr = today.toLocaleDateString();
  const dayStr = today.toLocaleDateString("en-IN", { weekday: "long" });

  let message = `🌅 *Good Morning Team*\n\n`;
  message += `📊 *Daily Collection Report*\n`;
  message += `📅 Date: ${dateStr}\n`;
  message += `📆 Day: ${dayStr}\n\n`;

  if (!rows.length) {
    message += `✅ *Great news!*\n`;
    message += `There are *no collections scheduled for today* across all branches.\n\n`;
    message += `Keep up the good work! 👍`;

    await sendTelegramMessage(-5147257265, message);
    return;
  }

  const branchMap = {};

  rows.forEach((row) => {
    if (!branchMap[row.branch_id]) {
      branchMap[row.branch_id] = {
        name: row.branch_name,
        today: [],
      };
    }

    branchMap[row.branch_id].today.push(row);
  });

  for (const branch of Object.values(branchMap)) {
    message += formatTodayCollectionsBranchReport(branch.name, branch.today);
  }

  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📢 *Please ensure today's collections are completed on time.*\n`;

  await sendTelegramMessage(-5147257265, message);
}

export async function SendOverdueReport() {
  const { rows } = await db.query(OVERDUE_COLLECTION_QUERY);
  const today = new Date();
  const dateStr = today.toLocaleDateString();
  const dayStr = today.toLocaleDateString("en-IN", { weekday: "long" });

  let message = `🚨 *Overdue Collection Alert*\n\n`;
  message += `📅 Date: ${dateStr}\n`;
  message += `📆 Day: ${dayStr}\n\n`;

  if (!rows.length) {
    message += `✅ *Great job team!*\n`;
    message += `There are *no overdue collections pending* across all branches.\n`;

    await sendTelegramMessage(-5147257265, message);
    return;
  }

  const branchMap = {};

  rows.forEach((row) => {
    if (!branchMap[row.branch_id]) {
      branchMap[row.branch_id] = {
        name: row.branch_name,
        overdue: [],
      };
    }

    branchMap[row.branch_id].overdue.push(row);
  });

  for (const branch of Object.values(branchMap)) {
    message += formatOverdueBranchReport(branch.name, branch.overdue);
  }

  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📢 *Please prioritize overdue collections today.*\n`;

  await sendTelegramMessage(-5147257265, message);
}
