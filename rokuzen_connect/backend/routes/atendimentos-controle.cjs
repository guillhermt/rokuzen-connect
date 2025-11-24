// routes/atendimentos-controle.cjs
const express = require("express");
const router = express.Router();
const db = require("../db.cjs");
const { autenticarToken } = require("../middleware/auth.cjs");

// TODAS ESSAS ROTAS EXIGEM LOGIN
router.use(autenticarToken);

// ================================================================
// 1. INICIAR SESSÃO EM UM POSTO
// ================================================================
router.post("/iniciar", async (req, res) => {
  const { posto_id, cliente_nome, colaborador_id } = req.body;

  if (!posto_id || !cliente_nome?.trim()) {
    return res
      .status(400)
      .json({ erro: "posto_id e cliente_nome são obrigatórios" });
  }

  // Opcional: se não mandar colaborador_id, usa o usuário logado
  const terapeuta_id = colaborador_id || req.usuario.id;

  try {
    // Verifica se o posto está livre
    const [ocupado] = await db.query(
      `
      SELECT atendimento_id FROM atendimentos 
      WHERE posto_id = ? AND fim_atendimento IS NULL
    `,
      [posto_id]
    );

    if (ocupado.length > 0) {
      return res.status(409).json({ erro: "Posto já está em uso" });
    }

    // Cria o atendimento
    const [result] = await db.query(
      `
      INSERT INTO atendimentos 
        (unidade_id, posto_id, cliente_id, colaborador_id, inicio_atendimento, foi_marcado_online)
      VALUES (
        (SELECT unidade_id FROM postos WHERE posto_id = ?),
        ?, NULL, ?, NOW(), 'N'
      )
    `,
      [posto_id, posto_id, terapeuta_id]
    );

    // Se o cliente não existe, cria um cliente "walk-in"
    let cliente_id = null;
    const nome = cliente_nome.trim();

    const [clienteExistente] = await db.query(
      `SELECT cliente_id FROM clientes WHERE nome_cliente = ? LIMIT 1`,
      [nome]
    );

    if (clienteExistente.length > 0) {
      cliente_id = clienteExistente[0].cliente_id;
    } else {
      const [cli] = await db.query(
        `INSERT INTO clientes (nome_cliente) VALUES (?)`,
        [nome]
      );
      cliente_id = cli.insertId;
    }

    // Atualiza o atendimento com o cliente
    await db.query(
      `UPDATE atendimentos SET cliente_id = ? WHERE atendimento_id = ?`,
      [cliente_id, result.insertId]
    );

    res.json({
      sucesso: true,
      atendimento_id: result.insertId,
      mensagem: "Sessão iniciada com sucesso!",
      inicio: new Date().toLocaleTimeString(),
    });
  } catch (err) {
    console.error("Erro ao iniciar sessão:", err);
    res.status(500).json({ erro: "Erro interno ao iniciar sessão" });
  }
});

// ================================================================
// 2. FINALIZAR SESSÃO
// ================================================================
router.post("/finalizar", async (req, res) => {
  const { posto_id } = req.body;

  if (!posto_id) {
    return res.status(400).json({ erro: "posto_id é obrigatório" });
  }

  try {
    const [result] = await db.query(
      `
      UPDATE atendimentos 
      SET fim_atendimento = NOW()
      WHERE posto_id = ? AND fim_atendimento IS NULL
    `,
      [posto_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Nenhuma sessão ativa neste posto" });
    }

    res.json({
      sucesso: true,
      mensagem: "Sessão finalizada com sucesso!",
      fim: new Date().toLocaleTimeString(),
    });
  } catch (err) {
    console.error("Erro ao finalizar sessão:", err);
    res.status(500).json({ erro: "Erro ao finalizar sessão" });
  }
});

// ================================================================
// 3. TROCAR STATUS DE MANUTENÇÃO
// ================================================================
router.post("/manutencao", async (req, res) => {
  const { posto_id, ativar = true } = req.body;

  if (!posto_id) {
    return res.status(400).json({ erro: "posto_id é obrigatório" });
  }

  try {
    // Não permite manutenção se estiver ocupado
    const [ocupado] = await db.query(
      `
      SELECT atendimento_id FROM atendimentos 
      WHERE posto_id = ? AND fim_atendimento IS NULL
    `,
      [posto_id]
    );

    if (ocupado.length > 0) {
      return res
        .status(409)
        .json({ erro: "Posto está em uso. Finalize a sessão primeiro." });
    }

    await db.query(`UPDATE postos SET em_manutencao = ? WHERE posto_id = ?`, [
      ativar ? "S" : "N",
      posto_id,
    ]);

    res.json({
      sucesso: true,
      em_manutencao: ativar,
      mensagem: ativar ? "Posto em manutenção" : "Posto liberado",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao alterar manutenção" });
  }
});

module.exports = router;
