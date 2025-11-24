// routes/gerenciarUsuarios.cjs
const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db.cjs");
const { autenticarToken, somenteAdmin } = require("../middleware/auth.cjs");

// CARREGA A FUNÇÃO DE E-MAIL COM DEBUG FORTE
let enviarSenhaEmail;
let gerarSenhaAleatoria;

try {
  const emailModule = require("./senhaPorEmail.cjs");
  enviarSenhaEmail = emailModule.enviarSenhaEmail;
  gerarSenhaAleatoria =
    emailModule.gerarSenhaAleatoria ||
    (() => {
      // fallback caso não tenha no outro arquivo
      const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%&";
      return Array(12)
        .fill()
        .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
        .join("");
    });
} catch (e) {
  // Funções falsas pra não quebrar tudo
  enviarSenhaEmail = async () => (gerarSenhaAleatoria = () => "TEMP12345678");
}

const router = express.Router();

// LISTAR TODOS OS USUÁRIOS
router.get("/", autenticarToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        colaborador_id,
        nome_colaborador,
        email,
        telefone,
        tipo_colaborador,
        ativo
      FROM colaboradores
      ORDER BY nome_colaborador
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao listar usuários" });
  }
});

// ADICIONA ISSO NO SEU routes/gerenciarUsuarios.cjs (ou colaboradores.cjs)
router.get("/:id", autenticarToken, somenteAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT colaborador_id, nome_colaborador, email, telefone, tipo_colaborador FROM colaboradores WHERE colaborador_id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Colaborador não encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Erro ao buscar colaborador:", error);
    res.status(500).json({ erro: "Erro no servidor" });
  }
});

// CRIAR NOVO USUÁRIO
router.post("/", autenticarToken, somenteAdmin, async (req, res) => {
  const { nome_colaborador, email, telefone, tipo_colaborador } = req.body;

  if (!nome_colaborador || !email || !tipo_colaborador) {
    return res
      .status(400)
      .json({ erro: "Nome, e-mail e tipo são obrigatórios" });
  }

  try {
    const senhaTemp = gerarSenhaAleatoria();
    const hash = await bcrypt.hash(senhaTemp, 10);

    const [result] = await db.query(
      `INSERT INTO colaboradores 
       (nome_colaborador, email, telefone, tipo_colaborador, senha, ativo)
       VALUES (?, ?, ?, ?, ?, 'S')`,
      [nome_colaborador, email, telefone || null, tipo_colaborador, hash]
    );

    // TENTA ENVIAR E-MAIL
    try {
      if (typeof enviarSenhaEmail === "function") {
        await enviarSenhaEmail(email, nome_colaborador, senhaTemp);
        return res.status(201).json({
          mensagem: "Colaborador criado e senha enviada por e-mail!",
        });
      } else {
        throw new Error("Função de e-mail não disponível");
      }
    } catch (emailErr) {
      return res.status(201).json({
        mensagem: "Colaborador criado, mas falha ao enviar e-mail",
        senha_temporaria: senhaTemp, // só em desenvolvimento!
      });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ erro: "Erro ao criar usuário", detalhes: err.message });
  }
});

// EDITAR USUÁRIO
router.put("/:id", autenticarToken, somenteAdmin, async (req, res) => {
  const { nome_colaborador, email, telefone, tipo_colaborador } = req.body;
  const { id } = req.params;

  try {
    await db.query(
      `UPDATE colaboradores SET
        nome_colaborador = ?,
        email = ?,
        telefone = ?,
        tipo_colaborador = ?
       WHERE colaborador_id = ?`,
      [nome_colaborador, email, telefone || null, tipo_colaborador, id]
    );
    res.json({ mensagem: "Usuário atualizado com sucesso" });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao atualizar" });
  }
});

// DELETAR USUÁRIO
router.delete("/:id", autenticarToken, somenteAdmin, async (req, res) => {
  try {
    await db.query("DELETE FROM colaboradores WHERE colaborador_id = ?", [
      req.params.id,
    ]);
    res.json({ mensagem: "Usuário excluído com sucesso" });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao excluir" });
  }
});

module.exports = router;
