document.addEventListener('DOMContentLoaded', () => {
  const data = JSON.parse(localStorage.getItem('rok_data') || '{}');
  const units = data.units || [];
  const unitSelect = document.getElementById('unitSelect');
  if (unitSelect) {
    unitSelect.innerHTML = '';
    units.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.id;
      opt.textContent = u.name;
      unitSelect.appendChild(opt);
    });
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const roleEl = document.getElementById('role');
      const nameEl = document.getElementById('userName');

      const role = roleEl ? roleEl.value : 'recepcao';
      const userName = nameEl ? nameEl.value.trim() : '';
      const unitId = unitSelect ? unitSelect.value : (units[0] && units[0].id) || '';

      if (!userName) {
        alert('Informe o nome');
        return;
      }

      const user = {
        role,
        name: userName,
        unitId,
        id: 'u_' + Date.now()
      };

      sessionStorage.setItem('rok_user', JSON.stringify(user));
      location.href = 'dashboard.html';
    });
    return;
  }
  const user = JSON.parse(sessionStorage.getItem('rok_user') || 'null');
  if (!user) {
    location.href = 'login.html';
    return;
  }
  const headerActions = document.getElementById('headerActions');
  if (headerActions) {
    headerActions.innerHTML = `
      <span class="badge">${(user.role || '').toUpperCase()}: ${user.name}</span>
      <a href="#" class="btn ghost small" id="logoutHeader">Sair</a>
    `;
    const logoutHeader = document.getElementById('logoutHeader');
    if (logoutHeader) {
      logoutHeader.addEventListener('click', (ev) => {
        ev.preventDefault();
        sessionStorage.removeItem('rok_user');
        location.href = 'login.html';
      });
    }
  }
  const userInfo = document.getElementById('userInfo');
  if (userInfo) {
    userInfo.innerHTML = `
      <span class="badge">${(user.role || '').toUpperCase()}: ${user.name}</span>
      <a href="#" class="btn ghost small" id="logoutUnit">Sair</a>
    `;
    const logoutUnit = document.getElementById('logoutUnit');
    if (logoutUnit) {
      logoutUnit.addEventListener('click', (ev) => {
        ev.preventDefault();
        sessionStorage.removeItem('rok_user');
        location.href = 'login.html';
      });
    }
  }
  window.ROK_USER = user;
});