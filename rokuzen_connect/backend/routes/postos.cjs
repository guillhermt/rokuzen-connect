// routes/postos.cjs
const express = require("express");
const router = express.Router();
const db = require("../db.cjs");
const { autenticarToken } = require("../middleware/auth.cjs");

// LISTAR POSTOS COM STATUS EM TEMPO REAL (público ou interno)
router.get("/", async (req, res) => {
  const { unidade_id } = req.query;
  if (!unidade_id)
    return res.status(400).json({ erro: "unidade_id obrigatório" });

  try {
    const [rows] = await db.query(
      `
      SELECT 
        p.posto_id AS id,
        p.nome_posto,
        p.tipo_posto,
        p.em_manutencao,
        -- Status atual do posto
        CASE 
          WHEN a.atendimento_id IS NOT NULL AND a.fim_atendimento IS NULL THEN 'ocupado'
          WHEN p.em_manutencao = 'S' THEN 'manutencao'
          ELSE 'livre'
        END AS status,
        c.nome_colaborador AS terapeuta,
        cl.nome_cliente AS cliente,
        a.inicio_atendimento
      FROM postos p
      LEFT JOIN atendimentos a ON p.posto_id = a.posto_id AND a.fim_atendimento IS NULL
      LEFT JOIN colaboradores c ON a.colaborador_id = c.colaborador_id
      LEFT JOIN clientes cl ON a.cliente_id = cl.cliente_id
      WHERE p.unidade_id = ? AND p.ativo = 'S'
      ORDER BY p.nome_posto
    `,
      [unidade_id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao carregar postos" });
  }
});

module.exports = router;
