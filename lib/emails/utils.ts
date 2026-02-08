export function getAppBaseUrl(): string {
  // Check for Vercel deployment URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Check for custom domain
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Development fallback
  return 'http://localhost:3000';
}

/**
 * Generates a branded email header with company name
 * Simple text-based header for maximum email client compatibility
 * @returns HTML string for email header
 */
export function getEmailHeader(): string {
  return `
    <div style="background-color: #001b3d; padding: 30px 20px; text-align: center;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0;">
        <tr>
          <td align="center" style="padding: 0;">
            <!-- Company name - branded header -->
            <p style="margin: 0; color: #fbae36; font-size: 32px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.2; letter-spacing: -0.5px;">
              TeacherTab
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;
}

/**
 * Generates an unsubscribe footer for marketing emails
 * @param email - The user's email address
 * @param token - Optional unsubscribe token for security
 * @returns HTML string for unsubscribe footer
 */
export function getUnsubscribeFooter(email: string, token?: string): string {
  const baseUrl = getAppBaseUrl();
  const unsubscribeUrl = token
    ? `${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`
    : `${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}`;

  return `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
      <p style="margin: 0 0 10px 0;">
        You're receiving this email because you signed up for TeacherTab marketing emails.
      </p>
      <p style="margin: 0;">
        <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe from marketing emails</a>
        <span style="margin: 0 8px;">|</span>
        <a href="${baseUrl}/dashboard/account" style="color: #6b7280; text-decoration: underline;">Manage preferences</a>
      </p>
      <p style="margin: 10px 0 0 0; font-size: 11px;">
        © ${new Date().getFullYear()} TeacherTab. All rights reserved.
      </p>
    </div>
  `;
}
