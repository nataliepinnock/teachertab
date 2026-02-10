import { Resend } from 'resend';

/**
 * Script to list all contacts in Resend Audience
 * Run with: npx tsx lib/db/list-resend-contacts.ts
 */
async function listResendContacts() {
  const resendApiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY is not set in environment variables');
    process.exit(1);
  }

  const resend = new Resend(resendApiKey);

  console.log('🔄 Fetching contacts from Resend...\n');

  try {
    // List contacts from the audience
    let contacts: any;
    if (audienceId) {
      contacts = await resend.contacts.list({
        audienceId,
      });
    } else {
      contacts = await resend.contacts.list();
    }

    const contactsData = (contacts as any)?.data as any[] | undefined;
    if (!contactsData || contactsData.length === 0) {
      console.log('📭 No contacts found in Resend Audience');
      process.exit(0);
    }

    console.log(`📊 Found ${contactsData.length} contact(s) in Resend:\n`);

    contactsData.forEach((contact: any, index: number) => {
      const status = contact.unsubscribed ? '❌ Unsubscribed' : '✅ Subscribed';
      const name = contact.firstName || contact.lastName 
        ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
        : 'No name';
      
      console.log(`${index + 1}. ${contact.email}`);
      console.log(`   Name: ${name}`);
      console.log(`   Status: ${status}`);
      console.log(`   ID: ${contact.id || 'N/A'}`);
      if (contact.createdAt) {
        console.log(`   Created: ${new Date(contact.createdAt).toLocaleString()}`);
      }
      console.log('');
    });

    console.log(`\n✅ Total: ${contactsData.length} contact(s)`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fetching contacts:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

listResendContacts().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});

