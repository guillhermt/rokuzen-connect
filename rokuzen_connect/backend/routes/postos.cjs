// backend/routes/postos.cjs  → VERSÃO FINAL E COMPLETA (FUNCIONA 100%)

const express = require("express");
const router = express.Router();
const db = require("../db.cjs");
const { autenticarToken } = require("../middleware/auth.cjs");

// === LISTAR POSTOS DE UMA UNIDADE (com status em tempo real) ===
router.get("/unidade/:unidade_id", autenticarToken, async (req, res) => {
  const { unidade_id } = req.params;

  try {
    const [rows] = await db.query(
      `
      SELECT 
        p.posto_id,
        p.nome_posto,
        p.tipo_posto,
        p.em_manutencao,
        CASE 
          WHEN a.atendimento_id IS NOT NULL AND a.fim_atendimento IS NULL THEN 'ocupado'
          WHEN p.em_manutencao = 'S' THEN 'manutencao'
          ELSE 'livre'
        END AS status,
        c.nome_colaborador AS terapeuta_nome,
        cl.nome_cliente AS cliente_nome,
        a.inicio_atendimento,
        a.atendimento_id
      FROM postos p
      LEFT JOIN atendimentos a 
        ON p.posto_id = a.posto_id 
        AND a.fim_atendimento IS NULL
      LEFT JOIN colaboradores c ON a.colaborador_id = c.colaborador_id
      LEFT JOIN clientes cl ON a.cliente_id = cl.cliente_id
      WHERE p.unidade_id = ? AND p.ativo = 'S'
      ORDER BY p.nome_posto
      `,
      [unidade_id]
    );

    res.json(rows);
  } catch (err) {
    console.error("Erro na rota GET /postos/unidade:", err);
    res.status(500).json({ erro: "Erro ao carregar postos" });
  }
});

// === CRIAR NOVO POSTO ===
router.post("/", autenticarToken, async (req, res) => {
  const { unidade_id, nome_posto, tipo_posto = "maca", em_manutencao = "N" } = req.body;

  if (!unidade_id || !nome_posto) {
    return res.status(400).json({ erro: "unidade_id e nome_posto são obrigatórios" });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO postos 
       (unidade_id, nome_posto, tipo_posto, em_manutencao, ativo) 
       VALUES (?, ?, ?, ?, 'S')`,
      [unidade_id, nome_posto.trim(), tipo_posto, em_manutencao]
    );

    res.status(201).json({ 
      posto_id: result.insertId, 
      mensagem: "Posto criado com sucesso" 
    });
  } catch (err) {
    console.error("Erro ao criar posto:", err);
    res.status(500).json({ erro: "Erro ao criar posto" });
  }
});

// === EDITAR POSTO ===
router.put("/:id", autenticarToken, async (req, res) => {
  const { id } = req.params;
  const { nome_posto, tipo_posto, em_manutencao } = req.body;

  if (!nome_posto) {
    return res.status(400).json({ erro: "nome_posto é obrigatório" });
  }

  try {
    await db.query(
      `UPDATE postos 
       SET nome_posto = ?, tipo_posto = ?, em_manutencao = ? 
       WHERE posto_id = ?`,
      [nome_posto.trim(), tipo_posto || "maca", em_manutencao || "N", id]
    );

    res.json({ sucesso: true, mensagem: "Posto atualizado" });
  } catch (err) {
    console.error("Erro ao editar posto:", err);
    res.status(500).json({ erro: "Erro ao editar posto" });
  }
});

// === EXCLUIR POSTO (soft delete) ===
router.delete("/:id", autenticarToken, async (req, res) => {
  const { id } = req.params;

  try {
    await db.query(
      `UPDATE postos SET ativo = 'N' WHERE posto_id = ?`,
      [id]
    );

    res.json({ sucesso: true, mensagem: "Posto removido" });
  } catch (err) {
    console.error("Erro ao excluir posto:", err);
    res.status(500).json({ erro: "Erro ao excluir posto" });
  }
});

module.exports = router;