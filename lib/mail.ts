import nodemailer from "nodemailer";

type Mail = { to: string; subject: string; text: string; html: string };

export async function sendMail(message: Mail) {
  if (!process.env.SMTP_HOST) {
    if (process.env.NODE_ENV !== "production") console.info(`[mail preview] ${message.subject} -> ${message.to}\n${message.text}`);
    return { preview: true };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: (process.env.SMTP_SECURE ?? "true") === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });
  await transporter.sendMail({
    from: process.env.MAIL_FROM ?? "GoFriends <no-reply@gofren.cn>",
    ...message,
  });
  return { preview: false };
}

export function absoluteUrl(path: string) {
  return new URL(path, process.env.APP_URL ?? "http://gofren.cn:8081").toString();
}
