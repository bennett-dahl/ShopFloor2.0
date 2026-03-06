import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY?.trim();
const resend = apiKey ? new Resend(apiKey) : null;

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Throttle Therapy Shop <onboarding@resend.dev>";

export type SendEmailResult = { ok: true } | { ok: false; error: string };

export async function sendEmail(
  to: string[],
  subject: string,
  text: string
): Promise<SendEmailResult> {
  if (!resend || to.length === 0) {
    return { ok: false, error: "Email not configured or no recipients" };
  }
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      text,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    return { ok: false, error: message };
  }
}
