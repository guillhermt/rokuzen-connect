// Lógica principal de controle de posto e sessões, timers, conflitos, intervalo automático de 10min
document.addEventListener('DOMContentLoaded', ()=>{
    const params = new URLSearchParams(location.search);
    const unitId = params.get('unit') || null;
    const user = JSON.parse(sessionStorage.getItem('rok_user') || 'null');
    const unitTitle = document.getElementById('unitTitle');
    const postsGrid = document.getElementById('postsGrid');
    const therapistsList = document.getElementById('therapistsList');
    const nextAppointments = document.getElementById('nextAppointments');
    const userInfo = document.getElementById('userInfo');
  
    if(user) userInfo.innerHTML = `<span class="badge">${user.role.toUpperCase()}: ${user.name}</span>`;
  
    function loadData(){
      return JSON.parse(localStorage.getItem('rok_data') || '{}');
    }
    function saveData(d){
      d.lastChange = Date.now();
      localStorage.setItem('rok_data', JSON.stringify(d));
    }
  
    function findUnit(d){
      return (d.units || []).find(u => u.id === unitId) || (d.units && d.units[0]);
    }
  
    function render(){
      const data = loadData();
      const unit = findUnit(data);
      unitTitle.textContent = unit.name;
      // escala
      therapistsList.innerHTML = '';
      unit.therapists.forEach(t=>{
        const div = document.createElement('div');
        div.className = 'therapist';
        div.innerHTML = `<strong>${t.name}</strong><div class="role">${t.status === 'on' ? 'Em sessão' : 'Disponível'}</div>`;
        therapistsList.appendChild(div);
      });
  
      // posts
      postsGrid.innerHTML = '';
      unit.posts.forEach(p=>{
        const tpl = document.getElementById('postTemplate');
        const node = tpl.content.cloneNode(true);
        const card = node.querySelector('.post-card');
        node.querySelector('.post-name').textContent = p.name;
        node.querySelector('.post-type').textContent = p.type;
        const statusDot = node.querySelector('.status-dot');
        statusDot.className = 'status-dot ' + (p.status==='free'?'green':(p.status==='occupied'?'red':(p.status==='interval'?'yellow':'gray')));
        node.querySelector('.assigned').textContent = p.currentSession ? `Terapeuta: ${p.currentSession.therapistName}` : 'Nenhum';
        const timerEl = node.querySelector('.timer');
        const startBtn = node.querySelector('.start');
        const endBtn = node.querySelector('.end');
        const maintenanceBtn = node.querySelector('.maintenance');
  
        // timer update
        let intervalRef = null;
        function updateTimer(){
          if(p.currentSession){
            const started = p.currentSession.startAt;
            const elapsed = Math.floor((Date.now() - started)/1000);
            const mm = String(Math.floor(elapsed/60)).padStart(2,'0');
            const ss = String(elapsed%60).padStart(2,'0');
            timerEl.textContent = `Tempo: ${mm}:${ss}`;
            endBtn.disabled = false;
            startBtn.disabled = true;
          } else {
            timerEl.textContent = '';
            endBtn.disabled = true;
            startBtn.disabled = false;
          }
        }
  
        // start
        startBtn.addEventListener('click', ()=>{
          const d = loadData(); const u = findUnit(d);
          const post = u.posts.find(x=>x.id===p.id);
          // conflito: posto ocupado?
          if(post.status !== 'free'){
            return alert('Posto não disponível');
          }
          // terapeuta selecionado se houver login terapeuta, caso contrário pedir escolha
          let therapist = null;
          if(user && user.role === 'terapeuta'){
            therapist = u.therapists.find(t=>t.name === user.name || t.id===user.id);
            if(!therapist){
              // se terapeuta não existir, cria temporariamente
              therapist = { id: 't_' + Date.now(), name: user.name, status:'on', currentPost: post.id };
              u.therapists.push(therapist);
            } else {
              // conflito: terapeuta já em outro posto?
              if(therapist.currentPost){
                return alert('Você já está em outra sessão');
              }
              therapist.status = 'on';
              therapist.currentPost = post.id;
            }
          } else {
            // recepção: pedir escolha de terapeuta
            const choice = prompt('Informe o nome do terapeuta que atenderá (ex: Ana)');
            if(!choice) return;
            therapist = u.therapists.find(t=>t.name === choice);
            if(!therapist) return alert('Terapeuta não encontrado na unidade');
            if(therapist.currentPost) return alert('Terapeuta já em outra sessão');
            therapist.status = 'on';
            therapist.currentPost = post.id;
          }
  
          // criar sessão
          const sessionId = 's_' + Date.now();
          post.status = 'occupied';
          post.currentSession = { id: sessionId, therapistId: therapist.id, therapistName: therapist.name, startAt: Date.now() };
          if(!d.sessions) d.sessions = {};
          d.sessions[sessionId] = post.currentSession;
          saveData(d);
          render();
          // assegura timer localmente
          updateTimer();
        });
  
        // end
        endBtn.addEventListener('click', ()=>{
          const d = loadData(); const u = findUnit(d);
          const post = u.posts.find(x=>x.id===p.id);
          if(!post.currentSession) return;
          const sid = post.currentSession.id;
          const therapistId = post.currentSession.therapistId;
          // finalizar sessão
          post.currentSession = null;
          post.status = 'interval';
          // marcar intervalo automático de 10 minutos
          const intervalMs = 10 * 60 * 1000;
          post.intervalUntil = Date.now() + intervalMs;
          // liberar terapeuta
          const therapist = u.therapists.find(t=>t.id === therapistId);
          if(therapist){
            therapist.status = 'off';
            therapist.currentPost = null;
          }
          // remover sessão do mapa
          if(d.sessions && d.sessions[sid]) delete d.sessions[sid];
          saveData(d);
          render();
  
          // agendar liberação do posto ao fim do intervalo (uso de setTimeout para aba ativa)
          setTimeout(()=>{
            const d2 = loadData(); const u2 = findUnit(d2);
            const post2 = u2.posts.find(x=>x.id===p.id);
            if(post2 && post2.status === 'interval' && Date.now() >= (post2.intervalUntil || 0)){
              post2.status = 'free';
              delete post2.intervalUntil;
              saveData(d2);
            }
          }, intervalMs + 2000);
        });
  
        // maintenance toggle
        maintenanceBtn.addEventListener('click', ()=>{
          const d = loadData(); const u = findUnit(d);
          const post = u.posts.find(x=>x.id===p.id);
          post.status = post.status === 'maintenance' ? 'free' : 'maintenance';
          if(post.status === 'free') post.currentSession = null;
          saveData(d); render();
        });
  
        // update UI interval
        updateTimer();
        intervalRef = setInterval(updateTimer,1000);
  
        postsGrid.appendChild(node);
      });
  
      // próximos agendamentos
      nextAppointments.innerHTML = '';
      (unit.appointments || []).slice(0,6).forEach(a=>{
        const li = document.createElement('li');
        const th = unit.therapists.find(t=>t.id===a.therapistId) || {name:'-'} ;
        li.textContent = `${a.time} - ${a.client} (${th.name})`;
        nextAppointments.appendChild(li);
      });
    }
  
    // reagir a mudanças feitas em outras abas
    window.addEventListener('storage', (e)=>{
      if(e.key === 'rok_data') render();
    });
  
    // periodic check para liberar intervalos expirados
    setInterval(()=>{
      const d = loadData();
      let changed = false;
      d.units.forEach(u=>{
        u.posts.forEach(p=>{
          if(p.status === 'interval' && p.intervalUntil && Date.now() >= p.intervalUntil){
            p.status = 'free';
            delete p.intervalUntil;
            changed = true;
          }
        })
      });
      if(changed) saveData(d);
    }, 5000);
  
    render();
  });
  