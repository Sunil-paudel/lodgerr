
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// Hardcoded Gmail credentials for testing
const GOOGLE_EMAIL = "pacbot24@gmail.com";
const GOOGLE_PASSWORD = "ofzyqssefycvpawh"; // This appears to be an App Password

let transporterInstance: Transporter | null = null;
let mailerConfigError: string | null = null;

if (!GOOGLE_EMAIL || !GOOGLE_PASSWORD) {
  // This condition should not be met with hardcoded values but kept for structural integrity
  mailerConfigError = "Hardcoded Gmail credentials are missing. Emails will not be sent.";
  console.warn(`[Mailer] ${mailerConfigError}`);
} else {
  transporterInstance = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GOOGLE_EMAIL,
      pass: GOOGLE_PASSWORD,
    },
  });

  // Verify connection configuration during setup
  transporterInstance.verify((error, success) => {
    if (error) {
      mailerConfigError = `Mailer (Gmail) configuration error during verification: ${error.message}. Emails may not be sent.`;
      console.error(`[Mailer] ${mailerConfigError}`);
      transporterInstance = null; // Invalidate transporter if verification fails
    } else {
      console.log('[Mailer] Gmail email service is configured with hardcoded credentials and ready to send emails.');
    }
  });
}

export const sendEmail = async (options: MailOptions): Promise<{success: boolean; messageId?: string; error?: string}> => {
  if (mailerConfigError || !transporterInstance) {
    const errorMessage = mailerConfigError || "Mailer (Gmail) not initialized or verification failed.";
    console.warn(`[Mailer] Attempted to send email but Gmail mailer is not properly configured. Subject: "${options.subject}", To: "${options.to}"`);
    console.warn(`[Mailer] Configuration Error: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }

  try {
    const info = await transporterInstance.sendMail({
      from: `"${process.env.APP_NAME || 'Lodger App'}" <${GOOGLE_EMAIL}>`, // Using hardcoded GOOGLE_EMAIL as the sender address
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    console.log(`[Mailer] Email sent successfully via Gmail. Subject: "${options.subject}", To: "${options.to}", Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    let specificError = error.message;
    if (error.code === 'EAUTH' || (error.responseCode && error.responseCode === 535)) {
        specificError = "Authentication failed with Gmail. Check your hardcoded GOOGLE_EMAIL and GOOGLE_PASSWORD. Ensure 'Less secure app access' is handled appropriately if not using an App Password (not recommended for regular passwords).";
        console.error(`[Mailer] Gmail Authentication Error: ${specificError}`);
    } else {
        console.error(`[Mailer] Error sending email via Gmail. Subject: "${options.subject}", To: "${options.to}"`, error);
    }
    return { success: false, error: specificError };
  }
};
