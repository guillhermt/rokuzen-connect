const jwt = require("jsonwebtoken");

function autenticarToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ erro: "Token não fornecido" });

  jwt.verify(
    token,
    process.env.JWT_SECRET || "segredo_super_secreto",
    (err, usuario) => {
      if (err) return res.status(403).json({ erro: "Token inválido" });

      req.usuario = usuario;
      next();
    }
  );
}

// Apenas ADMIN (tipo 1)
function somenteAdmin(req, res, next) {
  if (!req.usuario || req.usuario.tipo_colaborador !== 1) {
    return res.status(403).json({
      erro: "Acesso restrito a administradores",
    });
  }
  next();
}

module.exports = { autenticarToken, somenteAdmin };
