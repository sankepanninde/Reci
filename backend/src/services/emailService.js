const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(toEmail, subject, htmlContent) {
  try {
    const data = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to: toEmail,
      subject,
      html: htmlContent,
    });
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Error enviando Email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendEmail };