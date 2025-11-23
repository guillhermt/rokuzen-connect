// Proteção da página
if (!getToken()) {
  window.location.href = "../screens/login.html";
}

function getToken() {
  return localStorage.getItem("token");
}

const API_URL = "http://localhost:3000/colaboradores";

async function carregarUsuarios() {
  const response = await fetch(API_URL, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  const usuarios = await response.json();
  const tabela = document.getElementById("usuariosTable");
  tabela.innerHTML = "";

  usuarios.forEach((u) => {
    tabela.innerHTML += `
<tr>
<td>${u.colaborador_id}</td>
<td>${u.nome_colaborador}</td>
<td>${u.email}</td>
<td>${u.telefone}</td>
<td>${u.tipo_colaborador}</td>
<td>
<button class="btn btn-warning btn-sm" onclick='editarUsuario(${JSON.stringify(
      u
    )})'>Editar</button>
<button class="btn btn-danger btn-sm" onclick='excluirUsuario(${
      u.colaborador_id
    })'>Excluir</button>
</td>
</tr>
`;
  });
}

function abrirModalCadastro() {
  document.getElementById("usuarioId").value = "";
  document.getElementById("modalTitulo").innerText = "Cadastrar Usuário";
}

async function salvarUsuario() {
  const id = document.getElementById("usuarioId").value;
  const dados = {
    nome_colaborador: nome.value,
    email: email.value,
    telefone: telefone.value,
    tipo_colaborador: tipo.value,
  };

  const metodo = id ? "PUT" : "POST";
  const url = id ? `${API_URL}/${id}` : API_URL;

  await fetch(url, {
    method: metodo,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(dados),
  });

  carregarUsuarios();
  bootstrap.Modal.getInstance(document.getElementById("usuarioModal")).hide();
}

function editarUsuario(usuario) {
  usuarioId.value = usuario.colaborador_id;
  nome.value = usuario.nome_colaborador;
  email.value = usuario.email;
  telefone.value = usuario.telefone;
  tipo.value = usuario.tipo_colaborador;

  modalTitulo.innerText = "Editar Usuário";
  new bootstrap.Modal(document.getElementById("usuarioModal")).show();
}

async function excluirUsuario(id) {
  if (!confirm("Deseja excluir este usuário?")) return;

  await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  carregarUsuarios();
}

window.onload = carregarUsuarios;