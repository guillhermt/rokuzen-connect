// Lista unidades e permite abrir unidade.html?unit=<id>
document.addEventListener('DOMContentLoaded', ()=>{
    function renderUnits(){
      const root = document.getElementById('unitsArea');
      root.innerHTML = '';
      const data = JSON.parse(localStorage.getItem('rok_data') || '{}');
      (data.units || []).forEach(u=>{
        const tpl = document.getElementById('unitCardTemplate');
        const node = tpl.content.cloneNode(true);
        node.querySelector('.unit-name').textContent = u.name;
        const postsGrid = node.querySelector('.posts-grid');
        u.posts.slice(0,3).forEach(p=>{
          const mini = document.createElement('div');
          mini.className = 'post-card';
          const dot = document.createElement('div');
          dot.className = 'status-dot ' + (p.status === 'free' ? 'green' : (p.status==='occupied'?'red':(p.status==='interval'?'yellow':'gray')));
          dot.style.marginBottom='.4rem';
          mini.appendChild(dot);
          const title = document.createElement('div');
          title.innerHTML = `<strong>${p.name}</strong><div class="small-note">${p.type}</div>`;
          mini.appendChild(title);
          postsGrid.appendChild(mini);
        });
        node.querySelector('.next-appointments').textContent = (u.appointments && u.appointments[0]) ? 'Próx: ' + u.appointments[0].time + ' - ' + u.appointments[0].client : 'Sem agendamentos';
        const view = node.querySelector('.view-btn');
        view.addEventListener('click', ()=> location.href = `unidade.html?unit=${u.id}`);
        root.appendChild(node);
      });
    }
  
    // header user info
    const headerActions = document.getElementById('headerActions');
    const user = JSON.parse(sessionStorage.getItem('rok_user') || 'null');
    if(user){
      headerActions.innerHTML = `<span class="badge">${user.role.toUpperCase()}: ${user.name}</span> <a class="btn ghost small" href="dashboard.html" id="logout">Sair</a>`;
      document.getElementById('logout').addEventListener('click', ()=>{
        sessionStorage.removeItem('rok_user');
        location.reload();
      });
    }
  
    renderUnits();
  
    window.addEventListener('storage', (e)=>{
      if(e.key === 'rok_data') renderUnits();
    });
  });
  