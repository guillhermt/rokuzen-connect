// =============== CONFIGURAÇÃO CORRETA PARA SEU BACKEND ===============
const API_BASE = "http://localhost:3000";
const API_COLAB = `${API_BASE}/colaboradores`;
const API_UNID  = `${API_BASE}/unidades`;
const API_HOR   = `${API_BASE}/horarios`;

let unidadeSelecionada = null;
let colaboradorLogado = null;

function getToken() {
  return localStorage.getItem("token");
}

// ======================== INICIALIZAÇÃO ========================
document.addEventListener("DOMContentLoaded", () => {
  if (!getToken()) {
    alert("Faça login primeiro!");
    location.href = "../screens/login.html";
    return;
  }

  colaboradorLogado = JSON.parse(localStorage.getItem("rok_user") || "{}");
  if (colaboradorLogado?.nome_colaborador) {
    document.getElementById("nomeAdminAtual").textContent = colaboradorLogado.nome_colaborador.split(" ")[0];
  }

  carregarColaboradores();
  carregarUnidades();

  // ======= BOTÕES DAS MODAIS (FORÇA O EVENTO DEPOIS DO DOM) =======
  setTimeout(() => {
    document.getElementById("btnSalvarColaborador")?.addEventListener("click", salvarColaborador);
    document.getElementById("btnSalvarUnidade")?.addEventListener("click", salvarUnidade);

    // Corrige botão do horário (remove onclick antigo do HTML)
    const btn = document.querySelector("#horarioModal .btn-rokuzen");
    if (btn) {
      const novoBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(novoBtn, btn);
      novoBtn.addEventListener("click", salvarHorario);
    }
  }, 100);
});

// ======================== COLABORADORES ========================
async function carregarColaboradores() {
  try {
    const res = await fetch(API_COLAB, {
      headers: { "Authorization": `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error("Erro " + res.status);
    const dados = await res.json();

    document.getElementById("tabelaColaboradores").innerHTML = dados.map(c => `
      <tr>
        <td>${c.nome_colaborador} ${colaboradorLogado?.colaborador_id == c.colaborador_id ? '<small class="text-success">(você)</small>' : ''}</td>
        <td><span class="badge ${c.tipo_colaborador == 1 ? 'badge-admin' : c.tipo_colaborador == 2 ? 'badge-recepcao' : 'badge-terapeuta'}">
          ${c.tipo_colaborador == 1 ? 'Admin' : c.tipo_colaborador == 2 ? 'Recepção' : 'Terapeuta'}
        </span></td>
        <td class="text-end">
          ${colaboradorLogado?.colaborador_id != c.colaborador_id ? `
            <button class="btn btn-sm btn-warning me-1" onclick="editarColaborador(${c.colaborador_id})">Editar</button>
            <button class="btn btn-sm btn-danger" onclick="excluirColaborador(${c.colaborador_id}, '${c.nome_colaborador.replace(/'/g, "\\'")}')">Excluir</button>
          ` : 'Protegido'}
        </td>
      </tr>
    `).join("");
  } catch (e) {
    console.error(e);
    alert("Erro ao carregar colaboradores");
  }
}

async function salvarColaborador() {
  const id = document.getElementById("colaboradorId").value;
  const dados = {
    nome_colaborador: document.getElementById("nomeColab").value.trim(),
    email: document.getElementById("emailColab").value.trim(),
    telefone: document.getElementById("telColab").value.trim() || null,
    tipo_colaborador: parseInt(document.getElementById("tipoColab").value)
  };

  if (!dados.nome_colaborador || !dados.email) return alert("Nome e e-mail obrigatórios");

  try {
    const res = await fetch(id ? `${API_COLAB}/${id}` : API_COLAB, {
      method: id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`
      },
      body: JSON.stringify(dados)
    });

    if (!res.ok) throw new Error("Erro no servidor");
    
    bootstrap.Modal.getInstance(document.getElementById("colaboradorModal")).hide();
    carregarColaboradores();
    alert("Salvo com sucesso!");
  } catch (e) {
    alert("Erro ao salvar colaborador");
  }
}

function novoColaborador() {
  document.getElementById("colaboradorId").value = "";
  document.getElementById("tituloColaborador").textContent = "Novo Colaborador";
  document.getElementById("btnSalvarColaborador").textContent = "Criar";
  document.getElementById("alertaSenha").style.display = "block";
  document.getElementById("nomeColab").value = "";
  document.getElementById("emailColab").value = "";
  document.getElementById("telColab").value = "";
  document.getElementById("tipoColab").value = "3";
  new bootstrap.Modal(document.getElementById("colaboradorModal")).show();
}

