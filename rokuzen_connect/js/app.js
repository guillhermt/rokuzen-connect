// Inicializa dados seed no localStorage se não existir
(function(){
    if(!localStorage.getItem('rok_data')){
      fetch('data/seed.json').then(r=>r.json()).then(seed=>{
        // estrutura de runtime: unidades, sessions (map), lastChange
        const runtime = { units: seed.units.map(u=>{
          return {...u,
            posts: u.posts.map(p=>({...p, status:'free', currentSession:null})),
            therapists: u.therapists.map(t=>({...t, status:'off', currentPost:null})),
            appointments: u.appointments || []
          }
        }), sessions: {}, lastChange: Date.now() }
        localStorage.setItem('rok_data', JSON.stringify(runtime));
      })
    }
  })();
  