import { getAppBaseUrl, getEmailHeader } from './utils';
import { getLocalizedOrganize } from '@/lib/utils/localization';

export interface WelcomeEmailData {
  name: string;
  email: string;
  planName?: string;
  location?: string;
}

export interface SubscriptionCanceledEmailData {
  name: string;
  email: string;
  planName?: string;
  cancelAtPeriodEnd?: boolean;
  periodEnd?: Date;
}

export interface SubscriptionExpiredEmailData {
  name: string;
  email: string;
  planName?: string;
  location?: string;
}

export interface SubscriptionReactivatedEmailData {
  name: string;
  email: string;
  planName?: string;
}

export interface GoodbyeEmailData {
  name: string;
  email: string;
  reason: 'subscription_canceled' | 'account_deleted';
  planName?: string;
  location?: string;
}

export function getWelcomeEmail(data: WelcomeEmailData): { subject: string; html: string } {
  const baseUrl = getAppBaseUrl();
  const dashboardUrl = `${baseUrl}/dashboard`;
  const organizeText = getLocalizedOrganize(data.location);

  const subject = 'Welcome to TeacherTab! 🎉';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to TeacherTab</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <tr>
                  <td style="padding: 0;">
                    ${getEmailHeader()}
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                      <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to TeacherTab!</h1>
                    </div>
                    
                    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
                      <p style="font-size: 16px; margin-top: 0;">Hi ${data.name},</p>
                      
                      <p style="font-size: 16px;">Thank you for signing up for TeacherTab! We're excited to help you ${organizeText} your teaching schedule and manage your lessons more efficiently.</p>
                      
                      ${data.planName ? `
                      <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 14px; color: #6b7280;"><strong>Your Plan:</strong> ${data.planName}</p>
                      </div>
                      ` : ''}
                      
                      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 20px; margin: 25px 0;">
                        <h3 style="font-size: 16px; font-weight: 600; color: #1e3a8a; margin: 0 0 12px 0;">👋 Quick reminder: TeacherTab is for your personal teaching organisation.</h3>
                        <p style="font-size: 14px; color: #1e40af; margin: 0 0 10px 0; font-weight: 500;">THINK CAREFULLY about if it is necessary for you to include student information:</p>
                        <ul style="font-size: 14px; color: #1e3a8a; padding-left: 20px; margin: 0 0 12px 0;">
                          <li style="margin-bottom: 6px;">✓ Use first names or initials only</li>
                          <li style="margin-bottom: 6px;">✓ Avoid sensitive details (medical, SEN, safeguarding)</li>
                        </ul>
                        <p style="font-size: 14px; color: #1e3a8a; margin: 0 0 12px 0;">If in doubt, check your school's policy on using personal apps for work purposes.</p>
                        <p style="font-size: 14px; color: #1e3a8a; margin: 0;">You're in control of what you save here. We keep your data private and secure, but you are responsible for what you choose to include.</p>
                      </div>
                      
                      <p style="font-size: 16px;">Here's what you can do next:</p>
                      
                      <ul style="font-size: 16px; padding-left: 20px;">
                        <li style="margin-bottom: 10px;">Set up your academic year and terms</li>
                        <li style="margin-bottom: 10px;">Create your timetable structure</li>
                        <li style="margin-bottom: 10px;">Add your classes and subjects</li>
                        <li style="margin-bottom: 10px;">Start planning your lessons</li>
                      </ul>
                      
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${dashboardUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Go to Dashboard</a>
                      </div>
                      
                      <p style="font-size: 16px;">If you have any questions or need help getting started, please don't hesitate to reach out to our support team.</p>
                      
                      <p style="font-size: 16px;">Best regards,<br>The TeacherTab Team</p>
                      
                      <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 14px;">
                        <p style="margin: 0;">© ${new Date().getFullYear()} TeacherTab. All rights reserved.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return { subject, html };
}

export function getSubscriptionCanceledEmail(data: SubscriptionCanceledEmailData): { subject: string; html: string } {
  const baseUrl = getAppBaseUrl();
  const accountUrl = `${baseUrl}/dashboard/account`;

  const subject = 'Your TeacherTab subscription cancellation confirmed';
  
  const periodEndText = data.periodEnd 
    ? new Date(data.periodEnd).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'the end of your billing period';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Canceled</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0;">
        ${getEmailHeader()}
        <div style="background: #fef3c7; padding: 30px; text-align: center; border-top: none; border: 1px solid #fde68a;">
          <h1 style="color: #92400e; margin: 0; font-size: 28px;">Sorry to See You Go</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; margin-top: 0;">Hi ${data.name},</p>
          
          <p style="font-size: 16px;">We've received your request to cancel your TeacherTab subscription.</p>
          
          ${data.planName ? `
          <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;"><strong>Plan:</strong> ${data.planName}</p>
          </div>
          ` : ''}
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong>Important:</strong> Your subscription will remain active until ${periodEndText}. You'll continue to have full access to TeacherTab until then.
            </p>
          </div>
          
          <p style="font-size: 16px;">If you change your mind, you can reactivate your subscription at any time from your account settings before ${periodEndText}.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${accountUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Manage Subscription</a>
          </div>
          
          <p style="font-size: 16px;">We're sorry to see you go. If you have any feedback about how we can improve, please don't hesitate to reach out.</p>
          
          <p style="font-size: 16px;">Best regards,<br>The TeacherTab Team</p>
        </div>
        
                      <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 14px;">
                        <p style="margin: 0;">© ${new Date().getFullYear()} TeacherTab. All rights reserved.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return { subject, html };
}

export function getSubscriptionExpiredEmail(data: SubscriptionExpiredEmailData): { subject: string; html: string } {
  const baseUrl = getAppBaseUrl();
  const feedbackUrl = `${baseUrl}/feedback?reason=subscription_canceled&email=${encodeURIComponent(data.email)}`;
  const organizeText = getLocalizedOrganize(data.location);

  const subject = 'Sorry to see you go - Your TeacherTab subscription has ended';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Expired</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0;">
        ${getEmailHeader()}
        <div style="background: #fef3c7; padding: 30px; text-align: center; border-top: none; border: 1px solid #fde68a;">
          <h1 style="color: #92400e; margin: 0; font-size: 28px;">Sorry to See You Go</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; margin-top: 0;">Hi ${data.name},</p>
          
          <p style="font-size: 16px;">We're sorry to see you go! Your TeacherTab subscription has ended and you no longer have access to your account.</p>
          
          ${data.planName ? `
          <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;"><strong>Expired Plan:</strong> ${data.planName}</p>
          </div>
          ` : ''}
          
          <p style="font-size: 16px;">If you change your mind, you can reactivate your subscription at any time by visiting our pricing page.</p>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 6px; margin: 30px 0; border-left: 4px solid #0ea5e9;">
            <p style="font-size: 16px; margin-top: 0; font-weight: 600; color: #0c4a6e;">We'd love to hear from you</p>
            <p style="font-size: 14px; color: #075985; margin-bottom: 15px;">
              Your feedback helps us improve TeacherTab for all teachers. If you have a moment, please share why you canceled and how we could have done better.
            </p>
            <div style="text-align: center;">
              <a href="${feedbackUrl}" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Share Your Feedback</a>
            </div>
          </div>
          
          <p style="font-size: 16px;">Thank you for being part of the TeacherTab community. We hope we helped ${organizeText} your teaching life, even if just for a little while.</p>
          
          <p style="font-size: 16px;">We wish you all the best in your teaching journey!</p>
          
          <p style="font-size: 16px;">Best regards,<br>The TeacherTab Team</p>
        </div>
        
                      <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 14px;">
                        <p style="margin: 0;">© ${new Date().getFullYear()} TeacherTab. All rights reserved.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return { subject, html };
}

export function getGoodbyeEmail(data: GoodbyeEmailData): { subject: string; html: string } {
  const baseUrl = getAppBaseUrl();
  const feedbackUrl = `${baseUrl}/feedback?reason=${data.reason}&email=${encodeURIComponent(data.email)}`;
  const organizeText = getLocalizedOrganize(data.location);

  const subject = 'Sorry to see you go - Your TeacherTab account';
  
  const reasonText = data.reason === 'account_deleted' 
    ? 'Your TeacherTab account has been deleted'
    : 'Your TeacherTab subscription has been canceled';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sorry to See You Go</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0;">
        ${getEmailHeader()}
        <div style="background: #fef3c7; padding: 30px; text-align: center; border-top: none; border: 1px solid #fde68a;">
          <h1 style="color: #92400e; margin: 0; font-size: 28px;">Sorry to See You Go</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; margin-top: 0;">Hi ${data.name},</p>
          
          <p style="font-size: 16px;">We're sorry to see you go! ${reasonText}.</p>
          
          ${data.planName ? `
          <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;"><strong>Plan:</strong> ${data.planName}</p>
          </div>
          ` : ''}
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 6px; margin: 30px 0; border-left: 4px solid #0ea5e9;">
            <p style="font-size: 16px; margin-top: 0; font-weight: 600; color: #0c4a6e;">We'd love to hear from you</p>
            <p style="font-size: 14px; color: #075985; margin-bottom: 15px;">
              Your feedback is incredibly valuable to us. It helps us understand what we could have done better and how we can improve TeacherTab for all teachers. If you have a moment, please share your thoughts.
            </p>
            <div style="text-align: center;">
              <a href="${feedbackUrl}" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Share Your Feedback</a>
            </div>
          </div>
          
          <p style="font-size: 16px;">Thank you for being part of the TeacherTab community. We hope we helped ${organizeText} your teaching life, even if just for a little while.</p>
          
          <p style="font-size: 16px;">We wish you all the best in your teaching journey!</p>
          
          <p style="font-size: 16px;">Best regards,<br>The TeacherTab Team</p>
        </div>
        
                      <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 14px;">
                        <p style="margin: 0;">© ${new Date().getFullYear()} TeacherTab. All rights reserved.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return { subject, html };
}

export function getSubscriptionReactivatedEmail(data: SubscriptionReactivatedEmailData): { subject: string; html: string } {
  const baseUrl = getAppBaseUrl();
  const dashboardUrl = `${baseUrl}/dashboard`;

  const subject = 'Welcome back to TeacherTab! 🎉';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Reactivated</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0;">
        ${getEmailHeader()}
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-top: none;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome Back!</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; margin-top: 0;">Hi ${data.name},</p>
          
          <p style="font-size: 16px;">Great news! Your TeacherTab subscription has been reactivated, and you now have full access to all features again.</p>
          
          ${data.planName ? `
          <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;"><strong>Your Plan:</strong> ${data.planName}</p>
          </div>
          ` : ''}
          
          <p style="font-size: 16px;">All your data, including your timetable, lessons, classes, and subjects, has been preserved and is ready for you to continue where you left off.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Go to Dashboard</a>
          </div>
          
          <p style="font-size: 16px;">Thank you for coming back! We're here to help if you need anything.</p>
          
          <p style="font-size: 16px;">Best regards,<br>The TeacherTab Team</p>
        </div>
        
                      <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 14px;">
                        <p style="margin: 0;">© ${new Date().getFullYear()} TeacherTab. All rights reserved.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return { subject, html };
}

