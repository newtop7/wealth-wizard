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

// API Routes
app.get('/api/accounts', async (req, res) => {
  try {
    const accounts = await Account.find();
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

app.get('/api/cards', async (req, res) => {
  try {
    const cards = await Card.find();
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

app.get('/api/fds', async (req, res) => {
  try {
    const fds = await FD.find();
    res.json(fds);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch FDs' });
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
