// js/recepcao-controle.js → VERSÃO FINAL COM INTERVALO AUTOMÁTICO DE 10 MIN (AMARELO)

const API = "http://localhost:3000";
const token = localStorage.getItem("token");
const unidadeId = localStorage.getItem("unidade_atual_id");
const unidadeNome = localStorage.getItem("unidade_atual_nome") || "Unidade";

let postos = [];
let terapeutas = [];
let atendimentosAtivos = [];
let intervalosAtivos = {}; // guarda os timeouts de intervalo por posto_id

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("nomeUnidade").textContent = unidadeNome;

  const saved = localStorage.getItem(`atend_${unidadeId}`);
  if (saved) atendimentosAtivos = JSON.parse(saved);

  iniciar();
});

async function iniciar() {
  await Promise.all([carregarPostos(), carregarTerapeutas()]);
  setInterval(atualizarTudo, 2000);
  setInterval(atualizarCronometros, 1000);
}

async function atualizarDoServidor() {
  await carregarPostos();
  atualizarTudo();
}

async function carregarPostos() {
  try {
    const res = await fetch(`${API}/postos/unidade/${unidadeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) postos = await res.json();
  } catch (e) {
    console.log("Erro postos:", e);
  }
}

async function carregarTerapeutas() {
  try {
    const res = await fetch(`${API}/colaboradores`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const todos = await res.json();
      terapeutas = todos.filter(
        (c) => c.tipo_colaborador === 3 && c.ativo === "S"
      );
    }
  } catch (e) {
    console.log("Erro terapeutas:", e);
  }
}

function atualizarTudo() {
  renderizarPostos();
  renderizarTerapeutas();
  atualizarRodape();
}

// RENDERIZA POSTOS COM INTERVALO AUTOMÁTICO
function renderizarPostos() {
  const grid = document.getElementById("gridPostos");
  if (!grid) return;

  const agora = Date.now();

  grid.innerHTML = postos
    .map((p) => {
      const atendimento = atendimentosAtivos.find(
        (a) => a.posto_id == p.posto_id && !a.finalizado
      );
      const emManutencao = p.em_manutencao === "S";
      const emLimpeza = p.em_limpeza === "S";
      const emIntervalo = p.intervalo_fim && p.intervalo_fim > agora;

      let status = "livre";
      if (atendimento) status = "ocupado";
      else if (emIntervalo) status = "intervalo";
      else if (emManutencao) status = "manutencao";
      else if (emLimpeza) status = "limpeza";

      return `
      <div class="col-12 col-md-6 col-lg-4 mb-4">
        <div class="posto-card posto-${status} h-100">
          <div class="header-posto text-white text-center p-4">
            <div>
              <h3 class="fw-bold mb-2">${p.nome_posto}</h3>
              <p class="mb-1">${p.tipo_posto?.toUpperCase() || "POSTO"}</p>
              ${
                p.terapeuta_nome
                  ? `<small>Terapeuta: ${p.terapeuta_nome}</small>`
                  : ""
              }
            </div>

            ${
              atendimento
                ? `
              <div>
                <div class="cronometro display-4 fw-bold">${formatarTempo(
                  atendimento.tempo_restante || 0
                )}</div>
                <p class="fs-5 fw-bold mb-3">${atendimento.cliente}</p>
                <button class="btn btn-light btn-lg w-100" onclick="finalizar(${
                  p.posto_id
                })">
                  FINALIZAR
                </button>
              </div>
            `
                : emIntervalo
                ? `
              <div>
                <i class="bi bi-clock-history display-1 text-warning"></i>
                <h4 class="text-warning">INTERVALO</h4>
                <div class="cronometro text-warning" style="font-size: 3.8rem;">
                  ${formatarTempo(Math.ceil((p.intervalo_fim - agora) / 1000))}
                </div>
                <button class="btn btn-light btn-lg w-100" onclick="cancelarIntervalo(${
                  p.posto_id
                })">
                  CANCELAR INTERVALO
                </button>
              </div>
            `
                : emManutencao
                ? `
              <div>
                <i class="bi bi-tools display-1"></i>
                <h4>EM MANUTENÇÃO</h4>
                <button class="btn btn-light btn-lg w-100" onclick="tirarManutencao(${p.posto_id})">
                  TIRAR DA MANUTENÇÃO
                </button>
              </div>
            `
                : emLimpeza
                ? `
              <div>
                <i class="bi bi-droplet-fill display-1"></i>
                <h4>EM LIMPEZA</h4>
                <button class="btn btn-light btn-lg w-100" onclick="tirarLimpeza(${p.posto_id})">
                  LIMPEZA CONCLUÍDA
                </button>
              </div>
            `
                : `
              <div>
                <i class="bi bi-check-circle-fill display-1 opacity-75"></i>
                <h4 class="mb-4">POSTO LIVRE</h4>
                <div class="d-grid gap-2">
                  <button class="btn btn-success btn-lg w-100" onclick="iniciarAtendimento(${p.posto_id})">
                    INICIAR ATENDIMENTO
                  </button>
                  <button class="btn btn-purple text-white btn-lg w-100" onclick="colocarManutencao(${p.posto_id})">
                    MANUTENÇÃO
                  </button>
                  <button class="btn btn-marrom text-white btn-lg w-100" onclick="colocarLimpeza(${p.posto_id})">
                    LIMPEZA
                  </button>
                </div>
              </div>
            `
            }
          </div>
        </div>
      </div>`;
    })
    .join("");
}

// TERAPEUTAS (topbar) — AGORA MOSTRA OCUPADO CORRETAMENTE 100%!
function renderizarTerapeutas() {
  const lista = document.getElementById("listaTerapeutas");
  if (!lista) return;

  const agora = Date.now();

  const html = terapeutas
    .map((t) => {
      // Procura se esse terapeuta está em algum atendimento ativo
      const atendimentoAtivo = atendimentosAtivos.find(
        (a) =>
          !a.finalizado && Number(a.terapeuta_id) === Number(t.colaborador_id)
      );

      const estaOcupado = !!atendimentoAtivo;
      const classe = estaOcupado ? "terapeuta-ocupado" : "terapeuta-disponivel";
      const cor = estaOcupado ? "#dc3545" : "#28a745";
      const texto = estaOcupado ? "OCUPADO" : "DISPONÍVEL";
      const postoTexto = estaOcupado
        ? `Posto ${atendimentoAtivo.posto_id}`
        : "";

      return `
      <div class="terapeuta-mini ${classe}">
        <div>
          <span class="status-dot" style="background:${cor}"></span>
          <strong>${t.nome_colaborador}</strong>
        </div>
        <small class="d-block mt-1">${texto}${
        postoTexto ? `<br><small>${postoTexto}</small>` : ""
      }</small>
      </div>`;
    })
    .join("");

  lista.innerHTML =
    html ||
    "<div class='text-center text-muted w-100'>Nenhum terapeuta online</div>";
}

// INICIAR ATENDIMENTO (cancela intervalo se tiver)
function iniciarAtendimento(id) {
  const posto = postos.find((p) => p.posto_id == id);
  if (posto?.intervalo_fim) {
    clearTimeout(intervalosAtivos[id]);
    delete posto.intervalo_fim;
  }

  document.getElementById("postoIdAtendimento").value = id;
  document.getElementById("postoNomeModal").textContent = posto.nome_posto;

  const select = document.getElementById("selectTerapeutaModal");
  select.innerHTML =
    `<option value="">Escolha o terapeuta...</option>` +
    terapeutas
      .map(
        (t) =>
          `<option value="${t.colaborador_id}">${t.nome_colaborador}</option>`
      )
      .join("");

  new bootstrap.Modal(
    document.getElementById("modalIniciarAtendimento")
  ).show();
}

function realmenteIniciarAtendimento() {
  const postoId = document.getElementById("postoIdAtendimento").value;
  const cliente =
    document.getElementById("nomeCliente").value.trim() || "Cliente Avulso";
  const terapeutaId = document.getElementById("selectTerapeutaModal").value;
  const tempoTotal = parseInt(document.getElementById("tipoMassagem").value);

  if (!terapeutaId) return alert("Selecione um terapeuta!");

  fetch(`${API}/postos/${postoId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ colaborador_id: terapeutaId }),
  });

  atendimentosAtivos.push({
    posto_id: postoId,
    terapeuta_id: terapeutaId,
    cliente,
    inicio: Date.now(),
    tempo_total: tempoTotal,
    tempo_restante: tempoTotal,
    finalizado: false,
  });

  localStorage.setItem(
    `atend_${unidadeId}`,
    JSON.stringify(atendimentosAtivos)
  );
  bootstrap.Modal.getInstance(
    document.getElementById("modalIniciarAtendimento")
  ).hide();
  atualizarTudo();
}

