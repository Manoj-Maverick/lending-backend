export const loanStatementHTML = (data) => `
<html>
<head>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap');

  body {
    font-family: 'Inter', 'Noto Sans Tamil', Arial, sans-serif;
    font-size: 10.2px;
    color: #1f2937;
    margin: 16px;
    line-height: 1.4;
    background: #f8fafc;
  }

  .page {
    max-width: 820px;
    margin: 0 auto;
    background: white;
    padding: 28px 0;
    border: 2px solid #1e40af;
    border-radius: 8px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 3px solid #1e40af;
    padding-bottom: 10px;
    margin-bottom: 14px;
  }

  .company-name {
    font-size: 17px;
    font-weight: 700;
    color: #1e40af;
  }

  .logo-text {
    font-size: 12px;
    color: #64748b;
  }

  h1 {
    text-align: center;
    font-size: 18px;
    margin: 12px 0 18px;
  }

  .section-title {
    font-size: 12px;
    font-weight: 600;
    color: #1e40af;
    margin-bottom: 8px;
    border-bottom: 2px solid #bfdbfe;
  }

  .card {
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 12px;
  }

  .grid {
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: 6px 18px;
  }

  .label {
    color: #475569;
  }

  .value {
    font-weight: 600;
  }

  /* SUMMARY */
  .summary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 16px;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px dashed #cbd5e1;
    padding-bottom: 2px;
  }

  .summary-row strong {
    color: #1e40af;
  }

  /* TABLE */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.6px;
  }

  th, td {
    border: 1px solid #64748b;
    padding: 5px;
    text-align: center;
  }

  th {
    background: #f1f5f9;
    color: #1e40af;
    font-weight: 600;
  }

  /* STATUS COLORS */
  .paid { color: #16a34a; font-weight: 600; }
  .pending { color: #dc2626; font-weight: 600; }
  .partial { color: #d97706; font-weight: 600; }

  .footer {
    text-align: center;
    font-size: 9px;
    margin-top: 16px;
    color: #64748b;
  }

</style>
</head>

<body>

<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div>
      <div class="company-name">SDFC FINANCE LTD.</div>
      <div class="logo-text">NBFC • Loan Statement</div>
    </div>
    <div>Loan ID: <strong>${data.loan_code}</strong></div>
  </div>

  <h1>LOAN STATEMENT</h1>

  <!-- CUSTOMER -->
  <div class="card">
    <div class="section-title">CUSTOMER DETAILS</div>
    <div class="grid">
      <div class="label">Name</div><div class="value">${data.client_name}</div>
      <div class="label">Customer Code</div><div class="value">${data.customer_code}</div>
      <div class="label">Phone</div><div class="value">${data.phone}</div>
      <div class="label">Branch</div><div class="value">${data.branch_name}</div>
      <div class="label">Loan Start</div><div class="value">${data.start_date}</div>
      <div class="label">Last Due</div><div class="value">${data.last_due_date}</div>
    </div>
  </div>

  <!-- SUMMARY -->
  <div class="card">
    <div class="section-title">LOAN SUMMARY</div>

    <div class="summary">
      <div class="summary-row"><span>Total Loan</span><strong>₹${data.principal_amount}</strong></div>
      <div class="summary-row"><span>Total Payable</span><strong>₹${data.total_payable}</strong></div>

      <div class="summary-row"><span>Total Paid</span><strong>₹${data.total_paid}</strong></div>
      <div class="summary-row"><span>Total Pending</span><strong>₹${data.pending_amount}</strong></div>

      <div class="summary-row"><span>Total Fine</span><strong>₹${data.total_fine}</strong></div>
      <div class="summary-row"><span>Status</span><strong>${data.status}</strong></div>
    </div>
  </div>

  <!-- PAYMENT TABLE -->
  <div class="card">
    <div class="section-title">PAYMENT LEDGER</div>

    <table>
      <tr>
        <th>#</th>
        <th>Date</th>
        <th>Inst.</th>
        <th>Due</th>
        <th>Paid</th>
        <th>Fine</th>
        <th>Mode</th>
        <th>Balance</th>
        <th>Status</th>
      </tr>

      ${(data.payments || [])
        .map(
          (p, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${p.date}</td>
          <td>${p.installment_no}</td>
          <td>₹${p.due_amount}</td>
          <td>₹${p.paid_amount}</td>
          <td>₹${p.fine_amount}</td>
          <td>${p.mode}</td>
          <td>₹${p.balance}</td>
          <td class="${p.status.toLowerCase()}">${p.status}</td>
        </tr>
      `,
        )
        .join("")}

    </table>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    Generated on ${new Date().toLocaleDateString("en-IN")} • SDFC Finance Ltd.
  </div>

</div>

</body>
</html>
`;
