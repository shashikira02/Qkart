const nodemailer = require("nodemailer");
const config = require("./config");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

const sendResetEmail = (toEmail, resetToken) => {
  const resetLink = `${config.clientUrl}/reset-password?token=${resetToken}`;
  return transporter.sendMail({
    from: `"QKart Support" <${config.email.user}>`,
    to: toEmail,
    subject: "QKart Password Reset",
    html: `
      <h3>Password Reset Request</h3>
      <p>Click the link below to reset your password. This link expires in 15 minutes.</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>If you did not request this, ignore this email.</p>
    `,
  });
};

module.exports = { sendResetEmail };
