const url = 'https://raw.githubusercontent.com/pewdiepie-archdaemon/odysseus/main/static/style.css';
fetch(url).then(r=>r.text()).then(t=>console.log(t.slice(0, 1500))).catch(console.error);
