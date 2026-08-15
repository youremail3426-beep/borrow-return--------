"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const email_service_1 = require("../services/email.service");
// Load .env from the backend root
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
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
        const result = await (0, email_service_1.sendEmail)(user, 'Test Email from App (with Logo)', '<h1>It Works!</h1><p>If you see the logo above this text, everything is correct.</p>');
        if (result) {
            console.log('✅ Email sent successfully!');
            console.log('Message ID:', result.messageId);
        }
        else {
            console.error('❌ Failed to send email (service returned null)');
        }
    }
    catch (error) {
        console.error('❌ Error executing test:', error.message);
    }
};
testEmail();
