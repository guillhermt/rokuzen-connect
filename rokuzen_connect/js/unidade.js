const API_BASE = "http://localhost:3000";
const token = localStorage.getItem("token");

// PEGA O PARÂMETRO "unit" QUE O DASHBOARD MANDA: ?unit=1
const urlParams = new URLSearchParams(window.location.search);
let unidadeId = urlParams.get("unit");

// Se por algum motivo vier vazio, tenta pegar "id" ou "unidade_id" também (nunca mais dá erro)
if (!unidadeId) {
  unidadeId = urlParams.get("id") || urlParams.get("unidade_id");
}

document.addEventListener("DOMContentLoaded", () => {
  if (!unidadeId || unidadeId === "null" || unidadeId === "") {
    alert("Nenhuma unidade selecionada!");
    window.location.href = "dashboard.html";
    return;
  }

  console.log("Unidade ID carregada com sucesso:", unidadeId);

  carregarUnidade();
  verificarUsuario();
});

async function apiFetch(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  // Se o token expirou, desloga na hora
  if (response.status === 401) {
    alert("Sessão expirada! Faça login novamente.");
    localStorage.clear();
    window.location.href = "../screens/login.html";
    return null;
  }

  return response;
}

async function carregarUnidade() {
  try {
    const res = await apiFetch(`${API_BASE}/unidades/${unidadeId}`);
    
    if (!res) return;
    if (!res.ok) {
      throw new Error(`Erro ${res.status}: Unidade não encontrada`);
    }

    const unidade = await res.json();
    
    const title = document.getElementById("unitTitle");
    if (title) {
      title.textContent = unidade.nome_unidade || "Unidade ROKUZEN";
    }

    carregarPostos();
    carregarHorariosDisponiveis();

  } catch (err) {
    console.error("Erro ao carregar unidade:", err);
    alert("Erro ao carregar a unidade. Verifique se você está logado e tente novamente.");
  }
}

function carregarPostos() {
  const grid = document.getElementById("postsGrid");
  if (grid) {
    grid.innerHTML = `
      <div class="col-12 text-center text-muted py-5">
        <p>Postos em desenvolvimento...</p>
      </div>
    `;
  }
}

async function carregarHorariosDisponiveis() {
  const hoje = new Date().toISOString().split("T")[0];
  const url = `${API_BASE}/horarios/disponiveis?unidade_id=${unidadeId}&data=${hoje}`;

  try {
    const res = await apiFetch(url);
    if (!res || !res.ok) {
      console.warn("Erro ao carregar horários ou nenhum disponível");
      return;
    }

    const horarios = await res.json();

    // VIEW RECEPÇÃO / ADMIN
    const listaAdmin = document.getElementById("nextAppointments");
    if (listaAdmin) {
      if (horarios.length === 0) {
        listaAdmin.innerHTML = "<li class='list-group-item text-muted text-center py-4'>Nenhum horário hoje</li>";
      } else {
        listaAdmin.innerHTML = "";
        horarios.forEach(h => {
          const li = document.createElement("li");
          li.className = "list-group-item d-flex justify-content-between align-items-center py-3";
          li.innerHTML = `
            <div>
              <strong class="fs-5">${h.horario}</strong>
              <small class="text-muted ms-2">
                ${h.terapeuta ? `- ${h.terapeuta}` : "<em class='text-success'>Livre</em>"}
              </small>
            </div>
            <button class="btn btn-success btn-sm px-4" onclick="agendar(${h.id})">
              Agendar
            </button>
          `;
          listaAdmin.appendChild(li);
        });
      }
    }

    // VIEW CLIENTE
    const roomsGrid = document.getElementById("roomsGrid");
    if (roomsGrid) {
      if (horarios.length === 0) {
        roomsGrid.innerHTML = `
          <div class="col-12 text-center py-5">
            <h4 class="text-muted">Nenhum horário disponível hoje</h4>
          </div>
        `;
      } else {
        roomsGrid.innerHTML = "";
        horarios.forEach((h, i) => {
          const template = document.getElementById("clientRoomTemplate").content.cloneNode(true);
          template.querySelector(".room-number").textContent = i + 1;
          template.querySelector(".therapist-name").textContent = h.terapeuta || "Qualquer terapeuta";
          template.querySelector(".book-room").onclick = () => abrirModalAgendamento(h.id);
          roomsGrid.appendChild(template);
        });
      }
    }

  } catch (err) {
    console.error("Erro ao carregar horários:", err);
  }
}

function verificarUsuario() {
  const user = JSON.parse(localStorage.getItem("rok_user") || "null");

  const receptionView = document.getElementById("receptionView");
  const therapistView = document.getElementById("therapistView");
  const clientView = document.getElementById("clientView");

  if (!receptionView || !therapistView || !clientView) return;

  if (!user || !token) {
    // Cliente
    receptionView.style.display = "none";
    therapistView.style.display = "none";
    clientView.style.display = "block";
  } else if (user.tipo_colaborador === 3) {
    // Terapeuta
    receptionView.style.display = "none";
    therapistView.style.display = "block";
    clientView.style.display = "none";
  } else {
    // Admin ou Recepção
    receptionView.style.display = "block";
    therapistView.style.display = "none";
    clientView.style.display = "none";
  }
}

function abrirModalAgendamento(horarioId) {
  const input = document.getElementById("unidadeSelecionada");
  if (input) input.value = unidadeId;

  const modal = document.getElementById("modalAgendamento");
  if (modal) {
    new bootstrap.Modal(modal).show();
  }
}

function agendar(horarioId) {
  if (!token) {
    abrirModalAgendamento(horarioId);
  } else {
    alert(`Agendamento interno para o horário ID: ${horarioId}`);
  }
}