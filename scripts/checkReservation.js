const { MongoClient } = require('mongodb');
(async ()=>{
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('booking-app');
  const col = db.collection('reservations');
  console.log('count=', await col.countDocuments());
  console.log(await col.findOne());
  await client.close();
})();