import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789'); // Fallback to avoid crash if env missing

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> => {
    const { to, subject, html, text } = options;

    if (!process.env.RESEND_API_KEY) {
        console.log('[EMAIL MOCK] Email would be sent:', {
            to,
            subject,
            content: text || 'HTML content included'
        });
        return { success: true, id: 'mock-email-id' };
    }

    try {
        const data = await resend.emails.send({
            from: 'SharedSpaces <onboarding@resend.dev>', // Use verified domain or default for testing
            to,
            subject,
            html,
            text
        });

        if (data.error) {
            console.error('Failed to send email:', data.error);
            return { success: false, error: data.error.message };
        }

        return { success: true, id: data.data?.id };
    } catch (error: any) {
        console.error('Email service error:', error);
        return { success: false, error: error.message };
    }
};