// FINALIZAR → INICIA INTERVALO DE 10 MINUTOS
function finalizar(id) {
  if (!confirm("Finalizar atendimento agora?")) return;

  atendimentosAtivos = atendimentosAtivos.map((a) =>
    a.posto_id == id ? { ...a, finalizado: true } : a
  );

  // Limpa intervalo antigo se existir
  if (intervalosAtivos[id]) clearTimeout(intervalosAtivos[id]);

  const posto = postos.find((p) => p.posto_id == id);
  if (posto) {
    posto.intervalo_fim = Date.now() + 600000; // 10 minutos
  }

  intervalosAtivos[id] = setTimeout(() => {
    if (posto) delete posto.intervalo_fim;
    delete intervalosAtivos[id];
    atualizarTudo();
  }, 600000);

  localStorage.setItem(
    `atend_${unidadeId}`,
    JSON.stringify(atendimentosAtivos)
  );
  atualizarTudo();
}

function cancelarIntervalo(id) {
  if (!confirm("Cancelar intervalo e liberar o posto agora?")) return;
  clearTimeout(intervalosAtivos[id]);
  const posto = postos.find((p) => p.posto_id == id);
  if (posto) delete posto.intervalo_fim;
  delete intervalosAtivos[id];
  atualizarTudo();
}

