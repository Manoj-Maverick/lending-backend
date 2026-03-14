export function formatTodayCollectionsBranchReport(branchName, todayList) {
  let msg = `🏦 *Branch:* ${branchName}\n`;
  msg += `────────────────────\n`;

  if (todayList.length === 0) {
    msg += `✅ No collections due today.\n\n`;
    return msg;
  }

  msg += `📅 *Today's Collections*\n\n`;

  todayList.forEach((c, i) => {
    msg += `*${i + 1}. ${c.full_name}*\n`;
    msg += `📞 Phone: +91${c.phone}\n`;
    msg += `💰 Amount: ₹${c.due_amount}\n`;
    msg += `📄 Loan: ${c.loan_code}\n\n`;
  });

  msg += `👥 Total Customers: ${todayList.length}\n\n`;

  return msg;
}

export function formatOverdueBranchReport(branchName, overdueList) {
  let msg = `🏦 *Branch:* ${branchName}\n`;
  msg += `────────────────────\n`;

  if (overdueList.length === 0) {
    msg += `✅ No overdue accounts.\n\n`;
    return msg;
  }

  msg += `⚠️ *Overdue Collections*\n\n`;

  overdueList.forEach((c, i) => {
    const days = Math.floor((Date.now() - new Date(c.due_date)) / 86400000);

    msg += `*${i + 1}. ${c.full_name}*\n`;
    msg += `📞 Phone: +91${c.phone}\n`;
    msg += `💰 Amount: ₹${c.due_amount}\n`;
    msg += `📄 Loan: ${c.loan_code}\n`;
    msg += `⏳ Days Overdue: ${days}\n\n`;
  });

  msg += `👥 Total Overdue Customers: ${overdueList.length}\n\n`;

  return msg;
}
