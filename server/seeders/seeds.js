const faker = require('faker');

const db = require('../config/connection');
const { } = require('../models.cjs');

db.once('open', async () => {
  
  console.log('all done!');
  process.exit(0);
});
