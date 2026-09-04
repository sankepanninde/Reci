const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendEmail(toEmail, subject, htmlContent) {
  try {
    const info = await transporter.sendMail({
      from: `"Bap Inmobiliaria" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject,
      text: htmlContent.replace(/<[^>]*>/g, ''),
      html: htmlContent,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error enviando Email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendEmail };