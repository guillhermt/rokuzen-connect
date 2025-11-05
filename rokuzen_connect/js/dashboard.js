document.addEventListener('DOMContentLoaded', () => {
  setupHeader();
  renderUnits();
  setupStorageListener();
});

function setupHeader() {
  const headerActions = document.getElementById('headerActions');
  const user = JSON.parse(sessionStorage.getItem('rok_user') || 'null');

  if (user) {
    headerActions.innerHTML = `<span class="badge">${user.role.toUpperCase()}: ${user.name}</span> <a class="btn ghost small" href="dashboard.html" id="logout">Sair</a>`;

    const logoutButton = document.getElementById('logout');
    logoutButton.addEventListener('click', (e) => {
      e.preventDefault();
      sessionStorage.removeItem('rok_user');
      location.reload();
    });
  }
}

function renderUnits() {
  const root = document.getElementById('unitsArea');
  const template = document.getElementById('unitCardTemplate');

  if (!root || !template) return;

  const data = JSON.parse(localStorage.getItem('rok_data') || '{}');
  const units = data.units || [];

  root.innerHTML = '';

  units.forEach(unit => {
    const node = template.content.cloneNode(true);
    const postsGrid = node.querySelector('.posts-grid');

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

    const viewButton = node.querySelector('.view-btn');
    viewButton.addEventListener('click', () => {
      location.href = `unidade.html?unit=${unit.id}`;
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

  const miniCard = document.createElement('div');
  miniCard.className = 'post-card';

  const dot = document.createElement('div');
  dot.className = `status-dot ${color}`;
  dot.style.marginBottom = '.4rem';
  miniCard.appendChild(dot);

  const title = document.createElement('div');
  title.innerHTML = `<strong>${post.name}</strong><div class="small-note">${post.type}</div>`;
  miniCard.appendChild(title);

  return miniCard;
}