import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const resendFromName = process.env.RESEND_FROM_NAME || 'TeacherTab';

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  isMarketing?: boolean; // If true, will add unsubscribe footer
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  if (!resend) {
    // In development, log the email instead of sending
    if (process.env.NODE_ENV === 'development') {
      // Log email details for development
      return;
    }
    // In production, throw error if email service is not configured
    throw new Error('Email service is not configured. Please set RESEND_API_KEY environment variable.');
  }

  try {
    // Add unsubscribe footer for marketing emails
    let htmlContent = options.html;
    if (options.isMarketing) {
      const { getUnsubscribeFooter } = await import('./utils');
      htmlContent = options.html + getUnsubscribeFooter(options.to);
    }

    await resend.emails.send({
      from: options.from || `${resendFromName} <${resendFromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: htmlContent,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to send email: ${errorMessage}`);
  }
}

/**
 * Adds a user to Resend Audience using the Contacts API
 * 
 * IMPORTANT: Contacts are uniquely identified by EMAIL, not by name.
 * Multiple users can have the same name (e.g., "John Smith"), but each
 * email address is unique. This function will:
 * - Create a new contact if the email doesn't exist
 * - Update an existing contact if the email already exists
 * 
 * Exported for use in migration scripts
 * 
 * @param email - The unique email address (required, used as unique identifier)
 * @param name - The user's name (optional, can be duplicated across users)
 * @param metadata - Additional metadata to store with the contact
 */
