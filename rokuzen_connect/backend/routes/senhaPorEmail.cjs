// email.js → VERSÃO COM DEBUG TOTAL (2025)
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false, // true só porta 465
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// TESTE IMEDIATO NA INICIALIZAÇÃO DO SERVIDOR
transporter.verify((error, success) => {
  if (error) {
    if (error.code === "EAUTH") {
      console.error(
        "Autenticação falhou → App Password errada ou conta sem 2FA"
      );
    }
    if (error.code === "ESOCKET") {
      console.error("Problema de rede/porta → porta 587 bloqueada?");
    }
  } else {
    console.log("SMTP CONECTADO E PRONTO! Você já pode enviar e-mails");
  }
});

async function enviarSenhaEmail(destino, nome, senha) {
  const mailOptions = {
    from: `"ROKUZEN" <${process.env.MAIL_USER}>`,
    to: destino,
    subject: "Bem-vindo ao ROKUZEN - Sua senha de acesso",
    html: `
      <div style="font-family: Arial; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background: #f9f9f9;">
        <h2 style="color: #a3c441;">Olá, ${nome.split(" ")[0]}!</h2>
        <p>Seu acesso ao sistema foi criado.</p>
        <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; border: 2px dashed #a3c441;">
          <p><strong>Sua senha provisória:</strong></p>
          <h3 style="letter-spacing: 3px; color: #a3c441; font-size: 1.8rem;">${senha}</h3>
        </div>
        <p><a href="http://localhost:5500/screens/login.html" style="color: #a3c441; font-weight: bold;">Acessar o sistema</a></p>
        <small>Esta é uma mensagem automática.</small>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    return info;
  } catch (error) {
    // Mensagens amigáveis para os erros mais comuns
    if (error.code === "EAUTH") {
      console.error(
        "→ Credenciais inválidas. Verifique o App Password novamente (16 caracteres com espaços)"
      );
    }
    if (error.code === "EDNS") {
      console.error("→ Problema de DNS ou rede");
    }
    if (error.responseCode === 535) {
      console.error("→ 535 = autenticação rejeitada (senha errada)");
    }

    throw error; // repassa o erro pra quem chamou
  }
}

module.exports = { enviarSenhaEmail };
