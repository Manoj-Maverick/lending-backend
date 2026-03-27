import db from "../../db.js";

export async function reviewLoanRequest(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const loanId = Number(req.params.loanId);
    const action = String(req.body.action || "").toUpperCase();
    const rejectionReason = req.body.rejectionReason?.trim() || null;

    if (!loanId || Number.isNaN(loanId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid loan id",
      });
    }

    if (!["APPROVE", "REJECT"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review action",
      });
    }

    const loanResult = await db.query(
      `
      SELECT id, branch_id, status
      FROM loans
      WHERE id = $1
      `,
      [loanId],
    );

    if (loanResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Loan request not found",
      });
    }

    const loan = loanResult.rows[0];

    if (loan.status !== "PENDING_APPROVAL") {
      return res.status(400).json({
        success: false,
        message: "Only pending requests can be reviewed",
      });
    }

    if (
      req.user.role === "BRANCH_MANAGER" &&
      Number(req.user.branchId) !== Number(loan.branch_id)
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only review requests from your branch",
      });
    }

    const nextStatus = action === "APPROVE" ? "ACTIVE" : "REJECTED";

    await db.query(
      `
      UPDATE loans
      SET
        status = $1,
        approved_by = $2,
        approved_at = CURRENT_TIMESTAMP,
        rejection_reason = $3
      WHERE id = $4
      `,
      [
        nextStatus,
        req.user.id,
        action === "REJECT" ? rejectionReason : null,
        loanId,
      ],
    );

    return res.json({
      success: true,
      message:
        action === "APPROVE"
          ? "Loan request approved successfully"
          : "Loan request rejected successfully",
    });
  } catch (error) {
    console.error("Error reviewing loan request:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to review loan request",
    });
  }
}
