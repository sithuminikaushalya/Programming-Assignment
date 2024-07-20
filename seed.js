const { MongoClient } = require('mongodb');

const url = 'mongodb://127.0.0.1:27017'; 
const dbName = 'transfer-api';

MongoClient.connect(url)
  .then(async client => {
    console.log('Connected to Database');
    const db = client.db(dbName);
    const accountsCollection = db.collection('accounts');

    const accounts = [
      { accountNumber: '123', balance: 1000 },
      { accountNumber: '456', balance: 2000 },
      { accountNumber: '789', balance: 3000 },
    ];

    await accountsCollection.insertMany(accounts);
    console.log('Accounts seeded');
    client.close();
  })
  .catch(err => console.error(err));
