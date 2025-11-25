const user = JSON.parse(localStorage.getItem("rok_user") || "{}");
const unidadeNome = localStorage.getItem("unidade_atual_nome") || "Principal";

// Chaves únicas por terapeuta e por data
const hoje = new Date().toISOString().split("T")[0]; // ex: 2025-04-05
const CHAVE_ESCALA = `escala_${user.colaborador_id}_${hoje}`;
const CHAVE_STATUS = `status_${user.colaborador_id}`;

document.addEventListener("DOMContentLoaded", () => {
  // Validação de acesso
  if (user.tipo_colaborador !== 3) {
    alert("Acesso negado. Apenas terapeutas podem entrar aqui.");
    location.href = "../screens/login.html";
    return;
  }

  // Preenche nome e unidade
  document.getElementById("nomeTerapeuta").textContent = user.nome_colaborador.split(" ")[0];
  document.getElementById("nomeUnidade").textContent = unidadeNome;

  const switchEl = document.getElementById("switchDisponivel");
  const statusBadge = document.getElementById("statusBadge");
  const labelSwitch = document.getElementById("labelSwitch");
  const entradaInput = document.getElementById("horaEntrada");
  const saidaInput = document.getElementById("horaSaida");

  // === CARREGA DADOS SALVOS ===
  function carregarDados() {
    // Status de disponibilidade
    const disponivel = localStorage.getItem(CHAVE_STATUS) === "true";
    switchEl.checked = disponivel;
    atualizarVisualStatus(disponivel);

    // Escala do dia
    const escalaSalva = localStorage.getItem(CHAVE_ESCALA);
    if (escalaSalva) {
      const { entrada, saida } = JSON.parse(escalaSalva);
      entradaInput.value = entrada;
      saidaInput.value = saida;
    }
  }

  // === ATUALIZA VISUAL DO STATUS ===
  function atualizarVisualStatus(disponivel) {
    if (disponivel) {
      statusBadge.textContent = "DISPONÍVEL";
      statusBadge.className = "status-badge bg-success text-white d-inline-block";
      labelSwitch.textContent = "Disponível";
    } else {
      statusBadge.textContent = "INDISPONÍVEL";
      statusBadge.className = "status-badge bg-danger text-white d-inline-block";
      labelSwitch.textContent = "Indisponível";
    }
  }

  // === EVENTOS ===
  // Switch de disponibilidade
  switchEl.onchange = () => {
    const disponivel = switchEl.checked;
    localStorage.setItem(CHAVE_STATUS, disponivel);
    atualizarVisualStatus(disponivel);
  };

  // Salva escala automaticamente ao alterar
  entradaInput.onchange = salvarEscala;
  saidaInput.onchange = salvarEscala;

  function salvarEscala() {
    const entrada = entradaInput.value || "00:00";
    const saida = saidaInput.value || "00:00";
    localStorage.setItem(CHAVE_ESCALA, JSON.stringify({ entrada, saida }));
  }

  // Atualiza a cada 2 segundos (pra sincronizar com outras abas/celular)
  setInterval(carregarDados, 2000);

  // Carrega na primeira vez
  carregarDados();
});

// Logout
function logout() {
  if (confirm("Tem certeza que deseja sair?")) {
    localStorage.clear();
    location.href = "../screens/login.html";
  }
}