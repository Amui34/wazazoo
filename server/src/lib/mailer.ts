import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 1025,
  secure: false,
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASSWORD
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
});

export async function sendMail(input: { to: string; subject: string; html: string }) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM ?? "no-reply@giglink.app",
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
}
