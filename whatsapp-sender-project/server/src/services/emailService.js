import nodemailer from "nodemailer";

export function emailIsConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.EMAIL_FROM);
}

function getTransport() {
  const { SMTP_HOST, SMTP_PORT = "587", SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !process.env.EMAIL_FROM) {
    throw new Error("Email delivery is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and EMAIL_FROM.");
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
}

export async function sendVerificationCode(email, code, purpose) {
  const subject = purpose === "verification" ? "Verify your Whats Send account" : "Reset your Whats Send password";
  const message = purpose === "verification"
    ? `Your Whats Send verification code is ${code}. It expires in 15 minutes.`
    : `Your Whats Send password reset code is ${code}. It expires in 15 minutes.`;
  await getTransport().sendMail({ from: process.env.EMAIL_FROM, to: email, subject, text: message });
}

export async function sendTeamInvitation(email, token) {
  const appUrl = process.env.APP_URL;
  if (!appUrl) throw new Error("APP_URL is required to send team invitations");
  const link = new URL(`/register?invite=${encodeURIComponent(token)}`, appUrl).toString();
  await getTransport().sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "You’ve been invited to Whats Send",
    text: `Create your account using this invitation link: ${link}\nThis invitation expires in 7 days.`
  });
}
