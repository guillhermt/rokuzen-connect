// login simples; grava user na sessionStorage e redireciona
document.addEventListener('DOMContentLoaded', ()=>{
    const unitSelect = document.getElementById('unitSelect');
    const data = JSON.parse(localStorage.getItem('rok_data') || '{}');
    (data.units || []).forEach(u=>{
      const opt = document.createElement('option');
      opt.value = u.id; opt.textContent = u.name;
      unitSelect.appendChild(opt);
    });
  
    document.getElementById('loginForm').addEventListener('submit', e=>{
      e.preventDefault();
      const role = document.getElementById('role').value;
      const userName = document.getElementById('userName').value.trim();
      const unitId = document.getElementById('unitSelect').value;
      if(!userName) return alert('Informe o nome');
      const user = { role, name: userName, unitId, id: 'u_'+Date.now() };
      sessionStorage.setItem('rok_user', JSON.stringify(user));
      location.href = 'dashboard.html';
    });
  });
  