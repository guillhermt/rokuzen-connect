require("dotenv").config();
const express = require("express");
const cors = require("cors");

const loginRoutes = require("./routes/login.cjs");
const cadastroRoutes = require("./routes/cadastro.cjs");
const colaboradoresRoutes = require("./routes/gerenciarUsuarios.cjs");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/login", loginRoutes);
app.use("/usuarios", cadastroRoutes);
app.use("/colaboradores", colaboradoresRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});

module.exports = app;