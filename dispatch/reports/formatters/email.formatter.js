export function formatCollectionEmail(rows) {
  let html = `
  <table width="100%" cellpadding="0" cellspacing="0"
         style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;margin-top:10px">

    <thead>
      <tr style="background:#1f4e79;color:white">
        <th style="padding:12px;border:1px solid #ddd">#</th>
        <th style="padding:12px;border:1px solid #ddd">Customer</th>
        <th style="padding:12px;border:1px solid #ddd">Phone</th>
        <th style="padding:12px;border:1px solid #ddd">Amount</th>
        <th style="padding:12px;border:1px solid #ddd">Loan</th>
        <th style="padding:12px;border:1px solid #ddd">Action</th>
      </tr>
    </thead>

    <tbody>
  `;

  rows.forEach((c, i) => {
    html += `
      <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f7f9fc"}">
        <td style="padding:10px;border:1px solid #ddd;text-align:center">${i + 1}</td>

        <td style="padding:10px;border:1px solid #ddd;font-weight:bold">
          ${c.full_name}
        </td>

        <td style="padding:10px;border:1px solid #ddd">
          +91${c.phone}
        </td>

        <td style="padding:10px;border:1px solid #ddd;color:#0b7a0b;font-weight:bold">
          ₹${c.due_amount}
        </td>

        <td style="padding:10px;border:1px solid #ddd">
          ${c.loan_code}
        </td>

        <td style="padding:10px;border:1px solid #ddd;text-align:center">

          <a href="tel:+91${c.phone}"
             style="
             background:#28a745;
             color:white;
             padding:8px 14px;
             text-decoration:none;
             border-radius:5px;
             font-weight:bold;
             font-size:13px;
             ">
             📞 Call
          </a>

        </td>
      </tr>
    `;
  });

  html += `
    </tbody>
  </table>
  `;

  return html;
}
