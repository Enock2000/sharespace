export const getInvitationEmailTemplate = (
    inviterName: string,
    teamName: string,
    inviteLink: string
): string => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; }
            .header { text-align: center; margin-bottom: 30px; }
            .btn { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
            .footer { margin-top: 30px; font-size: 12px; color: #64748b; text-align: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Join ${teamName} on SharedSpaces</h2>
            </div>
            <p>Hello,</p>
            <p><strong>${inviterName}</strong> has invited you to join the team <strong>${teamName}</strong>.</p>
            <p>Click the button below to accept the invitation and get started:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteLink}" class="btn">Accept Invitation</a>
            </div>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} SharedSpaces via Resend</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

export const getFileSharedEmailTemplate = (
    sharerName: string,
    fileName: string,
    fileLink: string
): string => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; }
            .header { text-align: center; margin-bottom: 30px; }
            .btn { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
            .footer { margin-top: 30px; font-size: 12px; color: #64748b; text-align: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                 <h2>File Shared with You</h2>
            </div>
            <p>Hello,</p>
            <p><strong>${sharerName}</strong> has shared a file with you: <strong>${fileName}</strong>.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${fileLink}" class="btn">View File</a>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} SharedSpaces via Resend</p>
            </div>
        </div>
    </body>
    </html>
    `;
};
