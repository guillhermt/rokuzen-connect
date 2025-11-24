// routes/horarios.cjs
const express = require("express");
const router = express.Router();
const db = require("../db.cjs");
const { autenticarToken, somenteAdmin } = require("../middleware/auth.cjs");

// ================== LISTAR HORÁRIOS DA UNIDADE ==================
router.get("/", async (req, res) => {
  const { unidade_id } = req.query;
  if (!unidade_id) return res.status(400).json({ erro: "unidade_id obrigatório" });

  try {
    const [rows] = await db.query(
      `SELECT horario_id, dia_semana, horario 
       FROM horarios 
       WHERE unidade_id = ? AND ativo = 'S'
       ORDER BY dia_semana, horario`,
      [unidade_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar horários" });
  }
});

// ================== HORÁRIOS DISPONÍVEIS (PARA AGENDAMENTO) ==================
router.get("/disponiveis", async (req, res) => {
  const { unidade_id, data } = req.query;
  if (!unidade_id || !data) return res.status(400).json({ erro: "unidade_id e data são obrigatórios" });

  try {
    const diaSemana = new Date(data).getDay(); // 0=Domingo, 1=Segunda...

    const [horarios] = await db.query(
      `SELECT 
         h.horario_id AS id,
         DATE_FORMAT(h.horario, '%H:%i') AS horario,
         COALESCE(c.nome_colaborador, 'Livre') AS terapeuta
       FROM horarios h
       LEFT JOIN colaboradores c ON c.colaborador_id = h.terapeuta_id
       WHERE h.unidade_id = ? AND h.dia_semana = ? AND h.ativo = 'S'
       ORDER BY h.horario`,
      [unidade_id, diaSemana]
    );

    res.json(horarios || []);
  } catch (err) {
    console.error("Erro /disponiveis:", err);
    res.status(500).json({ erro: "Erro ao buscar horários disponíveis" });
  }
});

// ================== SÓ ADMIN PODE CRIAR/EDITAR/EXCLUIR ==================
router.use(autenticarToken);
router.use(somenteAdmin);

// ADICIONAR HORÁRIO
router.post("/", async (req, res) => {
  const { unidade_id, dia_semana, horario } = req.body;

  if (!unidade_id || dia_semana === undefined || !horario) {
    return res.status(400).json({ erro: "Faltam dados: unidade_id, dia_semana ou horario" });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO horarios (unidade_id, dia_semana, horario, ativo)
       VALUES (?, ?, ?, 'S')`,
      [unidade_id, dia_semana, horario]
    );

    res.status(201).json({
      mensagem: "Horário adicionado com sucesso!",
      horario_id: result.insertId
    });
  } catch (err) {
    console.error("Erro ao adicionar horário:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ erro: "Este horário já existe nesta unidade" });
    }
    res.status(500).json({ erro: "Erro ao salvar horário" });
  }
});

// EXCLUIR HORÁRIO
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(
      `DELETE FROM horarios WHERE horario_id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Horário não encontrado" });
    }

    res.json({ mensagem: "Horário excluído com sucesso!" });
  } catch (err) {
    console.error("Erro ao excluir horário:", err);
    res.status(500).json({ erro: "Erro ao excluir horário" });
  }
});

module.exports = router;