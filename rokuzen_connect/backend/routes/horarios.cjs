// routes/horarios.cjs (ou onde estiver suas rotas de horário)

const express = require("express");
const router = express.Router();
const db = require("../db.cjs");
const { autenticarToken } = require("../middleware/auth.cjs");

// LISTA TODOS OS HORÁRIOS DA UNIDADE (já existe, provavelmente)
router.get("/", async (req, res) => {
  const { unidade_id } = req.query;
  if (!unidade_id)
    return res.status(400).json({ erro: "unidade_id é obrigatório" });

  try {
    const [rows] = await db.query(
      `
      SELECT horario_id, dia_semana, horario 
      FROM horarios 
      WHERE unidade_id = ? 
      ORDER BY dia_semana, horario
    `,
      [unidade_id]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao buscar horários" });
  }
});

// routes/horarios.cjs → SUBSTITUA A ROTA /disponiveis POR ESSA
router.get("/disponiveis", async (req, res) => {
  const { unidade_id, data } = req.query;

  if (!unidade_id || !data) {
    return res.status(400).json({ erro: "unidade_id e data são obrigatórios" });
  }

  try {
    const diaSemana = new Date(data).getDay(); // 0=Domingo, 1=Segunda...

    const [horarios] = await db.query(
      `
      SELECT 
        h.horario_id AS id,
        DATE_FORMAT(h.horario, '%H:%i') AS horario,
        COALESCE(c.nome_colaborador, 'Livre') AS terapeuta
      FROM horarios h
      LEFT JOIN colaboradores c ON c.colaborador_id = h.terapeuta_id
      WHERE h.unidade_id = ?
        AND h.dia_semana = ?
        AND h.ativo = 'S'
      ORDER BY h.horario
    `,
      [unidade_id, diaSemana]
    );

    res.json(horarios || []);
  } catch (err) {
    console.error("ERRO COMPLETO NA ROTA /horarios/disponiveis:", err);
    res.status(500).json({
      erro: "Erro ao buscar horários",
      detalhes: err.message,
    });
  }
});

module.exports = router;
