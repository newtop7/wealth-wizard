import express from 'express';
import { createServer as createViteServer } from 'vite';
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const app = express();
const PORT = 3000;

app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000, // Fail faster if cannot connect
  })
    .then(() => console.log('Connected to MongoDB successfully!'))
    .catch(err => {
      console.error('MongoDB connection error:', err.message);
    });
    
  mongoose.connection.on('error', err => {
    console.error('MongoDB runtime error:', err);
  });
} else {
  console.warn('MONGODB_URI not provided or using placeholder. Running with mock data fallback.');
}

// Schemas
const AccountSchema = new mongoose.Schema({
  bankName: String,
  accountName: String,
  accountType: String,
  interestRate: Number,
  compounding: String,
  minBalance: Number,
  debitCardFees: Number,
  benefits: [String],
  otherCharges: String,
  tag: mongoose.Schema.Types.Mixed // Can be string or array of strings
});

const CardSchema = new mongoose.Schema({
  cardName: String,
  bankName: String,
  category: [String],
  network: mongoose.Schema.Types.Mixed,
  rewardType: String,
  fees: {
    joiningFee: Number,
    annualFee: Number,
    renewalWaiver: {
      threshold: Number,
      description: String
    }
  },
  forexCharges: {
    markupPercentage: Number,
    description: String
  },
  totalSavings: [{
    category: String,
    value: Number,
    unit: String,
    capLimit: Number
  }],
  eligibility: {
    minCibil: Number,
    minIncome: Number,
    age: {
      min: Number,
      max: Number
    },
    employment: [String]
  },
  rewards: {
    type: { type: String }, // Fixed Mongoose 'type' keyword conflict
    rate: {
      base: String,
      accelerated: String
    },
    benefits: {
      base: String,
      accelerated: String
    },
    capping: {
      earning: String,
      redemption: String
    },
    welcomeBenefit: String
  },
  cardTip: String,

  // Legacy fields
  annualFee: Number,
  benefits: [String],
  bestFor: String,
  joiningFee: Number
});

const FDSchema = new mongoose.Schema({
  bankName: String,
  tenureRange: String,
  interestRate: Number,
  seniorCitizenRate: Number,
  minAmount: Number
});

const Account = mongoose.model('Account', AccountSchema);
const Card = mongoose.model('Card', CardSchema);
const FD = mongoose.model('FD', FDSchema);

// Mock Data Fallbacks
let mockAccounts = [
  { _id: 'mock_a1', bankName: 'HDFC Bank', accountName: 'Savings Max Account', accountType: 'Savings', interestRate: 3.5, minBalance: 25000, debitCardFees: 500, benefits: ['Lounge Access', 'Free accidental cover'] },
  { _id: 'mock_a2', bankName: 'ICICI Bank', accountName: 'Regular Savings', accountType: 'Savings', interestRate: 3.0, minBalance: 10000, debitCardFees: 200, benefits: ['Reward Points'] },
  { _id: 'mock_a3', bankName: 'SBI', accountName: 'Basic Savings Bank Deposit', accountType: 'Zero Balance', interestRate: 2.7, minBalance: 0, debitCardFees: 0, benefits: ['No minimum balance'] },
  { _id: 'mock_a4', bankName: 'Kotak Mahindra', accountName: '811 Edge Savings', accountType: 'Digital', interestRate: 3.5, minBalance: 10000, debitCardFees: 250, benefits: ['Virtual Debit Card', 'Zero cross markup on select transactions'] },
  { _id: 'mock_a5', bankName: 'Axis Bank', accountName: 'ASAP Digital Savings', accountType: 'Digital', interestRate: 3.0, minBalance: 0, debitCardFees: 300, benefits: ['Instant account opening', '1% cashback on online spends'] }
];

let mockCards = [
  { _id: 'mock_c1', cardName: 'HDFC Regalia Gold', bankName: 'HDFC', category: ['Travel', 'Shopping'], network: 'Visa', rewardType: 'Points', fees: { joiningFee: 2500, annualFee: 2500 }, totalSavings: [{ category: 'Travel', value: 5, unit: '%' }, { category: 'Shopping', value: 3, unit: '%' }] },
  { _id: 'mock_c2', cardName: 'SBI SimplyCLICK', bankName: 'SBI', category: ['Shopping', 'Online'], network: 'Visa', rewardType: 'Cashback', fees: { joiningFee: 499, annualFee: 499 }, totalSavings: [{ category: 'Shopping', value: 1.25, unit: '%' }, { category: 'Online', value: 5, unit: '%' }] },
  { _id: 'mock_c3', cardName: 'Amazon Pay ICICI', bankName: 'ICICI', category: ['Shopping', 'Food'], network: 'Visa', rewardType: 'Cashback', fees: { joiningFee: 0, annualFee: 0 }, totalSavings: [{ category: 'Shopping', value: 5, unit: '%' }, { category: 'Food', value: 2, unit: '%' }] },
  { _id: 'mock_c4', cardName: 'Axis Ace', bankName: 'Axis Bank', category: ['Utility', 'Offline Expenses'], network: 'Visa', rewardType: 'Cashback', fees: { joiningFee: 499, annualFee: 499 }, totalSavings: [{ category: 'Offline Expenses', value: 2, unit: '%' }, { category: 'Utility', value: 5, unit: '%' }] },
  { _id: 'mock_c5', cardName: 'Flipkart Axis Bank', bankName: 'Axis Bank', category: ['Shopping', 'Travel'], network: 'Mastercard', rewardType: 'Cashback', fees: { joiningFee: 500, annualFee: 500 }, totalSavings: [{ category: 'Shopping', value: 5, unit: '%' }, { category: 'Travel', value: 4, unit: '%' }] },
  { _id: 'mock_c6', cardName: 'HDFC Millennia', bankName: 'HDFC', category: ['Shopping', 'Food'], network: 'Visa', rewardType: 'Cashback', fees: { joiningFee: 1000, annualFee: 1000 }, totalSavings: [{ category: 'Shopping', value: 5, unit: '%' }, { category: 'Food', value: 5, unit: '%' }] },
  { _id: 'mock_c7', cardName: 'Amex SmartEarn', bankName: 'American Express', category: ['Shopping', 'Premium'], network: 'Amex', rewardType: 'Points', fees: { joiningFee: 495, annualFee: 495 }, totalSavings: [{ category: 'Shopping', value: 10, unit: 'Points' }] }
];

