const API_BASE = "http://localhost:3000";
const token = localStorage.getItem("token");
const urlParams = new URLSearchParams(window.location.search);
const unidadeId = urlParams.get("id");

document.addEventListener("DOMContentLoaded", () => {
  if (!unidadeId) {
    alert("Unidade não informada");
    window.location.href = "dashboard.html";
    return;
  }

  carregarUnidade();
  verificarUsuario();
});

async function apiFetch(url, options = {}) {
  const headers = { ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}

async function carregarUnidade() {
  try {
    const res = await apiFetch(`${API_BASE}/unidades/${unidadeId}`);
    if (!res.ok) throw new Error("Unidade não encontrada");
    const unidade = await res.json();
    document.getElementById("unitTitle").textContent = unidade.nome_unidade;

    carregarPostos();
    carregarHorariosDisponiveis(); // ← agora serve pras duas views!
  } catch (err) {
    console.error(err);
    alert("Erro ao carregar unidade");
  }
}

function carregarPostos() {
  const grid = document.getElementById("postsGrid");
  if (!grid) return;
  grid.innerHTML = `<div class="col-12 text-center text-muted py-5"><p>Postos em desenvolvimento...</p></div>`;
}

// FUNÇÃO QUE AGORA SERVE PARA TODAS AS VIEWS
async function carregarHorariosDisponiveis() {
  const hoje = new Date().toISOString().split("T")[0];
  const url = `${API_BASE}/horarios/disponiveis?unidade_id=${unidadeId}&data=${hoje}`;

  try {
    const res = await apiFetch(url);
    if (!res.ok) throw new Error("Erro ao carregar horários");

    const horarios = await res.json();

    // === VIEW RECEPÇÃO/ADMIN ===
    const listaAdmin = document.getElementById("nextAppointments");
    if (listaAdmin) {
      if (horarios.length === 0) {
        listaAdmin.innerHTML =
          "<li class='list-group-item text-muted text-center py-4'>Nenhum horário hoje</li>";
      } else {
        listaAdmin.innerHTML = "";
        horarios.forEach((h) => {
          const li = document.createElement("li");
          li.className =
            "list-group-item d-flex justify-content-between align-items-center py-3";
          li.innerHTML = `
            <div>
              <strong class="fs-5">${h.horario}</strong>
              <small class="text-muted ms-2">
                ${
                  h.terapeuta
                    ? `- ${h.terapeuta}`
                    : "<em class='text-success'>Livre</em>"
                }
              </small>
            </div>
            <button class="btn btn-success btn-sm px-4" onclick="agendar(${
              h.id
            })">
              Agendar
            </button>
          `;
          listaAdmin.appendChild(li);
        });
      }
    }

    // === VIEW CLIENTE (AQUI É O QUE TAVA FALTANDO!!!) ===
    const roomsGrid = document.getElementById("roomsGrid");
    if (roomsGrid) {
      if (horarios.length === 0) {
        roomsGrid.innerHTML = `<div class="col-12 text-center py-5"><h4 class="text-muted">Nenhum horário disponível hoje</h4></div>`;
        return;
      }

      roomsGrid.innerHTML = "";
      horarios.forEach((h, index) => {
        const template = document
          .getElementById("clientRoomTemplate")
          .content.cloneNode(true);
        template.querySelector(".room-number").textContent = index + 1;
        template.querySelector(".therapist-name").textContent =
          h.terapeuta || "Qualquer terapeuta";
        template.querySelector(".book-room").onclick = () =>
          abrirModalAgendamento(h.id);
        roomsGrid.appendChild(template);
      });
    }
  } catch (err) {
    console.error(err);
    const erroMsg =
      "<div class='col-12 text-danger text-center py-4'>Erro ao carregar horários</div>";
    document
      .getElementById("nextAppointments")
      ?.insertAdjacentHTML("beforeend", erroMsg);
    document
      .getElementById("roomsGrid")
      ?.insertAdjacentHTML("beforeend", erroMsg);
  }
}

function verificarUsuario() {
  const user = JSON.parse(localStorage.getItem("rok_user") || "null");

  if (!user || !token) {
    // CLIENTE
    document.getElementById("receptionView").style.display = "none";
    document.getElementById("therapistView").style.display = "none";
    document.getElementById("clientView").style.display = "block";
  } else if (user.tipo_colaborador === 3) {
    // TERAPEUTA
    document.getElementById("receptionView").style.display = "none";
    document.getElementById("therapistView").style.display = "block";
    document.getElementById("clientView").style.display = "none";
  } else {
    // ADMIN / RECEPÇÃO
    document.getElementById("receptionView").style.display = "block";
    document.getElementById("therapistView").style.display = "none";
    document.getElementById("clientView").style.display = "none";
  }
}

// ABRE O MODAL COM O HORÁRIO ESCOLHIDO
function abrirModalAgendamento(horarioId) {
  document.getElementById("unidadeSelecionada").value = unidadeId;
  // Pode salvar o horário também se quiser mostrar no modal
  new bootstrap.Modal(document.getElementById("modalAgendamento")).show();
}

function agendar(horarioId) {
  if (!token) {
    abrirModalAgendamento(horarioId);
  } else {
    alert(`Agendamento interno: Horário ${horarioId}`);
  }
}
