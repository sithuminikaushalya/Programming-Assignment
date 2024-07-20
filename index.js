const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const port = 3000;

app.use(bodyParser.json());

const url = 'mongodb://127.0.0.1:27017'; // Add the correct scheme
const dbName = 'transfer-api';
let db;
let accountsCollection;
let transactionsCollection;

MongoClient.connect(url)
  .then(client => {
    console.log('Connected to Database');
    db = client.db(dbName);
    accountsCollection = db.collection('accounts');
    transactionsCollection = db.collection('transactions');

    // Start the server after the database connection is established
    app.listen(port, () => {
      console.log(`Transfer API running on http://localhost:${port}`);
    });
  })
  .catch(err => console.error(err));

// Endpoint to transfer money between accounts
app.post('/transfer', async (req, res) => {
  const { sourceAccount, destinationAccount, amount } = req.body;

  if (!sourceAccount || !destinationAccount || !amount) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const sourceAcc = await accountsCollection.findOne({ accountNumber: sourceAccount });
  const destAcc = await accountsCollection.findOne({ accountNumber: destinationAccount });

  if (!sourceAcc || !destAcc) {
    return res.status(404).json({ error: 'Account not found' });
  }

  if (sourceAcc.balance < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  await accountsCollection.updateOne({ accountNumber: sourceAccount }, { $inc: { balance: -amount } });
  await accountsCollection.updateOne({ accountNumber: destinationAccount }, { $inc: { balance: amount } });

  const transaction = {
    sourceAccount,
    destinationAccount,
    amount,
    date: new Date(),
  };

  await transactionsCollection.insertOne(transaction);

  res.status(200).json({ message: 'Transfer successful', transaction });
});

// Endpoint to get the balance of a specific account
app.get('/accounts/:accountNumber', async (req, res) => {
  const { accountNumber } = req.params;

  const account = await accountsCollection.findOne({ accountNumber });

  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  res.status(200).json({ accountNumber, balance: account.balance });
});

// Endpoint to get the transaction history of a specific account
app.get('/transactions/:accountNumber', async (req, res) => {
  const { accountNumber } = req.params;

  const transactions = await transactionsCollection.find({
    $or: [
      { sourceAccount: accountNumber },
      { destinationAccount: accountNumber }
    ]
  }).toArray();

  res.status(200).json(transactions);
});
