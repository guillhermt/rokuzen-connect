const data = JSON.parse(localStorage.getItem('rok_data'));
data.units.forEach(u => {
  u.posts.forEach(p => {
    if (!p.status || p.status !== 'free') {
      p.status = 'free';
    }
  });
});
localStorage.setItem('rok_data', JSON.stringify(data));
