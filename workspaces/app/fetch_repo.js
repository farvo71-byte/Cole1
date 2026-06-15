const http = require('https');
const options = {
  hostname: 'api.github.com',
  path: '/repos/pewdiepie-archdaemon/odysseus/git/trees/main?recursive=1',
  headers: { 'User-Agent': 'NodeJS' }
};
http.get(options, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log(data));
});
