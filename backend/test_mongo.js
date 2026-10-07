const mongoose = require('mongoose');

const uri = 'mongodb+srv://nahomjemberu22_db_user:test1234@cluster0.xnp8ger.mongodb.net/AbayHub?appName=Cluster0';

mongoose.connect(uri)
  .then(() => {
    console.log('✅ Connected successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Failed to connect:');
    console.error(err);
    process.exit(1);
  });
