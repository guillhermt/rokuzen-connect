const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db.cjs");
const { autenticarToken, somenteAdmin } = require("../middleware/auth.cjs");
const { enviarSenhaEmail } = require("./senhaPorEmail.cjs");

const router = express.Router();

function gerarSenhaAleatoria(tamanho = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#!";
  let senha = "";

  for (let i = 0; i < tamanho; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return senha;
}

router.post("/", autenticarToken, somenteAdmin, async (req, res) => {
  const { nome_colaborador, email, telefone, tipo_colaborador } = req.body;

  try {
    const senhaGerada = gerarSenhaAleatoria(8);
    const senhaHash = await bcrypt.hash(senhaGerada, 10);

    await db.query(
      `
      INSERT INTO colaboradores
      (nome_colaborador, email, telefone, tipo_colaborador, senha)
      VALUES (?, ?, ?, ?, ?)`
    ,
      [nome_colaborador, email, telefone, tipo_colaborador, senhaHash]
    );

    // ENVIA EMAIL COM A SENHA
    await enviarSenhaEmail(email, nome_colaborador, senhaGerada);

    res.status(201).json({
      mensagem: "Usuário cadastrado com sucesso e senha enviada por email",
    });
  } catch (error) {
    res.status(500).json({
      erro: "Erro ao cadastrar usuário",
      detalhes: error.message,
    });
  }
});

module.exports = router;