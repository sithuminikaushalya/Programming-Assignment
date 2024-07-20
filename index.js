const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// MongoDB connection details
const url = 'mongodb://127.0.0.1:27017';
const dbName = 'transfer-api';
let db;
let accountsCollection;
let transactionsCollection;

// Connect to MongoDB and set up collections
MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    console.log('Connected to Database');
    db = client.db(dbName);
    accountsCollection = db.collection('accounts');
    transactionsCollection = db.collection('transactions');

    // Start the Express server
    app.listen(port, () => {
      console.log(`Transfer API running on http://localhost:${port}`);
    });
  })
  .catch(err => console.error('Failed to connect to the database:', err));

// Transfer money between accounts
app.post('/transfer', async (req, res) => {
  const { sourceAccount, destinationAccount, amount } = req.body;

  if (!sourceAccount || !destinationAccount || !amount) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    const sourceAcc = await accountsCollection.findOne({ accountNumber: sourceAccount });
    const destAcc = await accountsCollection.findOne({ accountNumber: destinationAccount });

    if (!sourceAcc || !destAcc) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (sourceAcc.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Update account balances
    await accountsCollection.updateOne({ accountNumber: sourceAccount }, { $inc: { balance: -amount } });
    await accountsCollection.updateOne({ accountNumber: destinationAccount }, { $inc: { balance: amount } });

    // Record the transaction
    const transaction = {
      sourceAccount,
      destinationAccount,
      amount,
      date: new Date(),
    };

    await transactionsCollection.insertOne(transaction);

    res.status(200).json({ message: 'Transfer successful', transaction });
  } catch (error) {
    console.error('Error processing transfer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get account details
app.get('/accounts/:accountNumber', async (req, res) => {
  const { accountNumber } = req.params;

  try {
    const account = await accountsCollection.findOne({ accountNumber });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.status(200).json({ accountNumber, balance: account.balance });
  } catch (error) {
    console.error('Error fetching account details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get transactions for an account
app.get('/transactions/:accountNumber', async (req, res) => {
  const { accountNumber } = req.params;

  try {
    const transactions = await transactionsCollection.find({
      $or: [
        { sourceAccount: accountNumber },
        { destinationAccount: accountNumber }
      ]
    }).toArray();

    res.status(200).json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
