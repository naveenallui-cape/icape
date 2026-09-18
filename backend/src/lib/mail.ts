import { randomInt } from "crypto";
import nodemailer from "nodemailer";
import { env } from "../config/env";

const BRAND = "#0d173b";
const ACCENT = "#d4af37";
const MUTED = "#5b6785";
const SOFT = "#f4f7fb";
const BORDER = "#d7deea";

type EmailCta = {
  label: string;
  url: string;
};

type EmailDetail = {
  label: string;
  value: string;
};

type SendSchoolMailInput = {
  to: string;
  subject: string;
  /** Short body title — keep different from subject (subject is only in the email header). */
  heading: string;
  intro: string;
  paragraphs?: string[];
  details?: EmailDetail[];
  otp?: string;
  cta?: EmailCta;
  note?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function createTransport() {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    return null;
  }
  const port = env.smtpPort;
  return nodemailer.createTransport({
    host: env.smtpHost,
    port,
    // 465 = implicit TLS (GoDaddy smtpout.secureserver.net); 587 = STARTTLS
    secure: port === 465,
    requireTLS: port === 587,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
}

function buildEmailHtml(input: {
  heading: string;
  intro: string;
  paragraphs?: string[];
  details?: EmailDetail[];
  otp?: string;
  cta?: EmailCta;
  note?: string;
}) {
  const paragraphs = (input.paragraphs || [])
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${BRAND};">${escapeHtml(p)}</p>`,
    )
    .join("");

  const details =
    input.details && input.details.length > 0
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;border-collapse:collapse;border:1px solid ${BORDER};">
          ${input.details
            .map(
              (row, index) => `
            <tr>
              <td style="padding:10px 14px;font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${MUTED};background:${index % 2 ? SOFT : "#ffffff"};width:38%;border-bottom:1px solid ${BORDER};">
                ${escapeHtml(row.label)}
              </td>
              <td style="padding:10px 14px;font-size:14px;font-weight:600;color:${BRAND};background:${index % 2 ? SOFT : "#ffffff"};border-bottom:1px solid ${BORDER};">
                ${escapeHtml(row.value)}
              </td>
            </tr>`,
            )
            .join("")}
        </table>`
      : "";

  const otpBlock = input.otp
    ? `<div style="margin:0 0 20px;padding:18px 16px;text-align:center;background:${SOFT};border:1px solid ${BORDER};">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};">One-time password</p>
        <p style="margin:0;font-size:32px;font-weight:700;letter-spacing:0.28em;color:${BRAND};font-family:ui-monospace,Menlo,Consolas,monospace;">${escapeHtml(input.otp)}</p>
        <p style="margin:10px 0 0;font-size:13px;color:${MUTED};">Valid for 15 minutes</p>
      </div>`
    : "";

  const cta = input.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
        <tr>
          <td style="background:${ACCENT};">
            <a href="${escapeHtml(input.cta.url)}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:700;color:${BRAND};text-decoration:none;">
              ${escapeHtml(input.cta.label)}
            </a>
          </td>
        </tr>
      </table>`
    : "";

  const note = input.note
    ? `<p style="margin:0;font-size:13px;line-height:1.55;color:${MUTED};">${escapeHtml(input.note)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>i-CAPE</title>
</head>
<body style="margin:0;padding:0;background:${SOFT};color:${BRAND};font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:${SOFT};">
    <tr>
      <td style="padding:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:22px 24px;background:${BRAND};">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${ACCENT};">i-CAPE Olympiad</p>
              <p style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;">School Portal</p>
            </td>
          </tr>
          <tr>
            <td style="height:4px;background:${ACCENT};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 24px;background:#ffffff;">
              <h1 style="margin:0 0 12px;font-size:20px;line-height:1.35;color:${BRAND};">${escapeHtml(input.heading)}</h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND};">${escapeHtml(input.intro)}</p>
              ${paragraphs}
              ${details}
              ${otpBlock}
              ${cta}
              ${note}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;background:${BRAND};">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#c9d2e5;">This is an automated message from i-CAPE. Please do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildEmailText(input: {
  heading: string;
  intro: string;
  paragraphs?: string[];
  details?: EmailDetail[];
  otp?: string;
  cta?: EmailCta;
  note?: string;
}) {
  const lines = [input.heading, "", input.intro, ""];
  for (const p of input.paragraphs || []) lines.push(p, "");
  if (input.details?.length) {
    for (const row of input.details) {
      lines.push(`${row.label}: ${row.value}`);
    }
    lines.push("");
  }
  if (input.otp) {
    lines.push(`OTP: ${input.otp}`, "Valid for 15 minutes", "");
  }
  if (input.cta) {
    lines.push(`${input.cta.label}: ${input.cta.url}`, "");
  }
  if (input.note) lines.push(input.note, "");
  lines.push("— i-CAPE School Portal");
  return lines.join("\n");
}

export async function sendSchoolMail(input: SendSchoolMailInput) {
  const transport = createTransport();
  const from = env.smtpFrom || env.smtpUser || "noreply@icape.in";
  const html = buildEmailHtml(input);
  const text = buildEmailText(input);

  if (!transport) {
    const msg =
      "SMTP is not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS in backend/.env)";
    if (env.nodeEnv !== "production") {
      console.warn(`[mail:dev] ${msg}`);
      console.info(`[mail:dev] ${input.subject}`);
      console.info(`[mail:dev] To: ${input.to}`);
      if (input.otp) console.info(`[mail:dev] OTP: ${input.otp}`);
      if (input.cta) console.info(`[mail:dev] CTA: ${input.cta.url}`);
      return { sent: false, logged: true };
    }
    throw new Error(msg);
  }

  try {
    const info = await transport.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text,
      html,
    });
    console.info(
      "[mail] sent",
      input.subject,
      "→",
      input.to,
      info.messageId || "",
    );
    return { sent: true, logged: false };
  } catch (err) {
    console.error(
      "[mail] send failed",
      input.subject,
      "→",
      input.to,
      err instanceof Error ? err.message : err,
    );
    throw err;
  }
}

/** Non-blocking school notification — never fails the main request. */
export function notifySchool(input: SendSchoolMailInput) {
  void sendSchoolMail(input).catch((err) => {
    console.warn(
      "[mail] notify failed",
      input.subject,
      err instanceof Error ? err.message : err,
    );
  });
}

export function generatePasswordOtp() {
  return String(randomInt(1000, 10000));
}

export function passwordResetTokenKey(accountId: string, otp: string) {
  return `${accountId}:${otp}`;
}

export async function sendPasswordOtpEmail(to: string, otp: string, schoolName?: string) {
  return sendSchoolMail({
    to,
    subject: "i-CAPE password reset OTP",
    heading: "Reset your password",
    intro: schoolName
      ? `Hi ${schoolName}, use this one-time password to reset your school portal login.`
      : "Use this one-time password to reset your school portal login.",
    paragraphs: [
      "Enter the OTP on the forgot password page, then choose a new password.",
    ],
    otp,
    note: "If you did not request a password reset, you can ignore this email.",
  });
}

export async function sendAccountCreatedEmail(input: {
  to: string;
  schoolName: string;
  email: string;
  password?: string;
}) {
  const loginUrl = `${env.frontendUrl.replace(/\/$/, "")}/school/login`;
  return sendSchoolMail({
    to: input.to,
    subject: "i-CAPE school account details",
    heading: "Your school account is ready",
    intro: `Welcome${input.schoolName ? `, ${input.schoolName}` : ""}. Your i-CAPE school portal account has been created. Use the details below to sign in.`,
    details: [
      { label: "Login link", value: loginUrl },
      { label: "Email", value: input.email },
      ...(input.password
        ? [{ label: "Password", value: input.password }]
        : []),
    ],
    paragraphs: [
      "Sign in to complete school details, add students, and submit payment for the current Olympiad Year.",
      ...(input.password
        ? [
            "Keep this password safe. You can change it anytime from Forgot password on the login page.",
          ]
        : []),
    ],
    cta: { label: "Open school login", url: loginUrl },
  });
}

export async function sendRegistrationSubmittedEmail(input: {
  to: string;
  schoolName: string;
  schoolCode?: string;
  studentCount: number;
  amountExpected?: number;
}) {
  const portalUrl = `${env.frontendUrl.replace(/\/$/, "")}/school/portal`;
  return sendSchoolMail({
    to: input.to,
    subject: "i-CAPE registration submitted",
    heading: "Registration received",
    intro: `Thank you${input.schoolName ? `, ${input.schoolName}` : ""}. Your registration and payment details are under verification.`,
    details: [
      ...(input.schoolCode
        ? [{ label: "School code", value: input.schoolCode }]
        : []),
      { label: "Students", value: String(input.studentCount) },
      ...(input.amountExpected != null
        ? [
            {
              label: "Amount",
              value: `INR ${Number(input.amountExpected).toLocaleString("en-IN")}`,
            },
          ]
        : []),
    ],
    paragraphs: [
      "Verification usually takes up to 24 hours. You will receive another email when your registration is approved or if any correction is needed.",
    ],
    cta: { label: "View status", url: portalUrl },
  });
}

export async function sendRegistrationApprovedEmail(input: {
  to: string;
  schoolName: string;
  schoolCode?: string;
}) {
  const portalUrl = `${env.frontendUrl.replace(/\/$/, "")}/school/portal`;
  return sendSchoolMail({
    to: input.to,
    subject: "i-CAPE registration approved",
    heading: "Registration approved",
    intro: `Good news${input.schoolName ? `, ${input.schoolName}` : ""}. Your school registration payment has been verified and approved.`,
    details: [
      ...(input.schoolCode
        ? [{ label: "School code", value: input.schoolCode }]
        : []),
    ],
    paragraphs: [
      "You can now view, download, and print your approved student list from the school portal.",
    ],
    cta: { label: "Open student list", url: portalUrl },
  });
}

export async function sendRegistrationRejectedEmail(input: {
  to: string;
  schoolName: string;
  schoolCode?: string;
  reason?: string | null;
}) {
  const portalUrl = `${env.frontendUrl.replace(/\/$/, "")}/school/portal`;
  return sendSchoolMail({
    to: input.to,
    subject: "i-CAPE registration needs attention",
    heading: "Registration not approved",
    intro: `Your registration was not approved${input.schoolName ? ` for ${input.schoolName}` : ""}. You can correct the details and submit again.`,
    details: [
      ...(input.schoolCode
        ? [{ label: "School code", value: input.schoolCode }]
        : []),
      ...(input.reason
        ? [{ label: "Admin note", value: input.reason }]
        : []),
    ],
    paragraphs: [
      "Please review payment details in the portal, update anything needed, and resubmit for verification.",
    ],
    cta: { label: "Update and resubmit", url: portalUrl },
  });
}

/** @deprecated use sendPasswordOtpEmail */
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  return sendSchoolMail({
    to,
    subject: "i-CAPE password reset",
    heading: "Reset your password",
    intro: "Use the button below to set a new password for your school account.",
    cta: { label: "Set new password", url: resetUrl },
    note: "If you did not request this, you can ignore this email.",
  });
}

export async function sendStudentExportReadyEmail(input: {
  to: string;
  adminName: string;
  fileName: string;
  totalRows: number;
  jobId: string;
}) {
  const downloadPath = `${env.frontendUrl.replace(/\/$/, "")}/admin/students`;
  return sendSchoolMail({
    to: input.to,
    subject: "i-CAPE student export ready",
    heading: "Your export is ready",
    intro: `Hi ${input.adminName || "Admin"}, your student export has finished.`,
    details: [
      { label: "File", value: input.fileName },
      {
        label: "Rows",
        value: input.totalRows.toLocaleString("en-IN"),
      },
      { label: "Job ID", value: input.jobId },
    ],
    cta: { label: "Open Admin → Students", url: downloadPath },
    note: "Download links expire in 24 hours.",
  });
}
