const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

async function enviarSenhaEmail(destino, nome, senha) {
  await transporter.sendMail({
    from: `"Sistema" <${process.env.MAIL_USER}>`,
    to: destino,
    subject: "Acesso ao sistema",
    html: `
      <h3>Olá ${nome}</h3>
      <p>Seu acesso ao sistema foi criado.</p>
      <p><strong>Senha provisória:</strong> ${senha}</p>
      <p>Recomendamos alterar após o primeiro login.</p>
    `,
  });
}

module.exports = { enviarSenhaEmail };