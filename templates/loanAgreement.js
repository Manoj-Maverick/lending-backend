export const loanAgreementHTML = (data) => `
<html>
<head>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap');

  body {
    font-family: 'Inter', 'Noto Sans Tamil', 'Latha', Arial, sans-serif;
    font-size: 10.5px;
    color: #1f2937;
    margin: 0;
    background: white;
  }

  /* PAGE CONTROL */
  .page {
    width: 100%;
    max-width: 820px;
    height: 1120px;
    margin: 0 auto;
    padding: 22px 28px;
    border: 2px solid #1e40af;
    box-sizing: border-box;
    overflow: hidden;
  }

  .page-break {
    page-break-before: always;
  }

  /* HEADER */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 3px solid #1e40af;
    padding-bottom: 10px;
    margin-bottom: 15px;
  }

  .company-name {
    font-size: 17px;
    font-weight: 700;
    color: #1e40af;
  }

  .logo-text {
    font-size: 11px;
    color: #64748b;
  }

  h1 {
    text-align: center;
    font-size: 18px;
    margin: 10px 0 15px;
    font-weight: 700;
  }

  .loan-id {
    font-size: 10px;
    font-weight: 600;
  }

  /* CARD */
  .card {
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 12px;
    page-break-inside: avoid;
  }

  .section-title {
    font-size: 11.5px;
    font-weight: 600;
    color: #1e40af;
    margin-bottom: 8px;
    border-bottom: 1px solid #bfdbfe;
    padding-bottom: 3px;
  }

  /* GRID & SUMMARY */
  .details-grid {
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: 6px 18px;
  }

  .label { color: #475569; }
  .value { font-weight: 600; }

  .borrower-main {
    display: grid;
    grid-template-columns: 1fr 100px;
    gap: 20px;
  }

  .photo {
    width: 95px;
    height: 95px;
    object-fit: cover;
    border: 3px solid #1e40af;
  }

  .summary-block {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 18px;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px dashed #cbd5e1;
    padding-bottom: 2px;
  }

  /* TABLE */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.8px;
    page-break-inside: avoid;
  }

  th, td {
    border: 1px solid #64748b;
    padding: 5px;
    text-align: center;
  }

  th {
    background: #e2e8f0;
    font-weight: 600;
  }

  /* TERMS & CONDITIONS */
  .terms {
    font-size: 9.8px;
    line-height: 1.6;
  }

  .terms b {
    font-weight: 600;
    color: #1e40af;
  }

  /* FINGERPRINT SECTION */
  .fingerprint-section {
    margin-top: 25px;
    border: 2px dashed #1e40af;
    padding: 12px;
    border-radius: 8px;
    page-break-inside: avoid;
  }

  .fingerprint-box {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  .fingerprint-left {
    flex: 1;
    font-size: 9.8px;
    line-height: 1.5;
  }

  .fingerprint-right {
    width: 140px;
    height: 140px;
    border: 2px solid #1e40af;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-size: 9px;
    color: #64748b;
    background: #f8fafc;
  }

  /* SIGNATURE */
  .signature {
    display: flex;
    justify-content: space-between;
    margin-top: 25px;
    page-break-inside: avoid;
  }

  .sig-box {
    width: 45%;
    text-align: center;
    border-top: 1px solid black;
    padding-top: 5px;
    font-size: 10px;
  }

  .footer {
    text-align: center;
    font-size: 9px;
    margin-top: 20px;
    color: #64748b;
  }

</style>
</head>

<body>

<!-- ================= PAGE 1 ================= -->
<div class="page">
  <!-- Your existing Page 1 content (unchanged) -->
  <div class="header">
    <div>
      <div class="company-name">SDFC FINANCE LTD.</div>
      <div class="logo-text">NBFC • Regulated Entity</div>
    </div>
    <div class="loan-id">Loan ID: ${data.loan_code}</div>
  </div>

  <h1>LOAN AGREEMENT</h1>

  <!-- BORROWER DETAILS -->
  <div class="card">
    <div class="section-title">BORROWER DETAILS</div>
    <div class="borrower-main">
      <div class="details-grid">
        <div class="label">Name</div><div class="value">${data.client_name}</div>
        <div class="label">Customer Code</div><div class="value">${data.customer_code}</div>
        <div class="label">Phone</div><div class="value">${data.phone}</div>
        <div class="label">Alt Phone</div><div class="value">${data.alternate_phone || "-"}</div>
        <div class="label">Email</div><div class="value">${data.email || "-"}</div>
        <div class="label">DOB</div><div class="value">${data.dob}</div>
        <div class="label">Gender</div><div class="value">${data.gender}</div>
        <div class="label">Marital</div><div class="value">${data.marital_status || "-"}</div>
        <div class="label">Aadhaar</div><div class="value">${data.aadhaar}</div>
        <div class="label">PAN</div><div class="value">${data.pan}</div>
        <div class="label">Occupation</div><div class="value">${data.occupation}</div>
        <div class="label">Income</div><div class="value">₹${data.monthly_income}</div>
        <div class="label">Address</div><div class="value">${data.full_address}</div>
      </div>
      <div>
        <img src="${data.photo_url}" class="photo"/>
      </div>
    </div>
  </div>

  <!-- GUARANTOR DETAILS -->
  <div class="card">
    <div class="section-title">GUARANTOR DETAILS</div>
    <div class="details-grid">
      <div class="label">Name</div><div class="value">${data.guarantor_name || "-"}</div>
      <div class="label">Phone</div><div class="value">${data.guarantor_phone || "-"}</div>
      <div class="label">Relation</div><div class="value">${data.guarantor_relation || "-"}</div>
      <div class="label">Income</div><div class="value">${data.guarantor_income || "-"}</div>
      <div class="label">Address</div><div class="value">${data.guarantor_address || "-"}</div>
    </div>
  </div>

  <!-- LOAN SUMMARY -->
  <div class="card">
    <div class="section-title">LOAN SUMMARY</div>
    <div class="summary-block">
      <div class="summary-row"><span>Principal</span><span>₹${data.principal_amount}</span></div>
      <div class="summary-row"><span>Installment</span><span>₹${data.installment_amount}</span></div>
      <div class="summary-row"><span>Total Payable</span><span>₹${data.total_payable}</span></div>
      <div class="summary-row"><span>Interest Rate</span><span>${data.interest_rate}%</span></div>
      <div class="summary-row"><span>Penalty Rate</span><span>${data.penalty_rate}%</span></div>
      <div class="summary-row"><span>Tenure</span><span>${data.tenure_value} ${data.tenure_unit}</span></div>
      <div class="summary-row"><span>Start Date</span><span>${data.start_date}</span></div>
      <div class="summary-row"><span>End Date</span><span>${data.last_due_date}</span></div>
      <div class="summary-row"><span>Status</span><span>${data.status}</span></div>
    </div>
  </div>
</div>

<!-- ================= PAGE 2 ================= -->
<div class="page page-break">

  <div class="card">
    <div class="section-title">REPAYMENT SCHEDULE</div>
    <table>
      <tr>
        <th>#</th>
        <th>Due Date</th>
        <th>EMI</th>
        <th>Fine</th>
        <th>Total</th>
        <th>Status</th>
      </tr>
      ${(data.schedule || [])
        .map(
          (r, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${r.due_date}</td>
          <td>₹${r.due_amount}</td>
          <td>₹${r.fine_amount || 0}</td>
          <td>₹${r.due_amount + (r.fine_amount || 0)}</td>
          <td>${r.status}</td>
        </tr>
      `,
        )
        .join("")}
    </table>
  </div>

  <!-- TERMS & CONDITIONS - Bilingual -->
  <div class="card">
    <div class="section-title">TERMS & CONDITIONS / விதிமுறைகள் மற்றும் நிபந்தனைகள்</div>
    <div class="terms">
      <b>ENGLISH</b><br/>
      1. The Borrower agrees to repay the loan amount as per the repayment schedule mentioned above.<br/>
      2. Any delay in payment will attract a penalty as specified in the loan summary.<br/>
      3. In case of default, the Lender reserves the right to initiate legal action and recover the dues.<br/>
      4. This agreement is governed by the laws of India.<br/>
      5. The Borrower has read and understood all the terms and conditions and agrees to abide by them.<br/><br/>

      <b>தமிழ்</b><br/>
      1. கடன் வாங்குபவர் மேலே குறிப்பிட்டுள்ள திருப்பிச் செலுத்தும் அட்டவணைப்படி கடன் தொகையைத் திருப்பிச் செலுத்த ஒப்புக்கொள்கிறார்.<br/>
      2. எந்தவொரு தாமதமும் கடன் சுருக்கத்தில் குறிப்பிடப்பட்டுள்ள அபராதத்தை ஈர்க்கும்.<br/>
      3. இயல்புநிலை ஏற்பட்டால், வழங்குநர் சட்ட நடவடிக்கை எடுக்கவும், பாக்கியை மீட்டெடுக்கவும் உரிமை கொண்டுள்ளார்.<br/>
      4. இந்த ஒப்பந்தம் இந்திய சட்டங்களால் நிர்வகிக்கப்படுகிறது.<br/>
      5. கடன் வாங்குபவர் அனைத்து விதிமுறைகளையும் நிபந்தனைகளையும் படித்து புரிந்துகொண்டு, அவற்றைப் பின்பற்ற ஒப்புக்கொள்கிறார்.
    </div>
  </div>

  <!-- SIGNATURE SECTION -->
  <div class="signature">
    <div class="sig-box">Borrower Signature / கடன் வாங்குபவர் கையொப்பம்<br/>Date: ______ / தேதி: ______</div>
    <div class="sig-box">Authorized Signatory<br/>SDFC Finance Ltd.<br/>அங்கீகரிக்கப்பட்ட கையொப்பம்</div>
  </div>

  <!-- FINGERPRINT SECTION FOR NON-READERS / NON-WRITERS -->
  <div class="fingerprint-section">
    <div class="section-title" style="margin-bottom: 10px; border: none; padding: 0;">FOR NON-READERS / NON-WRITERS / படிக்க / எழுதத் தெரியாதவர்களுக்கு</div>
    
    <div class="fingerprint-box">
      <div class="fingerprint-left">
        <b>ENGLISH:</b><br/>
        I, the Borrower, confirm that the contents of this Loan Agreement have been read over and explained to me in my understood language. I have understood the same and agree to abide by all the terms and conditions.<br/><br/>
        
        <b>தமிழ்:</b><br/>
        நான், கடன் வாங்குபவர், இந்த கடன் ஒப்பந்தத்தின் உள்ளடக்கங்கள் எனக்கு புரியும் மொழியில் படித்து விளக்கப்பட்டதை உறுதிப்படுத்துகிறேன். நான் அதைப் புரிந்துகொண்டு, அனைத்து விதிமுறைகள் மற்றும் நிபந்தனைகளுக்கும் கட்டுப்பட ஒப்புக்கொள்கிறேன்.
      </div>
      
      <div class="fingerprint-right">
        Left Thumb Impression<br/>
        இடது கை பெருவிரல் ரேகை<br/><br/>
        <span style="font-size: 28px; color: #1e40af;">👆</span><br/>
        (Place Thumb Here)
      </div>
    </div>
  </div>

  <div class="footer">
    System Generated • ${new Date().getFullYear()} • Confidential
  </div>

</div>

</body>
</html>
`;
