import express from "express";
import pool from "./db.js";
import cors from "cors";
import { login, logout, getMe } from "./Routes/auth.controller.js";
import { requireAuth, requireRole } from "./Routes/auth.middleware.js";
import {
  addUser,
  getUsers,
  loadSettings,
  updateSettings,
} from "./Routes/settings.js";
import { getBranches } from "./services/branch.service.js";
import { getBranchById } from "./services/branch.details.page/getBranchByID.js";
import { getBranchPerformance } from "./services/branch.details.page/getBranchPerformance.js";
import { getBranchStaff } from "./services/branch.details.page/getBranchStaff.js";
import { getWeeklyLoanSummaryByBranch } from "./services/branch.details.page/getWeeklyLoanSummaryByBranch.js";
import { getBranchCustomers } from "./services/branch.details.page/getBranchCustomers.js";
import { getClientsList } from "./services/clients.management.page/getClientsList.js";
import { getCustomerProfile } from "./services/clients.profile.page/getClientsProfileInfo.js";
import { getCustomerGuarantors } from "./services/clients.profile.page/getClientGuarantorsInfo.js";
import { getCustomerLoans } from "./services/clients.profile.page/getClientLoans.js";
import { getClientsLoansList } from "./services/loans.management.page/getClientsLoans.js";
import { getLoansManagementStats } from "./services/loans.management.page/getClientsLoansStatsByBranch.js";
import { getDashboardKpis } from "./services/dashboard.page/getDashboardKpis.js";
import { getLoanProfileInfo } from "./services/loans.details.page/getLoanProfileInfo.js";
import { getLoanSchedule } from "./services/loans.details.page/getLoanSchedule.js";
import { getStaffsList } from "./services/staffs-management.page/getStaffsList.js";
import cookieParser from "cookie-parser";
const app = express();

// Middleware
app.use(cookieParser());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());

// Auth routes
app.post("/api/auth/login", login);
app.post("/api/auth/logout", logout);
app.get("/api/auth/me", getMe);

// user crud routes
app.post("/api/users/create", requireAuth, requireRole(["ADMIN"]), addUser);
app.get("/api/users", getUsers);

app.get("/test-db", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      status: "DB connected",
      time: result.rows[0],
    });
  } catch (error) {
    console.log("Database connection error:", error);
    res.status(500).json({
      status: "DB connection error",
      error: error.message,
    });
  }
});

// core logic routes

app.get("/api/branches", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT * FROM get_branches($1);
    `,
      [req.query.branch],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch branches", err);
    res.status(500).json({ error: "Failed to fetch branches" });
  }
});

// dashboard summary route (KPIs)
app.get("/api/dashboard/summary", getDashboardKpis);

// branch management page routes
app.get("/api/branch-management/list", getBranches);

// branch deatils page routes
app.get("/api/branch-details/:branchId", getBranchById);
app.get(
  "/api/branch-details/performance-metrics/:branchId",
  getBranchPerformance,
);
app.get("/api/branch-details/staffList/:branchId", getBranchStaff);
app.get(
  "/api/branch-details/weekly-loan-summary/:branchId",
  getWeeklyLoanSummaryByBranch,
);
app.get("/api/branch-details/customers/:branchId", getBranchCustomers);

// client management page routes
app.get("/api/clients-management/clients-list", getClientsList);

// client profile page routes
app.get("/api/client-profile/:id/profile", getCustomerProfile);
app.get("/api/client-profile/:customerId/guarantors", getCustomerGuarantors);
app.get("/api/client-profile/:customerId/loans", getCustomerLoans);

// loan management page routes
app.get("/api/loans-management/loans-list", getClientsLoansList);
app.get("/api/loans-management/stats", getLoansManagementStats);

// loan details page routes
app.get("/api/loans/:loanId/details", getLoanProfileInfo);
app.get("/api/loans/:loanId/schedule", getLoanSchedule);

// staffs management page routes
app.get("/api/staffs-management/staffs-list", getStaffsList);
// settings page routes
app.get("/api/settings", loadSettings);
app.post("/api/settings", requireAuth, requireRole(["ADMIN"]), updateSettings);

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