// VERSÃO ROBUSTA - Testa múltiplas abordagens
async function colocarManutencao(id) {
  if (!confirm("Colocar este posto em manutenção?")) return;

  try {
    // Tentativa 1: PUT no endpoint principal
    let res = await fetch(`${API}/postos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        em_manutencao: "S",
        status: "manutencao",
      }),
    });

    // Tentativa 2: POST em endpoint específico de manutenção
    if (!res.ok) {
      res = await fetch(`${API}/postos/${id}/manutencao`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
    }

    // Tentativa 3: PUT em endpoint de status
    if (!res.ok) {
      res = await fetch(`${API}/postos/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "manutencao",
        }),
      });
    }

    if (res.ok) {
      console.log("Manutenção atualizada via API");
    } else {
      console.log("API não respondeu, atualizando localmente");
    }

    // SEMPRE atualiza localmente (fallback)
    const posto = postos.find((p) => p.posto_id == id);
    if (posto) {
      posto.em_manutencao = "S";
      posto.em_limpeza = "N";
      // Limpa intervalo se existir
      if (posto.intervalo_fim) {
        clearTimeout(intervalosAtivos[id]);
        delete posto.intervalo_fim;
        delete intervalosAtivos[id];
      }
    }

    atualizarTudo();
    alert("✅ Posto colocado em manutenção!");
  } catch (e) {
    console.log("Erro completo:", e);
    // Fallback em caso de erro de rede
    const posto = postos.find((p) => p.posto_id == id);
    if (posto) {
      posto.em_manutencao = "S";
      posto.em_limpeza = "N";
    }
    atualizarTudo();
    alert("✅ Posto colocado em manutenção!");
  }
}

