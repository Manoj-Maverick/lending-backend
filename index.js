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
} from "./services/settings.page/settings.js";
import { getBranches } from "./services/branches.management.page/getBranchesList.js";
import { getBranchById } from "./services/branch.details.page/getBranchByID.js";
import { getBranchPerformance } from "./services/branch.details.page/getBranchPerformance.js";
import { getBranchStaff } from "./services/branch.details.page/getBranchStaff.js";
import { getWeeklyLoanSummaryByBranch } from "./services/branch.details.page/getWeeklyLoanSummaryByBranch.js";
import { getBranchCustomers } from "./services/branch.details.page/getBranchCustomers.js";
import { getClientsList as getBorrowersList } from "./services/clients.management.page/getClientsList.js";
import { getCustomerProfile as getBorrowerProfile } from "./services/clients.profile.page/getClientsProfileInfo.js";
import { getCustomerGuarantors as getBorrowerGuarantors } from "./services/clients.profile.page/getClientGuarantorsInfo.js";
import { getCustomerLoans as getBorrowerLoans } from "./services/clients.profile.page/getClientLoans.js";
import { getClientsLoansList as getBorrowerLoansList } from "./services/loans.management.page/getClientsLoans.js";
import { getLoansManagementStats } from "./services/loans.management.page/getClientsLoansStatsByBranch.js";
import { getDashboardKpis } from "./services/dashboard.page/getDashboardKpis.js";
import { getLoanProfileInfo } from "./services/loans.details.page/getLoanProfileInfo.js";
import { getLoanSchedule } from "./services/loans.details.page/getLoanSchedule.js";
import { getStaffsList } from "./services/staffs-management.page/getStaffsList.js";
import { createBranch } from "./services/branches.management.page/createBranch.js";
import { updateBranch } from "./services/branch.details.page/updateBranch.js";
import { upload } from "./Routes/multer.js";
import { createCustomer as createBorrower } from "./services/clients.management.page/createClient.js";
import { createLoan } from "./services/clients.profile.page/createNewLoan.js";
import { recordPayment } from "./services/loans.details.page/recordPayment.js";
import { getTodayCollections } from "./services/todayCollections.page/getTodayCollections.js";
import { getWeeklyCollection } from "./services/dashboard.page/getDailyCollectionSummary.js";
import { getTodayPayments } from "./services/dashboard.page/getTodayPaymentsDueTableData.js";
import { getBranchComparison } from "./services/dashboard.page/getBranchComparison.js";
import { getBranchTodayPayments } from "./services/loans.details.page/getBranchTodayPayments.js";
import { forecloseLoan } from "./services/loans.details.page/foreCloseLoan.js";
import { sendOtp, verifyOtp } from "./services/others.services/otp.service.js";
import { generateNewBranchCode } from "./services/generators.services/newBranchCode.js";
import { generateNewCustomerCode } from "./services/generators.services/newCustomerCode.js";
import { generateNewLoanCode } from "./services/generators.services/newLoanCode.js";
import {
  fetchCustomerDocuments,
  fetchGuarantorDocuments,
  fetchLoanDocuments,
} from "./services/document.controller.js";
import {
  uploadDocument,
  deleteDocument,
} from "./services/document.controller.js";
import {
  blockCustomer,
  getBlockStatus,
} from "./services/clients.profile.page/blockCustomer.js";
import { getBorrowerStats } from "./services/clients.management.page/getClientsManagemnetKpis.js";
import { getOverdueCount } from "./services/todayCollections.page/getOverDueCount.js";
import { getOverdueCollections } from "./services/todayCollections.page/getOverDueCollections.js";
import path from "path";
import cookieParser from "cookie-parser";
const app = express();

// Middleware
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(express.json());

// health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

// Auth routes
app.post("/api/auth/login", login);
app.post("/api/generateOTP", sendOtp);
app.post("/api/verifyOTP", verifyOtp);

// Protect all remaining API routes by default.
// app.use("/api", requireAuth);

app.post("/api/auth/logout", logout);
app.get("/api/auth/me", getMe);

// user crud routes
app.post("/api/users/create", requireAuth, requireRole(["ADMIN"]), addUser);
app.get("/api/users", requireRole(["ADMIN"]), getUsers);

app.get("/test-db", async (req, res) => {
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
app.get("/api/dashboard/daily-collection-summary", getWeeklyCollection);
app.get("/api/dashboard/today-payments", getTodayPayments);
app.get("/api/dashboard/branch-comparison", getBranchComparison);

// branch management page routes
app.get("/api/branch-management/list", getBranches);
app.post("/api/create-new-branch", createBranch);
// branch deatils page routes
app.get("/api/branch-details/:branchId", getBranchById);
app.get(
  "/api/branch-deatils/get-branch-today-payments",
  getBranchTodayPayments,
);
app.get(
  "/api/branch-details/performance-metrics/:branchId",
  getBranchPerformance,
);
app.get("/api/branch-details/staffList/:branchId", getBranchStaff);
app.get(
  "/api/branch-details/weekly-loan-summary/:branchId",
  getWeeklyLoanSummaryByBranch,
);
app.post("/api/branch-details/borrowers/:branchId", getBranchCustomers);

// borrower management page routes
app.get("/api/borrowers-management/borrowers-list", getBorrowersList);
app.post(
  "/api/borrowers/create",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "idProof", maxCount: 1 },
    { name: "addressProof", maxCount: 1 },
    { name: "incomeProof", maxCount: 1 },
  ]),
  createBorrower,
);
app.get("/api/borrowers/stats", getBorrowerStats);

// borrower profile page routes
app.get("/api/borrower-profile/:borrowerId/profile", getBorrowerProfile);
app.get("/api/borrower-profile/:borrowerId/guarantors", getBorrowerGuarantors);
app.get("/api/borrower-profile/:borrowerId/loans", getBorrowerLoans);
app.post("/api/loans/create", upload.none(), createLoan);
app.post("/api/loans/record-payment", recordPayment);
app.put("/api/customers/:customerId/block", blockCustomer);
app.get("/api/get-block-status/:customerId/isBlocked", getBlockStatus);
// loan management page routes
app.get("/api/loans-management/loans-list", getBorrowerLoansList);
app.get("/api/loans-management/stats", getLoansManagementStats);

// loan details page routes
app.get("/api/loans/:loanId/details", getLoanProfileInfo);
app.get("/api/loans/:loanId/schedule", getLoanSchedule);
app.put("/api/update-branch/:id", updateBranch);
app.post("/api/loans/:loanId/fore-close-loan", forecloseLoan);

// today collections page routes
app.get("/api/today-collections", getTodayCollections);
app.get("/api/collections/overdue-count", getOverdueCount);
app.get("/api/collections/overdue", getOverdueCollections);
// staffs management page routes
app.get("/api/staffs-management/staffs-list", getStaffsList);
// settings page routes
app.get("/api/settings", requireRole(["ADMIN"]), loadSettings);
app.post("/api/settings", requireRole(["ADMIN"]), updateSettings);

//generators routes
app.post("/api/generate-next-branch-code", generateNewBranchCode);
app.post("/api/generate-next-customer-code", generateNewCustomerCode);
app.post("/api/generate-next-loan-code", generateNewLoanCode);

// documents route
app.get("/api/documents/customer/:customerId", fetchCustomerDocuments);
app.get("/api/documents/guarantor/:guarantorId", fetchGuarantorDocuments);
app.get("/api/documents/loan/:loanId", fetchLoanDocuments);
app.post("/api/documents", upload.single("file"), uploadDocument);

app.delete("/api/documents/:id", deleteDocument);

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
