const { Resend } = require('resend');

// 🔒 Inicialización diferida (lazy). NO se ejecuta al importar el módulo.
let resendClient = null;

function getResend() {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error(
        'RESEND_API_KEY no está configurada. Definila en .env para enviar emails.'
      );
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

async function sendEmail(toEmail, subject, htmlContent) {
  try {
    const resend = getResend();
    const data = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to: toEmail,
      subject,
      html: htmlContent,
    });
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Error enviando Email:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendEmail };