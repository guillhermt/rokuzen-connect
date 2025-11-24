const API_COLAB = "http://localhost:3000/colaboradores";
const API_UNID = "http://localhost:3000/unidades";
const API_HOR = "http://localhost:3000/horarios";

let unidadeSelecionada = null;
let colaboradorLogado = null;

function getToken() {
  return localStorage.getItem("token");
}
function getUsuarioLogado() {
  return JSON.parse(localStorage.getItem("rok_user") || "{}");
}

function logout() {
  if (confirm("Sair do sistema?")) {
    localStorage.clear();
    location.href = "../screens/login.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!getToken()) {
    alert("Faça login primeiro!");
    location.href = "../screens/login.html";
    return;
  }

  colaboradorLogado = getUsuarioLogado();
  if (colaboradorLogado?.nome_colaborador) {
    document.getElementById("nomeAdminAtual").textContent =
      colaboradorLogado.nome_colaborador.split(" ")[0];
  }

  carregarColaboradores();
  carregarUnidades();
});

// ======================== COLABORADORES ========================
async function carregarColaboradores() {
  try {
    const res = await fetch(API_COLAB, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error("Erro na requisição");
    const dados = await res.json();

    document.getElementById("tabelaColaboradores").innerHTML = dados
      .map((c) => {
        const id = c.colaborador_id || c.id;
        const isLogado =
          colaboradorLogado &&
          (colaboradorLogado.colaborador_id || colaboradorLogado.id) == id;

        const tipoTexto =
          c.tipo_colaborador === 1
            ? "Admin"
            : c.tipo_colaborador === 2
            ? "Recepção"
            : "Terapeuta";
        const badgeClass =
          c.tipo_colaborador === 1
            ? "badge-admin"
            : c.tipo_colaborador === 2
            ? "badge-recepcao"
            : "badge-terapeuta";

        return `
          <tr>
            <td>${c.nome_colaborador}${
          isLogado ? ' <small class="text-success">(você)</small>' : ""
        }</td>
            <td><span class="badge ${badgeClass}">${tipoTexto}</span></td>
            <td class="text-end">
              ${
                !isLogado
                  ? `
                <button class="btn btn-sm btn-warning me-1" onclick="editarColaborador(${id})">
                  <i class="bi bi-pencil"></i> Editar
                </button>
                <button class="btn btn-sm btn-danger" onclick="excluirColaborador(${id}, '${c.nome_colaborador}')">
                  <i class="bi bi-trash"></i> Excluir
                </button>
              `
                  : '<span class="text-muted">Protegido</span>'
              }
            </td>
          </tr>
        `;
      })
      .join("");
  } catch (err) {
    console.error(err);
    alert("Erro ao carregar colaboradores");
  }
}

// NOVO COLABORADOR
function novoColaborador() {
  document.getElementById("colaboradorId").value = "";
  document.getElementById("tituloColaborador").textContent = "Novo Colaborador";
  document.getElementById("btnSalvarColaborador").textContent =
    "Criar Colaborador";
  document.getElementById("alertaSenha").style.display = "block";

  document.getElementById("nomeColab").value = "";
  document.getElementById("emailColab").value = "";
  document.getElementById("telColab").value = "";
  document.getElementById("tipoColab").value = "3";

  new bootstrap.Modal(document.getElementById("colaboradorModal")).show();
}

async function editarColaborador(id) {
  if (
    colaboradorLogado &&
    (colaboradorLogado.colaborador_id || colaboradorLogado.id) == id
  ) {
    return alert("Você não pode editar seu próprio usuário.");
  }

  try {
    const res = await fetch(`${API_COLAB}/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const c = await res.json();

    document.getElementById("colaboradorId").value = id;
    document.getElementById("tituloColaborador").textContent =
      "Editar Colaborador";
    document.getElementById("btnSalvarColaborador").textContent =
      "Editar Colaborador";
    document.getElementById("alertaSenha").style.display = "none"; // some no modo edição

    document.getElementById("nomeColab").value = c.nome_colaborador;
    document.getElementById("emailColab").value = c.email || "";
    document.getElementById("telColab").value = c.telefone || "";
    document.getElementById("tipoColab").value = c.tipo_colaborador;

    new bootstrap.Modal(document.getElementById("colaboradorModal")).show();
  } catch (err) {
    alert("Erro ao carregar colaborador");
  }
}

// EXCLUIR COLABORADOR
async function excluirColaborador(id, nome) {
  if (
    colaboradorLogado &&
    (colaboradorLogado.colaborador_id || colaboradorLogado.id) == id
  ) {
    return alert("Você não pode se excluir, seu idiota.");
  }

  if (!confirm(`Tem certeza que deseja EXCLUIR o colaborador:\n${nome}?`))
    return;

  try {
    const res = await fetch(`${API_COLAB}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    if (res.ok) {
      alert("Colaborador excluído com sucesso!");
      carregarColaboradores();
    } else {
      alert("Erro ao excluir colaborador");
    }
  } catch (err) {
    alert("Erro de conexão ao excluir");
  }
}

// SALVAR (CRIAR OU EDITAR)
async function salvarColaborador() {
  const id = document.getElementById("colaboradorId").value;
  const dados = {
    nome_colaborador: document.getElementById("nomeColab").value.trim(),
    email: document.getElementById("emailColab").value.trim(),
    telefone: document.getElementById("telColab").value.trim() || null,
    tipo_colaborador: parseInt(document.getElementById("tipoColab").value),
  };

  if (!dados.nome_colaborador || !dados.email) {
    return alert("Nome e e-mail são obrigatórios");
  }

  const metodo = id ? "PUT" : "POST";
  const url = id ? `${API_COLAB}/${id}` : API_COLAB;

  try {
    const res = await fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(dados),
    });

    if (!res.ok) {
      const erro = await res.json();
      throw new Error(erro.erro || "Erro ao salvar");
    }

    bootstrap.Modal.getInstance(
      document.getElementById("colaboradorModal")
    ).hide();
    carregarColaboradores();

    if (!id) {
      alert("Colaborador criado! Senha foi enviada por e-mail.");
    } else {
      alert("Colaborador atualizado com sucesso!");
    }
  } catch (err) {
    alert("Erro: " + err.message);
  }
}

// ======================== UNIDADES E HORÁRIOS (NÃO MEXI, FICA COMO ESTÁ) ========================
async function carregarUnidades() {
  try {
    const res = await fetch(API_UNID, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const dados = await res.json();

    document.getElementById("tabelaUnidades").innerHTML = dados
      .map(
        (u) => `
        <tr style="cursor:pointer" onclick="selecionarUnidade(${
          u.id
        }, '${u.nome_unidade.replace(/'/g, "\\'")}')">
          <td>${u.id}</td>
          <td>${u.nome_unidade}</td>
          <td><span class="badge bg-${
            u.ativo === "S" ? "success" : "secondary"
          }">${u.ativo === "S" ? "Ativa" : "Inativa"}</span></td>
          <td>
            <button class="btn btn-sm btn-warning" onclick="event.stopPropagation(); editarUnidade(${
              u.id
            })">Editar</button>
          </td>
        </tr>
      `
      )
      .join("");
  } catch (err) {
    alert("Erro ao carregar unidades");
  }
}

function selecionarUnidade(id, nome) {
  document
    .querySelectorAll("#tabelaUnidades tr")
    .forEach((tr) => tr.classList.remove("tr-selected"));
  event.target.closest("tr").classList.add("tr-selected");
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
    ativo: document.getElementById("ativoUnidade").value,
  };

  if (!dados.nome_unidade) return alert("Nome da unidade é obrigatório");

  const metodo = id ? "PUT" : "POST";
  const url = id ? `${API_UNID}/${id}` : API_UNID;

  try {
    const res = await fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(dados),
    });
    if (!res.ok) throw new Error("Erro ao salvar");
    bootstrap.Modal.getInstance(document.getElementById("unidadeModal")).hide();
    carregarUnidades();
  } catch (err) {
    alert("Erro ao salvar unidade");
  }
}

async function editarUnidade(id) {
  const res = await fetch(`${API_UNID}/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const u = await res.json();
  document.getElementById("unidadeId").value = u.id;
  document.getElementById("nomeUnidade").value = u.nome_unidade;
  document.getElementById("enderecoUnidade").value = u.endereco || "";
  document.getElementById("telefoneUnidade").value = u.telefone || "";
  document.getElementById("ativoUnidade").value = u.ativo;
  document.getElementById("tituloUnidade").textContent = "Editar Unidade";
  new bootstrap.Modal(document.getElementById("unidadeModal")).show();
}

async function carregarHorarios(unidadeId) {
  const res = await fetch(`${API_HOR}?unidade_id=${unidadeId}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const horarios = await res.json();
  const porDia = {};
  horarios.forEach((h) => {
    if (!porDia[h.dia_semana]) porDia[h.dia_semana] = [];
    porDia[h.dia_semana].push(h);
  });

  const dias = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];
  document.getElementById("horariosContainer").innerHTML = dias
    .map(
      (dia, i) => `
    <div class="mb-3">
      <div class="dia-header">${dia}</div>
      <div>
        ${
          porDia[i]
            ?.map(
              (h) => `
          <div class="horario-item">
            <strong>${h.horario.slice(0, 5)}</strong>
            <button class="btn btn-danger btn-sm" onclick="excluirHorario(${
              h.horario_id
            })">Excluir</button>
          </div>
        `
            )
            .join("") ||
          "<p class='text-muted p-2'>Nenhum horário cadastrado</p>"
        }
      </div>
    </div>
  `
    )
    .join("");
}

function adicionarHorario() {
  if (!unidadeSelecionada) return alert("Selecione uma unidade primeiro");
  new bootstrap.Modal(document.getElementById("horarioModal")).show();
}

async function salvarHorario() {
  const hora = document.getElementById("horarioInput").value;
  if (!hora) return alert("Preencha o horário");
  await fetch(API_HOR, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({
      unidade_id: unidadeSelecionada,
      dia_semana: parseInt(document.getElementById("diaSemana").value),
      horario: hora + ":00",
    }),
  });
  bootstrap.Modal.getInstance(document.getElementById("horarioModal")).hide();
  carregarHorarios(unidadeSelecionada);
}

async function excluirHorario(id) {
  if (confirm("Excluir este horário?")) {
    await fetch(`${API_HOR}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    carregarHorarios(unidadeSelecionada);
  }
}
