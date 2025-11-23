const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db.cjs");

const router = express.Router();

router.post("/", async (req, res) => {
  const { email, senha } = req.body;

  try {
    const [rows] = await db.query(
      'SELECT * FROM colaboradores WHERE email = ? AND ativo = "S"',
      [email]
    );

    if (!rows.length)
      return res.status(401).json({ erro: "Usuário ou senha inválidos" });

    const usuario = rows[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida)
      return res.status(401).json({ erro: "Usuário ou senha inválidos" });

    await db.query(
      "UPDATE colaboradores SET ultimo_login = NOW() WHERE colaborador_id = ?",
      [usuario.colaborador_id]
    );

    const token = jwt.sign(
      {
        colaborador_id: usuario.colaborador_id,
        nome: usuario.nome_colaborador,
        tipo_colaborador: usuario.tipo_colaborador,
      },
      process.env.JWT_SECRET || "segredo_super_secreto",
      { expiresIn: "8h" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ erro: "Erro no login", detalhes: err.message });
  }
});

module.exports = router;