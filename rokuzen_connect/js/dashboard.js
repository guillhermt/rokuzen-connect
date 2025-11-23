document.addEventListener('DOMContentLoaded', () => {
  setupHeader();
  renderUnits();
  setupStorageListener();
});

function setupHeader() {
  const headerActions = document.getElementById('headerActions');
  const user = JSON.parse(sessionStorage.getItem('rok_user') || 'null');

  if (user) {
    headerActions.innerHTML = `<span class="badge bg-success">${user.role.toUpperCase()}: ${user.name}</span> <a class="btn btn-outline-success btn-sm" href="#" id="logout">Sair</a>`;

    const logoutButton = document.getElementById('logout');
    logoutButton.addEventListener('click', (e) => {
      e.preventDefault();
      sessionStorage.removeItem('rok_user');
      location.reload();
    });
  }
}

function renderUnits() {
  const root = document.getElementById('unitsGrid');
  const template = document.getElementById('unitCardTemplate');

  if (!root || !template) return;

  const data = JSON.parse(localStorage.getItem('rok_data') || '{}');
  const units = data.units || [];

  root.innerHTML = '';

  units.forEach(unit => {
    const node = template.content.cloneNode(true);
    const postsGrid = node.querySelector('[data-posts]');

    node.querySelector('.unit-name').textContent = unit.name;

    const postsToShow = unit.posts.slice(0, 3);
    postsToShow.forEach(post => {
      const miniPostElement = createMiniPostElement(post);
      postsGrid.appendChild(miniPostElement);
    });

    const nextAppointment = (unit.appointments && unit.appointments[0]);
    node.querySelector('.next-appointments').textContent = nextAppointment
      ? `Próx: ${nextAppointment.time} - ${nextAppointment.client}`
      : 'Sem agendamentos';

    // CORREÇÃO SIMPLES: Usar caminho relativo correto
    const viewButton = node.querySelector('.view-btn');
    
    // Se o dashboard está em /screens/, então unidade.html está na mesma pasta
    viewButton.href = `unidade.html?unit=${unit.id}`;
    
    // Event listener para garantir a navegação
    viewButton.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = `unidade.html?unit=${unit.id}`;
    });

    root.appendChild(node);
  });
}

function setupStorageListener() {
  window.addEventListener('storage', (e) => {
    if (e.key === 'rok_data') {
      renderUnits();
    }
  });
}

function createMiniPostElement(post) {
  const statusColorMap = {
    'free': 'green',
    'occupied': 'red', 
    'interval': 'yellow',
  };
  const color = statusColorMap[post.status] || 'gray';

  const template = document.getElementById('postInUnitTemplate');
  const node = template.content.cloneNode(true);

  node.querySelector('.post-type').textContent = post.type || 'Posto';
  node.querySelector('.post-name').textContent = post.name;
  node.querySelector('.status-dot').className = `status-dot ${color}`;
  
  const assigned = node.querySelector('.assigned');
  const timer = node.querySelector('.timer');
  
  if (post.assigned && post.assigned !== 'undefined') {
    assigned.textContent = post.assigned;
  } else {
    assigned.style.display = 'none';
  }
  
  if (post.timer && post.timer !== 'undefined') {
    timer.textContent = post.timer;
  } else {
    timer.style.display = 'none';
  }

  return node;
}