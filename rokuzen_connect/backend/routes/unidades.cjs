// routes/unidades.cjs
const express = require("express");
const router = express.Router();
const db = require("../db.cjs");
const { autenticarToken, somenteAdmin } = require("../middleware/auth.cjs");

// ============== ROTAS PÚBLICAS (qualquer pessoa pode ver) ==============
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        unidade_id,
        nome_unidade,
        endereco,
        telefone,
        ativo
      FROM unidades 
      ORDER BY nome_unidade
    `);
    res.json(rows);
  } catch (err) {
    console.error("Erro ao listar unidades:", err);
    res.status(500).json({ erro: "Erro interno" });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT unidade_id, nome_unidade, endereco, telefone, ativo
       FROM unidades WHERE unidade_id = ?`,
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ erro: "Unidade não encontrada" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar unidade" });
  }
});

// ============== SÓ ADMIN ==============
router.use(autenticarToken);
router.use(somenteAdmin); // agora aplica pra todos os métodos abaixo

// POST - CRIAR NOVA UNIDADE
router.post("/", async (req, res) => {
  const { nome_unidade, endereco, telefone, ativo = "S" } = req.body;

  if (!nome_unidade || nome_unidade.trim() === "")
    return res.status(400).json({ erro: "Nome da unidade é obrigatório" });

  try {
    const [result] = await db.query(
      `INSERT INTO unidades (nome_unidade, endereco, telefone, ativo)
       VALUES (?, ?, ?, ?)`,
      [nome_unidade.trim(), endereco || null, telefone || null, ativo]
    );

    res.status(201).json({
      mensagem: "Unidade criada com sucesso",
      unidade_id: result.insertId
    });
  } catch (err) {
    console.error("Erro ao criar unidade:", err);
    if (err.code === "ER_DUP_ENTRY")
      return res.status(400).json({ erro: "Já existe uma unidade com esse nome" });
    res.status(500).json({ erro: "Erro ao salvar unidade" });
  }
});

// PUT - EDITAR UNIDADE
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nome_unidade, endereco, telefone, ativo } = req.body;

  if (!nome_unidade || nome_unidade.trim() === "")
    return res.status(400).json({ erro: "Nome da unidade é obrigatório" });

  try {
    const [result] = await db.query(
      `UPDATE unidades 
       SET nome_unidade = ?, endereco = ?, telefone = ?, ativo = ?, atualizado_em = NOW()
       WHERE unidade_id = ?`,
      [nome_unidade.trim(), endereco || null, telefone || null, ativo || "S", id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ erro: "Unidade não encontrada" });

    res.json({ mensagem: "Unidade atualizada com sucesso" });
  } catch (err) {
    console.error("Erro ao editar unidade:", err);
    res.status(500).json({ erro: "Erro ao atualizar unidade" });
  }
});

// DELETE - EXCLUIR UNIDADE
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Primeiro tenta apagar (se tiver horários/postos com ON DELETE CASCADE, vai junto)
    const [result] = await db.query(`DELETE FROM unidades WHERE unidade_id = ?`, [id]);

    if (result.affectedRows === 0)
      return res.status(404).json({ erro: "Unidade não encontrada" });

    res.json({ mensagem: "Unidade excluída com sucesso" });
  } catch (err) {
    console.error("Erro ao excluir unidade:", err);
    res.status(500).json({ erro: "Erro ao excluir (pode ter dados relacionados)" });
  }
});

module.exports = router;