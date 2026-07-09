const nodemailer = require("nodemailer");

async function testSmtp() {
  const transporter = nodemailer.createTransport({
    host: "email-smtp.ap-southeast-2.amazonaws.com",
    port: 465,
    secure: true,
    auth: {
      user: "AKIAT3STWTTRRYLGNUFV",
      pass: "BJAbtXLb/IGLJXuvaD6+gCPG9GWGgUUfhFgW1ZqzAkvs",
    },
  });

  try {
    const info = await transporter.sendMail({
      from: "Hire Car Marketplace <noreply@hirecarmarketplace.com.au>",
      to: "anandujjawalofficial11@gmail.com",
      subject: "Test SES",
      text: "Testing SES credentials",
    });
    console.log("Success:", info.messageId);
  } catch (error) {
    console.error("Error code:", error.responseCode);
    console.error("Error response:", error.response);
  }
}

testSmtp();
