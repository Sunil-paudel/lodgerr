
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || '"Lodger App" <noreply@example.com>';

let transporterInstance: Transporter | null = null;
let mailerConfigError: string | null = null;

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  mailerConfigError = "Email service is not configured. Missing SMTP_HOST, SMTP_USER, or SMTP_PASS environment variables. Emails will not be sent.";
  console.warn(`[Mailer] ${mailerConfigError}`);
} else {
  transporterInstance = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports like 587
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    tls: {
      // do not fail on invalid certs if using self-signed or local dev
      rejectUnauthorized: process.env.NODE_ENV === 'production', 
    }
  });

  // Verify connection configuration during setup
  transporterInstance.verify((error, success) => {
    if (error) {
      mailerConfigError = `Mailer configuration error during verification: ${error.message}. Emails may not be sent.`;
      console.error(`[Mailer] ${mailerConfigError}`);
      transporterInstance = null; // Invalidate transporter if verification fails
    } else {
      console.log('[Mailer] Email service is configured and ready to send emails.');
    }
  });
}

export const sendEmail = async (options: MailOptions): Promise<{success: boolean; messageId?: string; error?: string}> => {
  if (mailerConfigError || !transporterInstance) {
    const errorMessage = mailerConfigError || "Mailer not initialized or verification failed.";
    console.warn(`[Mailer] Attempted to send email but mailer is not properly configured. Subject: "${options.subject}", To: "${options.to}"`);
    console.warn(`[Mailer] Configuration Error: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }

  try {
    const info = await transporterInstance.sendMail({
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    console.log(`[Mailer] Email sent successfully. Subject: "${options.subject}", To: "${options.to}", Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Mailer] Error sending email. Subject: "${options.subject}", To: "${options.to}"`, error);
    return { success: false, error: error.message };
  }
};
