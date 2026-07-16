import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { parse } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
const envConfig = parse(readFileSync(resolve('.env.local')));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const emailFrom = process.env.EMAIL_FROM || "Cars365 <noreply@cars365.info>";

console.log("Configuring transporter with:");
console.log({
  host: smtpHost,
  port: smtpPort,
  user: smtpUser ? "***" : "missing",
  pass: smtpPass ? "***" : "missing"
});

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  logger: true,
  debug: true
});

async function run() {
  try {
    console.log("Verifying connection...");
    await transporter.verify();
    console.log("Connection verified successfully!");

    const testEmail = "infinitewithbikash@gmail.com";
    console.log(`Sending test email to ${testEmail}...`);
    
    const info = await transporter.sendMail({
      from: emailFrom,
      to: testEmail,
      subject: "Test Email from Cars365 SES Test Script",
      text: "This is an extensive test to check if Amazon SES is correctly configured and working.",
      html: "<p>This is an <strong>extensive test</strong> to check if Amazon SES is correctly configured and working.</p>"
    });

    console.log("Message sent successfully!");
    console.log("Message ID: %s", info.messageId);
    
    // Also test one of the actual email flow functions, but just calling transporter directly is enough to verify SES.
    // The user wants to check if mail flows are working.
  } catch (error) {
    console.error("Error during email test:");
    console.error(error);
  }
}

run();
