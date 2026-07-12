const bcrypt = require('bcrypt');

const hash = '$2b$10$flSS61Td4hM.mpjAt47COue1QqJM8Rv.2V918iSZ.PVN6896pRwDe';
const password = 'admin123';

bcrypt.compare(password, hash).then(res => {
  console.log('Match Status:', res);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