async function editarColaborador(id) {
  if (colaboradorLogado?.colaborador_id == id) return alert("Você não pode se editar");
  try {
    const res = await fetch(`${API_COLAB}/${id}`, { headers: { "Authorization": `Bearer ${getToken()}` } });
    const c = await res.json();
    document.getElementById("colaboradorId").value = c.colaborador_id;
    document.getElementById("tituloColaborador").textContent = "Editar Colaborador";
    document.getElementById("btnSalvarColaborador").textContent = "Salvar";
    document.getElementById("alertaSenha").style.display = "none";
    document.getElementById("nomeColab").value = c.nome_colaborador;
    document.getElementById("emailColab").value = c.email || "";
    document.getElementById("telColab").value = c.telefone || "";
    document.getElementById("tipoColab").value = c.tipo_colaborador;
    new bootstrap.Modal(document.getElementById("colaboradorModal")).show();
  } catch { alert("Erro ao carregar"); }
}

async function excluirColaborador(id, nome) {
  if (colaboradorLogado?.colaborador_id == id) return alert("Você não pode se excluir");
  if (!confirm(`Excluir ${nome}?`)) return;
  await fetch(`${API_COLAB}/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${getToken()}` } });
  carregarColaboradores();
}

// ======================== UNIDADES ========================
async function carregarUnidades() {
  try {
    const res = await fetch(API_UNID, { headers: { "Authorization": `Bearer ${getToken()}` } });
    const dados = await res.json();

    document.getElementById("tabelaUnidades").innerHTML = dados.map(u => `
      <tr style="cursor:pointer" onclick="selecionarUnidade(${u.unidade_id}, '${u.nome_unidade.replace(/'/g, "\\'")}')">
        <td>${u.unidade_id}</td>
        <td>${u.nome_unidade}</td>
        <td><span class="badge bg-${u.ativo === 'S' ? 'success' : 'secondary'}">${u.ativo === 'S' ? 'Ativa' : 'Inativa'}</span></td>
        <td class="text-center">
          <button class="btn btn-sm btn-warning me-1" onclick="event.stopPropagation(); editarUnidade(${u.unidade_id})">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); excluirUnidade(${u.unidade_id}, '${u.nome_unidade.replace(/'/g, "\\'")}')">Excluir</button>
        </td>
      </tr>
    `).join("");
  } catch (e) {
    console.error(e);
    alert("Erro ao carregar unidades");
  }
}

function selecionarUnidade(id, nome) {
  // Remove seleção anterior
  document.querySelectorAll("#tabelaUnidades tr").forEach(tr => {
    tr.classList.remove("unidade-selecionada");
  });

  // Marca apenas a linha clicada
  const linha = event.target.closest("tr");
  linha.classList.add("unidade-selecionada");

  // Atualiza tudo
  unidadeSelecionada = id;
  document.getElementById("nomeUnidadeSelecionada").textContent = nome;
  document.getElementById("nomeUnidadeSelecionada").style.display = "inline";
  document.getElementById("footerHorarios").style.display = "block";
  carregarHorarios(id);
}

function novaUnidade() {
  document.getElementById("unidadeId").value = "";
  document.getElementById("tituloUnidade").textContent = "Nova Unidade";
  document.getElementById("nomeUnidade").value = "";
  document.getElementById("enderecoUnidade").value = "";
  document.getElementById("telefoneUnidade").value = "";
  document.getElementById("ativoUnidade").value = "S";
  new bootstrap.Modal(document.getElementById("unidadeModal")).show();
}