export async function addUserToResendAudience(
  email: string,
  name: string | null,
  metadata?: Record<string, string>
): Promise<void> {
  if (!resend) {
    const errorMsg = `[resend-audience] Resend client not initialized. RESEND_API_KEY is ${process.env.RESEND_API_KEY ? 'set' : 'NOT set'}`;
    if (process.env.NODE_ENV === 'development') {
      console.log(errorMsg);
      console.log(`[resend-audience] Would add contact: ${email}`, metadata);
    } else {
      console.error(errorMsg);
    }
    return;
  }

  const audienceId = process.env.RESEND_AUDIENCE_ID;
  console.log(`[resend-audience] Attempting to add contact: ${email}`, {
    hasAudienceId: !!audienceId,
    hasName: !!name,
    metadataKeys: metadata ? Object.keys(metadata) : [],
  });

  try {
    // Create contact in Resend Audience
    // Note: Email is the unique identifier - names can be duplicated
    const contactData: any = {
      email, // Email is the unique key, not name
      unsubscribed: false,
    };

    // Add name if provided
    if (name) {
      const nameParts = name.split(' ');
      contactData.firstName = nameParts[0] || undefined;
      if (nameParts.length > 1) {
        contactData.lastName = nameParts.slice(1).join(' ');
      }
    }

    // Add metadata as custom fields if provided
    if (metadata && Object.keys(metadata).length > 0) {
      // Resend contacts API may accept metadata differently
      // Try to add as custom fields
      Object.entries(metadata).forEach(([key, value]) => {
        contactData[key] = value;
      });
    }

    // Use the contacts API - check if audienceId is required
    let response;
    try {
      if (audienceId) {
        console.log(`[resend-audience] Creating contact with audienceId: ${audienceId}`);
        response = await resend.contacts.create({
          email,
          audienceId,
          ...contactData,
        });
      } else {
        // If no audience ID, create in default audience
        console.log(`[resend-audience] Creating contact without audienceId (using default audience)`);
        response = await resend.contacts.create({
          email,
          ...contactData,
        });
      }

      // Check if the response contains an error (Resend SDK returns errors in response.error)
      // Also check if data is null, which indicates an error
      if (response?.error || (response?.data === null && response?.error)) {
        const error = response.error;
        const errorMessage = error?.message || String(error);
        const statusCode = error?.statusCode || error?.status;
        
        console.log(`[resend-audience] ⚠️ API returned error:`, {
          statusCode,
          message: errorMessage,
          hasRetryAfter: !!response.headers?.['retry-after'],
        });
        
        // Handle rate limiting - retry after delay
        if (statusCode === 429) {
          const retryAfter = parseInt(response.headers?.['retry-after'] || '1', 10);
          console.log(`[resend-audience] Rate limited (429). Retrying after ${retryAfter} second(s)...`);
          
          // Wait and retry once
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          
          // Retry the request
          if (audienceId) {
            response = await resend.contacts.create({
              email,
              audienceId,
              ...contactData,
            });
          } else {
            response = await resend.contacts.create({
              email,
              ...contactData,
            });
          }
          
          // Check again after retry
          if (response?.error || (response?.data === null && response?.error)) {
            const retryError = response.error;
            throw new Error(`Rate limit retry failed: ${retryError?.message || 'Unknown error'} (${retryError?.statusCode || 'unknown'})`);
          }
        } else {
          // Other errors - throw them
          throw new Error(`Resend API error: ${errorMessage} (${statusCode || 'unknown'})`);
        }
      }

      // Only log success if there's no error
      if (!response?.error && response?.data !== null) {
        console.log(`[resend-audience] ✅ Successfully added contact to Resend Audience: ${email}`, {
          responseId: response?.data?.id || response?.id,
          responseData: response?.data,
        });
      } else {
        // This shouldn't happen, but log it if it does
        console.error(`[resend-audience] ⚠️ Unexpected response structure:`, response);
        throw new Error(`Unexpected response structure from Resend API`);
      }
    } catch (apiError) {
      // Re-throw to be caught by outer catch block
      console.error(`[resend-audience] API call failed for ${email}:`, {
        error: apiError instanceof Error ? apiError.message : String(apiError),
        stack: apiError instanceof Error ? apiError.stack : undefined,
        contactData,
        hasAudienceId: !!audienceId,
      });
      throw apiError;
    }
  } catch (error) {
    // If contact already exists (by email), try to update it
    // This handles the case where the same email was added before, regardless of name
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as any)?.statusCode || (error as any)?.code;
    
    console.log(`[resend-audience] Error caught for ${email}:`, {
      message: errorMessage,
      code: errorCode,
      errorType: error?.constructor?.name,
    });
    
    if (errorMessage.includes('already exists') || errorMessage.includes('duplicate') || errorMessage.includes('409') || errorCode === 409) {
      console.log(`[resend-audience] Contact with email ${email} already exists (identified by email, not name), updating...`);
      
      try {
        const updateData: any = {
          email,
          unsubscribed: false,
        };

        if (name) {
          const nameParts = name.split(' ');
          updateData.firstName = nameParts[0] || undefined;
          if (nameParts.length > 1) {
            updateData.lastName = nameParts.slice(1).join(' ');
          }
        }

        if (metadata && Object.keys(metadata).length > 0) {
          Object.entries(metadata).forEach(([key, value]) => {
            updateData[key] = value;
          });
        }

        if (audienceId) {
          await resend.contacts.update({
            email,
            audienceId,
            ...updateData,
          });
        } else {
          await resend.contacts.update({
            email,
            ...updateData,
          });
        }
        console.log(`[resend-audience] ✅ Updated existing contact in Resend Audience: ${email}`);
      } catch (updateError) {
        console.error(`[resend-audience] ❌ Failed to update existing contact for ${email}:`, {
          error: updateError instanceof Error ? updateError.message : String(updateError),
          stack: updateError instanceof Error ? updateError.stack : undefined,
          code: (updateError as any)?.statusCode || (updateError as any)?.code,
        });
        // Don't re-throw - we've already logged the error
      }
    } else {
      // This is a different error (not a duplicate)
      console.error(`[resend-audience] ❌ Failed to add contact ${email} to Resend Audience:`, {
        error: errorMessage,
        code: errorCode,
        errorType: error?.constructor?.name,
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Re-throw so caller knows it failed
      throw error;
    }
  }
}

/**
 * Sends user information to Resend for admin/internal tracking
 * This is called whenever user data changes (signup, subscription change, profile update)
 * Also adds the user to Resend Audience
 */
export async function sendUserInfoToResend(
  user: {
    id: number;
    name: string | null;
    email: string;
    teachingPhase?: string | null;
    colorPreference?: string | null;
    timetableCycle?: string | null;
    location?: string | null;
    planName?: string | null;
    subscriptionStatus?: string | null;
    stripeCustomerId?: string | null;
    marketingEmails?: boolean | number | null; // Can be boolean (true/false) or integer (1/0)
    createdAt?: Date | null;
  },
  eventType: 'signup' | 'subscription_change' | 'profile_update'
): Promise<void> {
  const adminEmail = process.env.RESEND_ADMIN_EMAIL || process.env.RESEND_FROM_EMAIL;
  
  if (!resend || !adminEmail) {
    // In development, just log
    if (process.env.NODE_ENV === 'development') {
      console.log(`[user-info] ${eventType}:`, {
        id: user.id,
        email: user.email,
        name: user.name,
        planName: user.planName,
        subscriptionStatus: user.subscriptionStatus,
      });
    }
    return;
  }

  const eventLabels: Record<typeof eventType, string> = {
    signup: 'New User Signup',
    subscription_change: 'Subscription Change',
    profile_update: 'Profile Update',
  };

  const emailSubject = `TeacherTab: ${eventLabels[eventType]} - ${user.email}`;
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${eventLabels[eventType]}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 10px 0; color: #1f2937;">${eventLabels[eventType]}</h2>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">User information update from TeacherTab</p>
        </div>
        
        <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #374151; width: 150px;">Event Type:</td>
              <td style="padding: 8px 0; color: #1f2937;">${eventLabels[eventType]}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #374151;">User ID:</td>
              <td style="padding: 8px 0; color: #1f2937;">${user.id}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #374151;">Name:</td>
              <td style="padding: 8px 0; color: #1f2937;">${user.name || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #374151;">Email:</td>
              <td style="padding: 8px 0; color: #1f2937;">${user.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #374151;">Location:</td>
              <td style="padding: 8px 0; color: #1f2937;">${user.location || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #374151;">Teaching Phase:</td>
              <td style="padding: 8px 0; color: #1f2937;">${user.teachingPhase || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #374151;">Color Preference:</td>
              <td style="padding: 8px 0; color: #1f2937;">${user.colorPreference || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #374151;">Timetable Cycle:</td>
              <td style="padding: 8px 0; color: #1f2937;">${user.timetableCycle || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #374151;">Plan Name:</td>
              <td style="padding: 8px 0; color: #1f2937;">${user.planName || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #374151;">Subscription Status:</td>
              <td style="padding: 8px 0; color: #1f2937;">${user.subscriptionStatus || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #374151;">Stripe Customer ID:</td>
              <td style="padding: 8px 0; color: #1f2937;">${user.stripeCustomerId || 'N/A'}</td>
            </tr>
            ${user.createdAt ? `
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #374151;">Account Created:</td>
              <td style="padding: 8px 0; color: #1f2937;">${new Date(user.createdAt).toLocaleString()}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; font-size: 14px; color: #92400e;">
            <strong>Note:</strong> This is an automated notification from TeacherTab.
          </p>
        </div>
      </body>
    </html>
  `;

  try {
    // Send admin notification email
    await sendEmail({
      to: adminEmail,
      subject: emailSubject,
      html: emailHtml,
    });
    console.log(`[user-info] Sent ${eventType} notification to ${adminEmail} for user ${user.email}`);
  } catch (error) {
    // Log error but don't fail the operation
    console.error(`[user-info] Failed to send ${eventType} notification:`, {
      error: error instanceof Error ? error.message : String(error),
      userId: user.id,
      email: user.email,
    });
  }

  // Handle marketingEmails changes - sync to Resend Audience
  // marketingEmails is stored as integer: 1 = subscribed, 0 = unsubscribed
  // NOTE: Contacts are uniquely identified by EMAIL, not name. Multiple users can have the same name.
  const marketingEmailsValue = user.marketingEmails === true || user.marketingEmails === 1 || user.marketingEmails === null; // null defaults to subscribed
  
  // For signups, always add to audience (they can unsubscribe later)
  // For updates, check marketingEmails value to determine if they should be in audience
  const shouldAddToAudience = 
    eventType === 'signup' || 
    (eventType !== 'signup' && marketingEmailsValue);
  
  const shouldRemoveFromAudience = 
    eventType !== 'signup' && 
    (user.marketingEmails === false || user.marketingEmails === 0);

  // If user has opted in (marketingEmails = 1/true), add/update them in Resend Audience
  if (shouldAddToAudience) {
    try {
      console.log(`[user-info] Adding user to Resend Audience:`, {
        eventType,
        email: user.email,
        name: user.name,
        marketingEmails: user.marketingEmails,
        marketingEmailsValue,
      });
      
      const metadata: Record<string, string> = {
        user_id: user.id.toString(), // Store user ID in metadata for tracking
        ...(user.location && { location: user.location }),
        ...(user.teachingPhase && { teaching_phase: user.teachingPhase }),
        ...(user.colorPreference && { color_preference: user.colorPreference }),
        ...(user.timetableCycle && { timetable_cycle: user.timetableCycle }),
        ...(user.planName && { plan_name: user.planName }),
        ...(user.subscriptionStatus && { subscription_status: user.subscriptionStatus }),
        ...(user.stripeCustomerId && { stripe_customer_id: user.stripeCustomerId }),
        ...(user.createdAt && { account_created: user.createdAt.toISOString() }),
      };

      // Email is the unique identifier - name can be duplicated across users
      await addUserToResendAudience(user.email, user.name, metadata);
      console.log(`[user-info] Successfully added user to Resend Audience: ${user.email}`);
    } catch (error) {
      // Log error but don't fail the operation
      console.error(`[user-info] Failed to add user to Resend Audience:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId: user.id,
        email: user.email,
        eventType,
      });
    }
  }
  
  // If user has opted out (marketingEmails = 0/false), mark them as unsubscribed (but keep in audience for transactional emails)
  if (shouldRemoveFromAudience) {
    console.log(`[user-info] User opted out of marketing emails, marking as unsubscribed in Resend:`, {
      email: user.email,
      marketingEmails: user.marketingEmails,
    });
    
    try {
      if (resend) {
        const audienceId = process.env.RESEND_AUDIENCE_ID;
        
        // Mark as unsubscribed (but keep in audience for transactional emails)
        try {
          let updateResponse;
          if (audienceId) {
            updateResponse = await resend.contacts.update({
              email: user.email,
              audienceId,
              unsubscribed: true,
            });
          } else {
            updateResponse = await resend.contacts.update({
              email: user.email,
              unsubscribed: true,
            });
          }
          
          // Check for errors in response
          if (updateResponse?.error) {
            const error = updateResponse.error;
            const statusCode = error.statusCode || error.status;
            
            // Handle rate limiting - retry after delay
            if (statusCode === 429) {
              const retryAfter = parseInt(updateResponse.headers?.['retry-after'] || '1', 10);
              console.log(`[resend-audience] Rate limited (429) when updating. Retrying after ${retryAfter} second(s)...`);
              
              // Wait and retry once
              await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
              
              // Retry the update
              if (audienceId) {
                updateResponse = await resend.contacts.update({
                  email: user.email,
                  audienceId,
                  unsubscribed: true,
                });
              } else {
                updateResponse = await resend.contacts.update({
                  email: user.email,
                  unsubscribed: true,
                });
              }
              
              // Check again after retry
              if (updateResponse?.error) {
                const retryError = updateResponse.error;
                throw new Error(`Rate limit retry failed: ${retryError.message} (${retryError.statusCode})`);
              }
            }
            // If contact doesn't exist (404), create them as unsubscribed
            else if (statusCode === 404) {
              console.log(`[resend-audience] Contact ${user.email} not found, creating as unsubscribed...`);
              try {
                const contactData: any = {
                  email: user.email,
                  unsubscribed: true,
                };

                if (user.name) {
                  const nameParts = user.name.split(' ');
                  contactData.firstName = nameParts[0] || undefined;
                  if (nameParts.length > 1) {
                    contactData.lastName = nameParts.slice(1).join(' ');
                  }
                }

                if (audienceId) {
                  await resend.contacts.create({
                    email: user.email,
                    audienceId,
                    ...contactData,
                  });
                } else {
                  await resend.contacts.create({
                    email: user.email,
                    ...contactData,
                  });
                }
                console.log(`[resend-audience] ✅ Created contact ${user.email} as unsubscribed in Resend Audience`);
              } catch (createError) {
                console.error(`[resend-audience] ❌ Failed to create unsubscribed contact ${user.email}:`, createError);
                throw createError; // Re-throw so it's caught by outer catch
              }
            } else {
              throw new Error(`Resend API error: ${error.message} (${statusCode})`);
            }
          } else {
            console.log(`[resend-audience] ✅ Marked contact ${user.email} as unsubscribed in Resend Audience (still in audience for transactional emails)`);
          }
        } catch (updateError) {
          const errorMessage = updateError instanceof Error ? updateError.message : String(updateError);
          const errorCode = (updateError as any)?.statusCode || (updateError as any)?.code;
          
          console.error(`[resend-audience] ❌ Failed to mark contact ${user.email} as unsubscribed:`, {
            error: errorMessage,
            code: errorCode,
          });
          // Re-throw so the caller knows it failed
          throw updateError;
        }
      }
    } catch (error) {
      console.error(`[resend-audience] ❌ Failed to handle opt-out for contact ${user.email}:`, error);
    }
  } else if (!shouldAddToAudience && eventType !== 'signup') {
    // Log when we're not adding or removing (edge case)
    console.log(`[user-info] No Resend Audience action needed:`, {
      eventType,
      email: user.email,
      marketingEmails: user.marketingEmails,
      marketingEmailsValue,
    });
  }
}

/**
 * Adds a user to the "Deleted Users" segment in Resend
 * This is called when a user first deletes their account.
 * The user will be fully removed from Resend after 30 days via the cleanup script.
 *
 * @param email - The user's email address
 * @param name - The user's name (optional)
 * @param metadata - Additional metadata about the deleted account
 */
export async function addUserToDeletedUsersSegment(
  email: string,
  name?: string | null,
  metadata?: Record<string, string>
): Promise<void> {
  if (!resend) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[resend-deleted-users] Would add contact to Deleted Users segment: ${email}`);
    }
    return;
  }

  const deletedUsersSegmentId = process.env.RESEND_DELETED_USERS_SEGMENT_ID || 'c09ec259-f99a-4b4c-95b9-3905f6775369';
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  try {
    console.log(`[resend-deleted-users] Adding contact ${email} to Deleted Users segment...`);

    // Prepare contact data
    const contactData: any = {
      email,
      unsubscribed: true, // Mark as unsubscribed since account is deleted
    };

    if (name) {
      const nameParts = name.split(' ');
      contactData.firstName = nameParts[0] || undefined;
      if (nameParts.length > 1) {
        contactData.lastName = nameParts.slice(1).join(' ');
      }
    }

    // Add metadata if provided
    if (metadata) {
      contactData.metadata = metadata;
    }

    // Add deleted_at timestamp to metadata
    if (!contactData.metadata) {
      contactData.metadata = {};
    }
    contactData.metadata.deleted_at = new Date().toISOString();
    contactData.metadata.account_status = 'deleted';

    // Add contact to the Deleted Users segment
    // In Resend, segments can filter contacts by metadata or be separate audiences
    // We'll try to add the contact to the segment using the segment ID as audience ID
    // If that doesn't work, we'll update with metadata that the segment can filter on
    try {
      // Try to create/update contact in the Deleted Users segment
      // First attempt: use segment ID as audience ID (if segments can be used as audiences)
      let response;
      try {
        response = await resend.contacts.create({
          email,
          audienceId: deletedUsersSegmentId,
          ...contactData,
        });
        
        if (!response?.error) {
          console.log(`[resend-deleted-users] ✅ Added contact ${email} to Deleted Users segment`);
          return; // Success, exit early
        }
      } catch (createError: any) {
        // If create fails (contact might exist), try updating
        if (createError?.statusCode === 409 || createError?.code === 409 || createError?.statusCode === 422) {
          // Contact exists, try updating in the segment
          try {
            await resend.contacts.update({
              email,
              audienceId: deletedUsersSegmentId,
              unsubscribed: true,
              metadata: contactData.metadata,
            });
            console.log(`[resend-deleted-users] ✅ Updated contact ${email} in Deleted Users segment`);
            return;
          } catch (updateError) {
            // Fall through to main audience update
          }
        }
      }

      // Fallback: Update in main audience with metadata (segment can filter by metadata)
      if (audienceId) {
        await resend.contacts.update({
          email,
          audienceId,
          unsubscribed: true,
          metadata: contactData.metadata,
        });
      } else {
        await resend.contacts.update({
          email,
          unsubscribed: true,
          metadata: contactData.metadata,
        });
      }
      console.log(`[resend-deleted-users] ✅ Updated contact ${email} with deleted status (segment filters by metadata)`);
    } catch (error) {
      // Final fallback: just update in main audience
      try {
        if (audienceId) {
          await resend.contacts.update({
            email,
            audienceId,
            unsubscribed: true,
            metadata: contactData.metadata,
          });
        } else {
          await resend.contacts.update({
            email,
            unsubscribed: true,
            metadata: contactData.metadata,
          });
        }
        console.log(`[resend-deleted-users] ✅ Updated contact ${email} (segment may filter by metadata)`);
      } catch (fallbackError) {
        throw error; // Throw original error if fallback also fails
      }
    }
  } catch (error) {
    console.error(`[resend-deleted-users] ❌ Failed to add contact ${email} to Deleted Users segment:`, {
      error: error instanceof Error ? error.message : String(error),
      code: (error as any)?.statusCode || (error as any)?.code,
    });
    // Don't throw - account deletion should proceed even if Resend update fails
  }
}

/**
 * Removes a contact from Resend Audience completely
 *
 * IMPORTANT: This is ONLY for permanent deletion after 30 days. For initial account deletion,
 * use addUserToDeletedUsersSegment to add them to the "Deleted Users" segment.
 *
 * When a user deletes their account, we add them to the "Deleted Users" segment.
 * After 30 days, we permanently remove them from Resend via this function.
 *
 * Called by the cleanup script after 30 days
 */
export async function removeContactFromResendAudience(email: string): Promise<void> {
  if (!resend) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[resend-audience] Would remove contact: ${email}`);
    }
    return;
  }

  const audienceId = process.env.RESEND_AUDIENCE_ID;
  const deletedUsersSegmentId = process.env.RESEND_DELETED_USERS_SEGMENT_ID || 'c09ec259-f99a-4b4c-95b9-3905f6775369';

  try {
    // Remove from Deleted Users segment first
    try {
      await resend.contacts.remove({
        email,
        audienceId: deletedUsersSegmentId,
      });
      console.log(`[resend-audience] ✅ Removed contact ${email} from Deleted Users segment`);
    } catch (segmentError) {
      // Log but continue - contact might not be in segment
      console.warn(`[resend-audience] Could not remove from Deleted Users segment (may not exist):`, {
        error: segmentError instanceof Error ? segmentError.message : String(segmentError),
      });
    }

    // Remove from main audience completely
    if (audienceId) {
      await resend.contacts.remove({
        email,
        audienceId,
      });
    } else {
      await resend.contacts.remove({
        email,
      });
    }
    console.log(`[resend-audience] ✅ Removed contact ${email} from Resend Audience (permanently deleted)`);
  } catch (removeError) {
    // If remove fails, log but don't throw - contact might not exist
    console.warn(`[resend-audience] Failed to remove contact ${email} from Resend Audience:`, {
      error: removeError instanceof Error ? removeError.message : String(removeError),
      code: (removeError as any)?.statusCode || (removeError as any)?.code,
    });
  }
}

