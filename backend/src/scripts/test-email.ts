import dotenv from 'dotenv';
import path from 'path';
import { sendEmail } from '../services/email.service';

// Load .env from the backend root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const testEmail = async () => {
    const user = process.env.EMAIL_USER;

    console.log('--- Email Integration Test (with Logo) ---');
    console.log(`Sending to: ${user}`);

    if (!user) {
        console.error('ERROR: EMAIL_USER is missing in .env');
        return;
    }

    try {
        console.log('Sending test email via email.service (should include logo)...');
        // sending a simple HTML body, the service should prepend the logo
        const result = await sendEmail(
            user,
            'Test Email from App (with Logo)',
            '<h1>It Works!</h1><p>If you see the logo above this text, everything is correct.</p>'
        );

        if (result) {
            console.log('✅ Email sent successfully!');
            console.log('Message ID:', result.messageId);
        } else {
            console.error('❌ Failed to send email (service returned null)');
        }
    } catch (error: any) {
        console.error('❌ Error executing test:', error.message);
    }
};

testEmail();
