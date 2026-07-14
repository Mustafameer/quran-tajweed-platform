const fs = require('fs');
const code = fs.readFileSync('server.ts', 'utf8');
const startIdx = code.indexOf('users = [');
const endIdx = code.indexOf('];', startIdx);
console.log(code.substring(startIdx, endIdx + 2));
