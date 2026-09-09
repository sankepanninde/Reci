const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // SSL directo, recomendado en Railway
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  // Opcional: si hay problemas de certificados, descomenta esta línea temporalmente
  // tls: { rejectUnauthorized: false },
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