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
        unidade_id AS id,
        nome_unidade,
        endereco,
        telefone,
        ativo
      FROM unidades 
      WHERE ativo = 'S'
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
      `SELECT unidade_id AS id, nome_unidade, endereco, telefone, ativo
       FROM unidades WHERE unidade_id = ? AND ativo = 'S'`,
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ erro: "Não encontrada" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao buscar unidade" });
  }
});

// ============== A PARTIR DAQUI SÓ USUÁRIOS LOGADOS ==============
router.use(autenticarToken);

router.post("/", somenteAdmin, async (req, res) => {
  /* seu código */
});
router.put("/:id", somenteAdmin, async (req, res) => {
  /* seu código */
});
router.delete("/:id", somenteAdmin, async (req, res) => {
  /* seu código */
});

module.exports = router;
