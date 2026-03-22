import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "dravidsundar984@gmail.com",
    pass: "snub lgao wgya kems",
  },
});

export async function sendEmail({ subject, text, html }) {
  try {
    await transporter.sendMail({
      from: "LenWeb Bot <dravidsundar984@gmail.com>",
      to: "dravidsundar300m@gmail.com",
      subject,
      text,
      html,
    });

    console.log("Email sent successfully");
  } catch (err) {
    console.error("Email sending failed:", err);
  }
}

