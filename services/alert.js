// services/alert.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export async function sendAlert(subject, message) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Alert" <${process.env.SMTP_USER}>`,
      to: process.env.ALERT_EMAIL_TO || process.env.SMTP_USER,
      subject,
      text: message,
    });
    console.log(`📧 Alert sent: ${subject}`);
  } catch (err) {
    console.error("❌ Failed to send alert:", err.message);
  }
}
