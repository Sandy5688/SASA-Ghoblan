import nodemailer from "nodemailer";

export const sendAlert = async (subject, message) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Audiomack Service" <${process.env.SMTP_USER}>`,
      to: process.env.ALERT_EMAIL,
      subject,
      text: message,
    });

    console.log(`📧 Alert email sent: ${subject}`);
  } catch (err) {
    console.error(`❌ Failed to send alert email: ${err.message}`);
  }
};