import nodemailer from "nodemailer";

const sendForgotPasswordEmail = async (email, subject, resetUrl) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html: `
      <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Forgot Password</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f8f9fa;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      border: 1px solid #000;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      padding: 20px;
      text-align: center;
    }
    .email-header {
      font-size: 20px;
      font-weight: bold;
      color: #333333;
      margin-bottom: 10px;
    }
    .email-message {
      font-size: 16px;
      color: #555555;
      margin-bottom: 20px;
    }
    .email-footer {
      font-size: 14px;
      color: #999999;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">Reset Your Password</div>
    <div class="email-message">
      You requested to reset your password. Click the button below to reset it:
    </div>
    <a 
      href="${resetUrl}" 
      style="
        display: inline-block;
        font-size: 16px;
        font-weight: bold;
        color: #000; 
        border: 1px solid #000;
        text-decoration: none;
        padding: 10px 20px;
        border-radius: 5px;
        margin-top: 20px;
        background-color: #fff;
        transition: background-color 0.3s ease, color 0.3s ease;"
      
    >
      Reset Password
    </a>
    <div class="email-footer">
      If you didn't request this, you can safely ignore this email.
    </div>
  </div>
</body>
</html>


    `,
  };

  await transporter.sendMail(mailOptions);
};

export default sendForgotPasswordEmail;
