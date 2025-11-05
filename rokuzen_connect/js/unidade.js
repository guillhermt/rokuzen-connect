const app = {
  unitId: null,
  user: null,
  activeTimers: []
};

function loadData() {
  return JSON.parse(localStorage.getItem('rok_data') || '{}');
}

function saveData(d) {
  d.lastChange = Date.now();
  localStorage.setItem('rok_data', JSON.stringify(d));
}

function findUnit(d) {
  return (d.units || []).find(u => u.id === app.unitId) || (d.units && d.units[0]);
}

function _renderTherapists(therapists) {
  const therapistsList = document.getElementById('therapistsList');
  therapistsList.innerHTML = '';
  therapists.forEach(t => {
      const div = document.createElement('div');
      div.className = 'therapist';
      div.innerHTML = `<strong>${t.name}</strong><div class="role">${t.status === 'on' ? 'Em sessão' : 'Disponível'}</div>`;
      therapistsList.appendChild(div);
  });
}

function _renderAppointments(unit) {
  const nextAppointments = document.getElementById('nextAppointments');
  nextAppointments.innerHTML = '';
  (unit.appointments || []).slice(0, 6).forEach(a => {
      const li = document.createElement('li');
      const th = unit.therapists.find(t => t.id === a.therapistId) || { name: '-' };
      li.textContent = `${a.time} - ${a.client} (${th.name})`;
      nextAppointments.appendChild(li);
  });
}

function _renderPosts(posts) {
  const postsGrid = document.getElementById('postsGrid');
  postsGrid.innerHTML = '';

  posts.forEach(p => {
      const tpl = document.getElementById('postTemplate');
      const node = tpl.content.cloneNode(true);
      const card = node.querySelector('.post-card');

      node.querySelector('.post-name').textContent = p.name;
      node.querySelector('.post-type').textContent = p.type;
      
      const statusDot = node.querySelector('.status-dot');
      const statusMap = { 'free': 'green', 'occupied': 'red', 'interval': 'yellow' };
      statusDot.className = 'status-dot ' + (statusMap[p.status] || 'gray');
      
      node.querySelector('.assigned').textContent = p.currentSession ? `Terapeuta: ${p.currentSession.therapistName}` : 'Nenhum';

      const timerEl = node.querySelector('.timer');
      const startBtn = node.querySelector('.start');
      const endBtn = node.querySelector('.end');
      const maintenanceBtn = node.querySelector('.maintenance');

      function updateTimer() {
          if (p.currentSession) {
              const started = p.currentSession.startAt;
              const elapsed = Math.floor((Date.now() - started) / 1000);
              const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
              const ss = String(elapsed % 60).padStart(2, '0');
              timerEl.textContent = `Tempo: ${mm}:${ss}`;
              endBtn.disabled = false;
              startBtn.disabled = true;
          } else {
              timerEl.textContent = '';
              endBtn.disabled = true;
              startBtn.disabled = false;
          }
      }

      startBtn.addEventListener('click', () => handleStart(p.id));
      endBtn.addEventListener('click', () => handleEnd(p.id));
      maintenanceBtn.addEventListener('click', () => handleMaintenance(p.id));

      updateTimer();
      app.activeTimers.push(setInterval(updateTimer, 1000));

      postsGrid.appendChild(node);
  });
}

function handleStart(postId) {
  const d = loadData();
  const u = findUnit(d);
  const post = u.posts.find(x => x.id === postId);

  if (post.status !== 'free') {
      return alert('Posto não disponível');
  }

  let therapist = null;
  if (app.user && app.user.role === 'terapeuta') {
      therapist = u.therapists.find(t => t.name === app.user.name || t.id === app.user.id);
      if (!therapist) {
          therapist = { id: 't_' + Date.now(), name: app.user.name, status: 'on', currentPost: post.id };
          u.therapists.push(therapist);
      } else {
          if (therapist.currentPost) {
              return alert('Você já está em outra sessão');
          }
          therapist.status = 'on';
          therapist.currentPost = post.id;
      }
  } else {
      const choice = prompt('Informe o nome do terapeuta que atenderá (ex: Ana)');
      if (!choice) return;
      therapist = u.therapists.find(t => t.name === choice);
      if (!therapist) return alert('Terapeuta não encontrado na unidade');
      if (therapist.currentPost) return alert('Terapeuta já em outra sessão');
      therapist.status = 'on';
      therapist.currentPost = post.id;
  }

  const sessionId = 's_' + Date.now();
  post.status = 'occupied';
  post.currentSession = { id: sessionId, therapistId: therapist.id, therapistName: therapist.name, startAt: Date.now() };
  
  if (!d.sessions) d.sessions = {};
  d.sessions[sessionId] = post.currentSession;
  
  saveData(d);
  render();
}

function handleEnd(postId) {
  const d = loadData();
  const u = findUnit(d);
  const post = u.posts.find(x => x.id === postId);
  if (!post.currentSession) return;

  const sid = post.currentSession.id;
  const therapistId = post.currentSession.therapistId;

  post.currentSession = null;
  post.status = 'interval';
  
  const intervalMs = 10 * 60 * 1000;
  post.intervalUntil = Date.now() + intervalMs;

  const therapist = u.therapists.find(t => t.id === therapistId);
  if (therapist) {
      therapist.status = 'off';
      therapist.currentPost = null;
  }

  if (d.sessions && d.sessions[sid]) delete d.sessions[sid];
  saveData(d);
  render();

  setTimeout(() => {
      const d2 = loadData();
      const u2 = findUnit(d2);
      const post2 = u2.posts.find(x => x.id === postId);
      if (post2 && post2.status === 'interval' && Date.now() >= (post2.intervalUntil || 0)) {
          post2.status = 'free';
          delete post2.intervalUntil;
          saveData(d2);
      }
  }, intervalMs + 2000);
}

function handleMaintenance(postId) {
  const d = loadData();
  const u = findUnit(d);
  const post = u.posts.find(x => x.id === postId);
  
  post.status = post.status === 'maintenance' ? 'free' : 'maintenance';
  if (post.status === 'free') post.currentSession = null;
  
  saveData(d);
  render();
}

function render() {
  app.activeTimers.forEach(clearInterval);
  app.activeTimers = [];

  const data = loadData();
  const unit = findUnit(data);
  
  document.getElementById('unitTitle').textContent = unit.name;

  _renderTherapists(unit.therapists);
  _renderPosts(unit.posts);
  _renderAppointments(unit);
}

function startIntervalChecker() {
  setInterval(() => {
      const d = loadData();
      let changed = false;
      d.units.forEach(u => {
          u.posts.forEach(p => {
              if (p.status === 'interval' && p.intervalUntil && Date.now() >= p.intervalUntil) {
                  p.status = 'free';
                  delete p.intervalUntil;
                  changed = true;
              }
          });
      });
      if (changed) saveData(d);
  }, 5000);
}

function main() {
  const params = new URLSearchParams(location.search);
  app.unitId = params.get('unit') || null;
  app.user = JSON.parse(sessionStorage.getItem('rok_user') || 'null');
  
  const userInfo = document.getElementById('userInfo');
  if (app.user) {
      userInfo.innerHTML = `<span class="badge">${app.user.role.toUpperCase()}: ${app.user.name}</span>`;
  }

  window.addEventListener('storage', (e) => {
      if (e.key === 'rok_data') render();
  });

  startIntervalChecker();
  render();
}

document.addEventListener('DOMContentLoaded', main);