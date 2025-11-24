router.post("/cliente", async (req, res) => {
  const { nome, telefone, email, unidade_id } = req.body;

  try {
    const [horarios] = await db.query(
      `
      SELECT horario_id, data_hora 
      FROM horarios 
      WHERE unidade_id = ? AND disponivel = 'S'
      ORDER BY data_hora ASC
      LIMIT 1
      `,
      [unidade_id]
    );

    if (!horarios.length) {
      return res.status(400).json({ erro: "Nenhum horário disponível." });
    }

    const horario = horarios[0];

    // ✅ Verificar se o cliente já tem agendamento neste horário
    const [existe] = await db.query(
      `
      SELECT a.id
      FROM agendamentos a
      JOIN clientes c ON c.id = a.cliente_id
      WHERE c.telefone = ? AND a.horario_id = ?
      `,
      [telefone, horario.horario_id]
    );

    if (existe.length) {
      return res
        .status(400)
        .json({ erro: "Você já possui agendamento neste horário." });
    }

    const [clienteResult] = await db.query(
      "INSERT INTO clientes (nome, telefone, email) VALUES (?, ?, ?)",
      [nome, telefone, email]
    );

    const clienteId = clienteResult.insertId;

    await db.query(
      `
      INSERT INTO agendamentos (cliente_id, horario_id, unidade_id) 
      VALUES (?, ?, ?)
      `,
      [clienteId, horario.horario_id, unidade_id]
    );

    await db.query(
      "UPDATE horarios SET disponivel = 'N' WHERE horario_id = ?",
      [horario.horario_id]
    );

    res.json({ sucesso: true, horario: horario.data_hora });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao agendar", detalhes: err.message });
  }
});

router.get("/cliente/historico/:telefone", async (req, res) => {
  const { telefone } = req.params;

  const [dados] = await db.query(
    `
SELECT a.id, h.data_hora, u.nome_unidade
FROM agendamentos a
JOIN clientes c ON c.id = a.cliente_id
JOIN horarios h ON h.horario_id = a.horario_id
JOIN unidades u ON u.id = a.unidade_id
WHERE c.telefone = ?
ORDER BY h.data_hora DESC
`,
    [telefone]
  );

  res.json(dados);
});