let mockFDs = [
  { _id: 'mock_f1', bankName: 'State Bank of India', tenureRange: '1 Year to < 2 Years', interestRate: 6.8, seniorCitizenRate: 7.3, minAmount: 1000 },
  { _id: 'mock_f2', bankName: 'HDFC Bank', tenureRange: '2 Years to < 3 Years', interestRate: 7.0, seniorCitizenRate: 7.5, minAmount: 5000 },
  { _id: 'mock_f3', bankName: 'ICICI Bank', tenureRange: '3 Years to < 5 Years', interestRate: 7.0, seniorCitizenRate: 7.5, minAmount: 10000 },
  { _id: 'mock_f4', bankName: 'Axis Bank', tenureRange: '1 Year to < 1.5 Years', interestRate: 7.1, seniorCitizenRate: 7.85, minAmount: 5000 },
  { _id: 'mock_f5', bankName: 'Kotak Mahindra', tenureRange: '390 Days (12m 25d)', interestRate: 7.15, seniorCitizenRate: 7.65, minAmount: 5000 },
  { _id: 'mock_f6', bankName: 'IDFC First', tenureRange: '1 Year to 500 Days', interestRate: 7.5, seniorCitizenRate: 8.0, minAmount: 10000 }
];

// API Routes
app.get('/api/accounts', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json(mockAccounts);
    }
    const accounts = await Account.find();
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

app.post('/api/accounts', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const newAccount = { _id: `mock_a${Date.now()}`, ...req.body };
      mockAccounts.push(newAccount);
      return res.json(newAccount);
    }
    const newAccount = new Account(req.body);
    await newAccount.save();
    res.json(newAccount);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create account' });
  }
});

app.put('/api/accounts/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      mockAccounts = mockAccounts.map(a => a._id === req.params.id ? { ...a, ...req.body } : a);
      return res.json(mockAccounts.find(a => a._id === req.params.id));
    }
    const updatedAccount = await Account.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedAccount);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update account' });
  }
});

app.delete('/api/accounts/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      mockAccounts = mockAccounts.filter(a => a._id !== req.params.id);
      return res.json({ success: true });
    }
    await Account.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

app.get('/api/cards', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json(mockCards);
    }
    const cards = await Card.find();
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

app.post('/api/cards', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const newCard = { _id: `mock_c${Date.now()}`, ...req.body };
      mockCards.push(newCard);
      return res.json(newCard);
    }
    const newCard = new Card(req.body);
    await newCard.save();
    res.json(newCard);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create card' });
  }
});

app.put('/api/cards/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      mockCards = mockCards.map(c => c._id === req.params.id ? { ...c, ...req.body } : c);
      return res.json(mockCards.find(c => c._id === req.params.id));
    }
    const updatedCard = await Card.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedCard);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update card' });
  }
});

app.delete('/api/cards/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      mockCards = mockCards.filter(c => c._id !== req.params.id);
      return res.json({ success: true });
    }
    await Card.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete card' });
  }
});

app.get('/api/fds', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json(mockFDs);
    }
    const fds = await FD.find();
    res.json(fds);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch FDs' });
  }
});

app.post('/api/fds', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const newFD = { _id: `mock_f${Date.now()}`, ...req.body };
      mockFDs.push(newFD);
      return res.json(newFD);
    }
    const newFD = new FD(req.body);
    await newFD.save();
    res.json(newFD);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create FD' });
  }
});

app.put('/api/fds/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      mockFDs = mockFDs.map(f => f._id === req.params.id ? { ...f, ...req.body } : f);
      return res.json(mockFDs.find(f => f._id === req.params.id));
    }
    const updatedFD = await FD.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedFD);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update FD' });
  }
});

app.delete('/api/fds/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      mockFDs = mockFDs.filter(f => f._id !== req.params.id);
      return res.json({ success: true });
    }
    await FD.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete FD' });
  }
});


async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
