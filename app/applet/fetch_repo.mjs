const url = 'https://api.github.com/repos/pewdiepie-archdaemon/odysseus/git/trees/main?recursive=1';
fetch(url).then(r=>r.json()).then(j=>console.log(JSON.stringify(j))).catch(console.error);
