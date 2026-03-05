const path = require('path');
const fs = require('fs');

const basePath = path.resolve(__dirname, '..');
console.log('__dirname:', __dirname);
console.log('basePath:', basePath);
console.log('memory full path:', path.join(basePath, 'memory'));
console.log('memory exists:', fs.existsSync(path.join(basePath, 'memory')));
