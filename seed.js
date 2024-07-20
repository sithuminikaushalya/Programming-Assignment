const { MongoClient } = require('mongodb');

// MongoDB connection details
const url = 'mongodb://127.0.0.1:27017'; 
const dbName = 'transfer-api';

// Connect to MongoDB and seed the database with initial data
MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async client => {
    console.log('Connected to Database');
    const db = client.db(dbName);
    const accountsCollection = db.collection('accounts');

    // Define the initial accounts to be seeded
    const accounts = [
      { accountNumber: '123', balance: 1000 },
      { accountNumber: '456', balance: 2000 },
      { accountNumber: '789', balance: 3000 },
    ];

    // Insert the initial accounts into the collection
    try {
      await accountsCollection.insertMany(accounts);
      console.log('Accounts seeded successfully');
    } catch (error) {
      console.error('Error seeding accounts:', error);
    } finally {
      // Ensure the client is closed regardless of success or failure
      client.close();
    }
  })
  .catch(err => {
    console.error('Failed to connect to the database:', err);
  });
