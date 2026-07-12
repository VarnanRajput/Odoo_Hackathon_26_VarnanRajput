const { Asset } = require('../models');

const test = async () => {
  global.useInMemoryDb = true; // force mock DB
  
  const query = { shared: true };
  const assets = await Asset.find(query);
  console.log('Query:', query);
  console.log('Results Count:', assets.length);
  console.log('Results:', assets);
  process.exit(0);
};

test();
