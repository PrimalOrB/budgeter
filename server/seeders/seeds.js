const faker = require('faker');

const db = require('../config/connection');
const { } = require('../models');

db.once('open', async () => {
  
  console.log('all done!');
  process.exit(0);
});
