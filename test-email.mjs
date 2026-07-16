import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Manual .env.local parse
const envContent = readFileSync(resolve('.env.local'), 'utf-8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#\s][^=]+)=(.*)$/);
  if (match) {
    let key = match[1].trim();
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
});

const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

// Change to the default from ses.ts to check if it's verified
const emailFrom = "Cars365 <noreply@cars365.info>";

console.log("Configuring transporter with:");
console.log({
  host: smtpHost,
  port: smtpPort,
  user: smtpUser ? "***" : "missing",
  pass: smtpPass ? "***" : "missing",
  from: emailFrom
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
  } catch (error) {
    console.error("Error during email test:");
    console.error(error);
  }
}

run();
