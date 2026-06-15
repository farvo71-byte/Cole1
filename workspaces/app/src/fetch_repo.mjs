import fs from 'node:fs';
fetch('https://api.github.com/repos/pewdiepie-archdaemon/odysseus/git/trees/main?recursive=1', {headers: {'User-Agent': 'NodeJS'}})
  .then(r=>r.json())
  .then(j=>console.log(JSON.stringify(j).slice(0,1000)))
  .catch(console.error);
