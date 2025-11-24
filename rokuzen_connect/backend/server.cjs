require("dotenv").config();
const express = require("express");
const cors = require("cors");

const loginRoutes = require("./routes/login.cjs");
const colaboradoresRoutes = require("./routes/gerenciarUsuarios.cjs");
const unidadesRoutes = require("./routes/unidades.cjs");
const postosRoutes = require("./routes/postos.cjs");
const controleAtendimentosRoutes = require("./routes/atendimentos-controle.cjs");
const horariosRoutes = require("./routes/horarios.cjs");
const app = express();

app.use(cors());
app.use(express.json());

app.use("/login", loginRoutes);
app.use("/colaboradores", colaboradoresRoutes);
app.use("/unidades", unidadesRoutes);
app.use("/postos", postosRoutes);
app.use("/controle", controleAtendimentosRoutes);
app.use("/horarios", horariosRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});

module.exports = app;
