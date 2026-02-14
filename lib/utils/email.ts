
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'onboarding@resend.dev'; // Default Resend testing email

/**
 * Send an invitation email to a new user
 */
export async function sendInvitationEmail(to: string, inviteLink: string, inviterName: string) {
    if (!process.env.RESEND_API_KEY) {
        console.log("Mocking email send (missing RESEND_API_KEY):", { to, inviteLink });
        return { success: true, id: 'mock-id' };
    }

    try {
        const data = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject: `${inviterName} invited you to join SharedSpaces`,
            html: `
        <div>
          <h1>You've been invited!</h1>
          <p>${inviterName} has invited you to join their workspace on SharedSpaces.</p>
          <a href="${inviteLink}" style="padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
          <p>Or copy this link: ${inviteLink}</p>
        </div>
      `,
        });
        return { success: true, data };
    } catch (error) {
        console.error("Failed to send email:", error);
        return { success: false, error };
    }
}

/**
 * Send a generic notification email
 */
export async function sendNotificationEmail(to: string, subject: string, body: string) {
    if (!process.env.RESEND_API_KEY) {
        console.log("Mocking email send (missing RESEND_API_KEY):", { to, subject, body });
        return { success: true, id: 'mock-id' };
    }

    try {
        const data = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject,
            html: `
        <div>
          <h1>Notification</h1>
          <pre style="font-family: sans-serif; white-space: pre-wrap;">${body}</pre>
        </div>
      `,
        });
        return { success: true, data };
    } catch (error) {
        console.error("Failed to send email:", error);
        return { success: false, error };
    }
}