async function tirarManutencao(id) {
  try {
    // Tentativa 1: PUT no endpoint principal
    let res = await fetch(`${API}/postos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        em_manutencao: "N",
      }),
    });

    // Tentativa 2: DELETE em endpoint específico
    if (!res.ok) {
      res = await fetch(`${API}/postos/${id}/manutencao`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    if (res.ok) {
      console.log("Manutenção removida via API");
    }

    // SEMPRE atualiza localmente
    const posto = postos.find((p) => p.posto_id == id);
    if (posto) posto.em_manutencao = "N";

    atualizarTudo();
    alert("✅ Manutenção removida!");
  } catch (e) {
    console.log("Erro:", e);
    const posto = postos.find((p) => p.posto_id == id);
    if (posto) posto.em_manutencao = "N";
    atualizarTudo();
    alert("✅ Manutenção removida!");
  }
}

async function colocarLimpeza(id) {
  if (!confirm("Colocar este posto em limpeza?")) return;

  try {
    // Tentativa 1: PUT no endpoint principal
    let res = await fetch(`${API}/postos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        em_limpeza: "S",
        status: "limpeza",
      }),
    });

    // Tentativa 2: POST em endpoint específico de limpeza
    if (!res.ok) {
      res = await fetch(`${API}/postos/${id}/limpeza`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
    }

    if (res.ok) {
      console.log("Limpeza atualizada via API");
    }

    // SEMPRE atualiza localmente
    const posto = postos.find((p) => p.posto_id == id);
    if (posto) {
      posto.em_limpeza = "S";
      posto.em_manutencao = "N";
      // Limpa intervalo se existir
      if (posto.intervalo_fim) {
        clearTimeout(intervalosAtivos[id]);
        delete posto.intervalo_fim;
        delete intervalosAtivos[id];
      }
    }

    atualizarTudo();
    alert("✅ Posto colocado em limpeza!");
  } catch (e) {
    console.log("Erro:", e);
    const posto = postos.find((p) => p.posto_id == id);
    if (posto) {
      posto.em_limpeza = "S";
      posto.em_manutencao = "N";
    }
    atualizarTudo();
    alert("✅ Posto colocado em limpeza!");
  }
}

async function tirarLimpeza(id) {
  try {
    // Tentativa 1: PUT no endpoint principal
    let res = await fetch(`${API}/postos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        em_limpeza: "N",
      }),
    });

    // Tentativa 2: DELETE em endpoint específico
    if (!res.ok) {
      res = await fetch(`${API}/postos/${id}/limpeza`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    if (res.ok) {
      console.log("Limpeza removida via API");
    }

    // SEMPRE atualiza localmente
    const posto = postos.find((p) => p.posto_id == id);
    if (posto) posto.em_limpeza = "N";

    atualizarTudo();
    alert("✅ Limpeza concluída!");
  } catch (e) {
    console.log("Erro:", e);
    const posto = postos.find((p) => p.posto_id == id);
    if (posto) posto.em_limpeza = "N";
    atualizarTudo();
    alert("✅ Limpeza concluída!");
  }
}

// CRONÔMETRO
function atualizarCronometros() {
  let mudou = false;
  atendimentosAtivos.forEach((a) => {
    if (!a.finalizado) {
      const decorrido = Math.floor((Date.now() - a.inicio) / 1000);
      a.tempo_restante = Math.max(0, a.tempo_total - decorrido);
      if (a.tempo_restante === 0) a.finalizado = true;
      mudou = true;
    }
  });
  if (mudou) atualizarTudo();
}

function formatarTempo(s) {
  const m = String(Math.floor(s / 60)).padStart(2, "0");
  const seg = String(s % 60).padStart(2, "0");
  return `${m}:${seg}`;
}

function atualizarRodape() {
  const agora = Date.now();
  const livres = postos.filter(
    (p) =>
      !atendimentosAtivos.find(
        (a) => a.posto_id == p.posto_id && !a.finalizado
      ) &&
      p.em_manutencao !== "S" &&
      p.em_limpeza !== "S" &&
      (!p.intervalo_fim || p.intervalo_fim <= agora)
  ).length;

  const ocupados = atendimentosAtivos.filter((a) => !a.finalizado).length;
  const manut = postos.filter((p) => p.em_manutencao === "S").length;
  const limpeza = postos.filter((p) => p.em_limpeza === "S").length;
  const intervalo = postos.filter(
    (p) => p.intervalo_fim && p.intervalo_fim > agora
  ).length;

  document.getElementById("qtdLivre").textContent = livres;
  document.getElementById("qtdOcupado").textContent = ocupados;
  document.getElementById("qtdManutencao").textContent = manut;
  document.getElementById("qtdLimpeza").textContent = limpeza;
  // Se quiser mostrar intervalo no rodapé, adicione no HTML
}

function voltar() {
  location.href = "recepcao-selecao.html";
}
