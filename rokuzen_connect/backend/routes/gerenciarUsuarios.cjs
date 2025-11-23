const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db.cjs");
const { autenticarToken, somenteAdmin } = require("../middleware/auth.cjs");

const router = express.Router();

/* =========================
   LISTAR USUÁRIOS
   GET /colaboradores
========================= */
router.get("/", autenticarToken, somenteAdmin, async (req, res) => {
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
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao listar usuários" });
  }
});

/* =========================
   CRIAR USUÁRIO
   POST /colaboradores
========================= */
router.post("/", autenticarToken, somenteAdmin, async (req, res) => {
  const { nome_colaborador, email, telefone, tipo_colaborador } = req.body;

  try {
    const senhaGerada = Math.random().toString(36).slice(-8);
    const senhaHash = await bcrypt.hash(senhaGerada, 10);

    await db.query(
      `INSERT INTO colaboradores
      (nome_colaborador, email, telefone, tipo_colaborador, senha)
      VALUES (?, ?, ?, ?, ?)`,
      [nome_colaborador, email, telefone, tipo_colaborador, senhaHash]
    );

    // Aqui você pode enviar por email depois
    res.status(201).json({
      mensagem: "Usuário criado com sucesso",
      senha_temporaria: senhaGerada,
    });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao criar usuário" });
  }
});

/* =========================
   EDITAR USUÁRIO
   PUT /colaboradores/:id
========================= */
router.put("/:id", autenticarToken, somenteAdmin, async (req, res) => {
  const { nome_colaborador, email, telefone, tipo_colaborador } = req.body;

  try {
    await db.query(
      `UPDATE colaboradores SET
        nome_colaborador = ?,
        email = ?,
        telefone = ?,
        tipo_colaborador = ?
       WHERE colaborador_id = ?`,
      [nome_colaborador, email, telefone, tipo_colaborador, req.params.id]
    );

    res.json({ mensagem: "Usuário atualizado com sucesso" });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao atualizar usuário" });
  }
});

/* =========================
   EXCLUIR USUÁRIO
   DELETE /colaboradores/:id
========================= */
router.delete("/:id", autenticarToken, somenteAdmin, async (req, res) => {
  try {
    await db.query("DELETE FROM colaboradores WHERE colaborador_id = ?", [
      req.params.id,
    ]);

    res.json({ mensagem: "Usuário excluído com sucesso" });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao excluir usuário" });
  }
});

module.exports = router;