async function salvarUnidade() {
  const id = document.getElementById("unidadeId").value;
  const dados = {
    nome_unidade: document.getElementById("nomeUnidade").value.trim(),
    endereco: document.getElementById("enderecoUnidade").value.trim() || null,
    telefone: document.getElementById("telefoneUnidade").value.trim() || null,
    ativo: document.getElementById("ativoUnidade").value
  };

  if (!dados.nome_unidade) {
    alert("Nome da unidade é obrigatório");
    return;
  }

  const metodo = id ? "PUT" : "POST";
  const url = id ? `${API_UNID}/${id}` : API_UNID;

  console.log("Enviando requisição:", metodo, url);
  console.log("Dados:", dados);
  console.log("Token:", getToken());

  try {
    const res = await fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`
      },
      body: JSON.stringify(dados)
    });

    console.log("Status da resposta:", res.status);

    const texto = await res.text();
    console.log("Resposta do servidor:", texto);

    if (!res.ok) {
      alert(`Erro ${res.status}: ${texto || "Sem resposta do servidor"}`);
      return;
    }

    // Só fecha modal se deu certo
    bootstrap.Modal.getInstance(document.getElementById("unidadeModal")).hide();
    carregarUnidades();
    alert("Unidade criada com sucesso!");

  } catch (err) {
    console.error("Erro total:", err);
    alert("Erro de conexão: " + err.message);
  }
}

async function editarUnidade(id) {
  const res = await fetch(`${API_UNID}/${id}`, { headers: { "Authorization": `Bearer ${getToken()}` } });
  const u = await res.json();
  document.getElementById("unidadeId").value = u.unidade_id;
  document.getElementById("tituloUnidade").textContent = "Editar Unidade";
  document.getElementById("nomeUnidade").value = u.nome_unidade;
  document.getElementById("enderecoUnidade").value = u.endereco || "";
  document.getElementById("telefoneUnidade").value = u.telefone || "";
  document.getElementById("ativoUnidade").value = u.ativo;
  new bootstrap.Modal(document.getElementById("unidadeModal")).show();
}

async function excluirUnidade(id, nome) {
  if (!confirm(`Excluir unidade "${nome}"?`)) return;
  await fetch(`${API_UNID}/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${getToken()}` } });
  carregarUnidades();
  if (unidadeSelecionada == id) {
    unidadeSelecionada = null;
    document.getElementById("nomeUnidadeSelecionada").style.display = "none";
    document.getElementById("footerHorarios").style.display = "none";
  }
}

// ======================== HORÁRIOS ========================
async function carregarHorarios(unidadeId) {
  const res = await fetch(`${API_HOR}?unidade_id=${unidadeId}`, { headers: { "Authorization": `Bearer ${getToken()}` } });
  const dados = await res.json();
  const porDia = {};
  dados.forEach(h => {
    if (!porDia[h.dia_semana]) porDia[h.dia_semana] = [];
    porDia[h.dia_semana].push(h);
  });

  const dias = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
  document.getElementById("horariosContainer").innerHTML = dias.map((d, i) => `
    <div class="mb-3">
      <div class="dia-header">${d}</div>
      <div>
        ${porDia[i]?.map(h => `
          <div class="horario-item">
            <strong>${h.horario.slice(0,5)}</strong>
            <button class="btn btn-danger btn-sm" onclick="excluirHorario(${h.horario_id})">Excluir</button>
          </div>
        `).join("") || "<p class='text-muted p-2'>Nenhum horário</p>"}
      </div>
    </div>
  `).join("");
}

async function salvarHorario() {
  const hora = document.getElementById("horarioInput").value;
  if (!hora) return alert("Selecione o horário");

  const diaSemanaStr = document.getElementById("diaSemana").value;
  const diaSemana = parseInt(diaSemanaStr); // ← FORÇA SER NÚMERO

  // VALIDAÇÃO EXTRA PRA NÃO DAR PROBLEMA
  if (isNaN(diaSemana) || diaSemana < 0 || diaSemana > 6) {
    return alert("Dia da semana inválido");
  }

  try {
    const res = await fetch("http://localhost:3000/horarios", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        unidade_id: unidadeSelecionada,
        dia_semana: diaSemana,     // ← AQUI É O SEGREDO
        horario: hora + ":00"
      })
    });

    if (!res.ok) {
      const erro = await res.text();
      alert("Erro do servidor: " + erro);
      return;
    }

    bootstrap.Modal.getInstance(document.getElementById("horarioModal")).hide();
    carregarHorarios(unidadeSelecionada);
    alert("Horário adicionado com sucesso!");
  } catch (err) {
    console.error(err);
    alert("Erro de conexão: " + err.message);
  }
}

async function excluirHorario(id) {
  if (confirm("Excluir?")) {
    await fetch(`${API_HOR}/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${getToken()}` } });
    carregarHorarios(unidadeSelecionada);
  }
}

// ESSA FUNÇÃO TAVA FALTANDO
function adicionarHorario() {
  if (!unidadeSelecionada) {
    alert("Selecione uma unidade primeiro!");
    return;
  }
  // Limpa o modal
  document.getElementById("horarioInput").value = "";
  document.getElementById("diaSemana").value = "1"; // Segunda por padrão
  new bootstrap.Modal(document.getElementById("horarioModal")).show();
}

// FUNÇÃO LOGOUT 100% GARANTIDA (NUNCA MAIS VAI FALHAR)
function logout() {
  // Confirmação (opcional, mas foda)
  if (confirm("Tem certeza que quer sair do sistema?")) {
    // Limpa TUDO do localStorage
    localStorage.clear();
    
    // Ou se quiser limpar só o que precisa:
    // localStorage.removeItem("token");
    // localStorage.removeItem("rok_user");

    // Redireciona pro login
    window.location.href = "../screens/login.html";
  }
}

// GARANTE QUE O BOTÃO FUNCIONE MESMO SE O ONCLICK QUEBRAR
document.addEventListener("DOMContentLoaded", () => {
  const botaoSair = document.querySelector("button[onclick='logout()']");
  if (botaoSair) {
    // Remove o onclick antigo e coloca um novo seguro
    botaoSair.onclick = null;
    botaoSair.addEventListener("click", logout);
  }

  // Ou se o botão tiver um ID ou classe, pode fazer assim:
  document.querySelector(".btn-outline-light")?.addEventListener("click", logout);
});

// ======================== POSTOS DENTRO DO MODAL DE UNIDADE ========================
let postosDaUnidadeAtual = [];

async function carregarPostosNoModal(unidadeId) {
  try {
    const res = await fetch(`${API_BASE}/postos/unidade/${unidadeId}`, {
      headers: { "Authorization": `Bearer ${getToken()}` }
    });
    postosDaUnidadeAtual = await res.json();

    const container = document.getElementById("listaPostosNaUnidade");
    if (postosDaUnidadeAtual.length === 0) {
      container.innerHTML = `<p class="text-muted text-center py-4 mb-0"><i class="bi bi-inbox fs-2"></i><br>Nenhum posto cadastrado ainda</p>`;
    } else {
      container.innerHTML = postosDaUnidadeAtual.map(p => `
        <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
          <div>
            <strong>${p.nome_posto}</strong>
            <span class="badge bg-success ms-2">${p.tipo_posto}</span>
            ${p.em_manutencao === 'S' ? '<span class="badge bg-warning ms-1">Manutenção</span>' : ''}
          </div>
          <div>
            <button class="btn btn-sm btn-warning" onclick="editarPostoMini(${p.posto_id})">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="excluirPostoMini(${p.posto_id})">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      `).join("");
    }
  } catch (e) { console.error(e); }
}

function adicionarPostoNaUnidade() {
  document.getElementById("postoEditId").value = "";
  document.getElementById("tituloMiniPosto").textContent = "Novo Posto";
  document.getElementById("novoNomePosto").value = "";
  document.getElementById("novoTipoPosto").value = "maca";
  document.getElementById("novoEmManutencao").checked = false;
  new bootstrap.Modal("#postoMiniModal").show();
}

function editarPostoMini(id) {
  const posto = postosDaUnidadeAtual.find(p => p.posto_id == id);
  if (!posto) return;
  document.getElementById("postoEditId").value = posto.posto_id;
  document.getElementById("tituloMiniPosto").textContent = "Editar Posto";
  document.getElementById("novoNomePosto").value = posto.nome_posto;
  document.getElementById("novoTipoPosto").value = posto.tipo_posto;
  document.getElementById("novoEmManutencao").checked = posto.em_manutencao === "S";
  new bootstrap.Modal("#postoMiniModal").show();
}

// FUNÇÃO CORRIGIDA - AGORA FUNCIONA 100%
async function salvarPostoNaUnidade() {
  const unidadeId = document.getElementById("unidadeId").value;
  if (!unidadeId) {
    alert("Nenhuma unidade selecionada!");
    return;
  }

  const id = document.getElementById("postoEditId").value;
  const dados = {
    unidade_id: parseInt(unidadeId),
    nome_posto: document.getElementById("novoNomePosto").value.trim(),
    tipo_posto: document.getElementById("novoTipoPosto").value,
    em_manutencao: document.getElementById("novoEmManutencao").checked ? "S" : "N"
  };

  if (!dados.nome_posto) {
    alert("Preencha o nome do posto!");
    return;
  }

  try {
    const url = id ? `${API_BASE}/postos/${id}` : `${API_BASE}/postos`;
    const metodo = id ? "PUT" : "POST";

    const res = await fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`
      },
      body: JSON.stringify(dados)
    });

    if (!res.ok) {
      const erro = await res.text();
      alert("Erro: " + erro);
      return;
    }

    // Fecha o mini modal
    bootstrap.Modal.getInstance(document.getElementById("postoMiniModal")).hide();

    // Recarrega a lista de postos
    await carregarPostosNoModal(unidadeId);

    // Feedback visual
    alert("Posto salvo com sucesso!");

  } catch (err) {
    console.error(err);
    alert("Erro de conexão");
  }
}

// Garante que o botão funcione mesmo depois do Bootstrap recriar o DOM
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnSalvarPostoMini")?.addEventListener("click", salvarPostoNaUnidade);
});

// E também garante quando o modal for aberto de novo
document.getElementById("postoMiniModal")?.addEventListener("shown.bs.modal", () => {
  document.getElementById("btnSalvarPostoMini")?.addEventListener("click", salvarPostoNaUnidade);
});

// MODIFICA O EDITAR UNIDADE PARA CARREGAR POSTOS TAMBÉM
const editarUnidadeOriginal = editarUnidade;
window.editarUnidade = async function(id) {
  await editarUnidadeOriginal(id);
  await carregarPostosNoModal(id);
};