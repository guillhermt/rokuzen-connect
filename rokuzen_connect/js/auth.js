const API_LOGIN = "http://localhost:3000/login";

// ==================== TOKEN GLOBAL ====================
function getToken() {
  return localStorage.getItem("token");
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.href = "../screens/login.html";
}

// ==================== LOGIN ====================
const form = document.getElementById("loginForm");

// Cria ou atualiza mensagem visual
function exibirMensagem(tipo, texto) {
  let alerta = document.getElementById("alertaLogin");

  if (!alerta) {
    alerta = document.createElement("div");
    alerta.id = "alertaLogin";
    alerta.className = "alert mt-3";
    form.appendChild(alerta);
  }

  alerta.className = `alert alert-${tipo}`;
  alerta.innerText = texto;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("userName").value;
  const senha = document.getElementById("senha").value;

  exibirMensagem("info", "Autenticando...");

  try {
    const response = await fetch(API_LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });

    const data = await response.json();

    if (!response.ok) {
      exibirMensagem("danger", data.erro || "E-mail ou senha inválidos.");
      return;
    }

    // Salva token
    localStorage.setItem("token", data.token);

    // Decodifica token
    const payload = JSON.parse(atob(data.token.split(".")[1]));
    localStorage.setItem("usuario", JSON.stringify(payload));

    exibirMensagem("success", "Login realizado com sucesso! Redirecionando...");

    // Redirecionamento com delay visual
    setTimeout(() => {
      switch (payload.tipo_colaborador) {
        case 1:
          window.location.href = "admindashboard.html";
          break;
        case 2:
          window.location.href = "recepcao.html";
          break;
        case 3:
          window.location.href = "terapeuta.html";
          break;
        default:
          exibirMensagem("warning", "Tipo de usuário não reconhecido.");
      }
    }, 800);
  } catch (error) {
    console.error(error);
    exibirMensagem(
      "danger",
      "Erro ao conectar com o servidor. Verifique sua internet ou backend."
    );
  }
});