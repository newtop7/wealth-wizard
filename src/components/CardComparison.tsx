import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { 
  CreditCard as CardIcon, 
  ArrowRightLeft, 
  Plus, 
  X, 
  Calculator, 
  IndianRupee, 
  Search, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Check,
  Info,
  Award,
  Zap,
  HelpCircle,
  ArrowUpRight,
  ShoppingBag,
  Plane,
  RefreshCw,
  TrendingUp,
  Heart
} from 'lucide-react';
import { CreditCard } from '../types';
import { cn } from '../lib/utils';
import { getFinancialAdvice } from '../services/gemini';

const CATEGORIES = ['Travel', 'Shopping', 'Fuel', 'Food', 'Offline Expenses', 'Premium', 'Movies'];

const MERCHANTS = [
  { id: 'swiggy', name: 'Swiggy', category: 'Food', logo: '🍔', desc: 'Accelerated dining rewards & Swiggy One' },
  { id: 'zomato', name: 'Zomato', category: 'Food', logo: '☕', desc: 'Zomato Gold / Dining promo multipliers' },
  { id: 'amazon', name: 'Amazon', category: 'Shopping', logo: '📦', desc: 'E-commerce platform spends & APay vouchers' },
  { id: 'flipkart', name: 'Flipkart', category: 'Shopping', logo: '🛒', desc: 'Flipkart SuperCoins & co-branded benefits' },
  { id: 'myntra', name: 'Myntra', category: 'Shopping', logo: '👠', desc: 'Fashion upgrades & store voucher discounts' },
  { id: 'bookmyshow', name: 'BookMyShow', category: 'Movies', logo: '🎥', desc: 'Buy 1 Get 1 free movie ticket promos' },
  { id: 'uber', name: 'Uber / Ola', category: 'Travel', logo: '🚗', desc: 'Ride hailing & travel multiplier points' },
  { id: 'flights', name: 'Flights / Hotels', category: 'Travel', logo: '🛫', desc: 'Direct booking vs SmartBuy portals' },
  { id: 'utility', name: 'Utilities & Bills', category: 'Utility', logo: '⚡', desc: 'Insurance, gas, & electricity recharges' },
  { id: 'offline', name: 'General Offline Spends', category: 'Offline Expenses', logo: '🛍️', desc: 'Supermarkets, stores, and dining out' },
];

// Predefined elite reward schemas for premium/common Indian Credit Cards
const PREDEFINED_CARD_RULES: Record<string, {
  name: string;
  pointsValue: number; // Value of 1 reward point in INR (e.g. 1 RP = ₹1)
  pointsName: string;
  merchants: Record<string, { rate: number; isPoints: boolean; tip: string }>;
}> = {
  'regalia': {
    name: 'HDFC Regalia Gold',
    pointsValue: 0.5,
    pointsName: 'Reward Points',
    merchants: {
      swiggy: { rate: 2.5, isPoints: true, tip: "Get Swiggy gift cards via HDFC SmartBuy portal for 5x points (approx 2.5% return)." },
      zomato: { rate: 2.5, isPoints: true, tip: "Buy Zomato gift cards via HDFC SmartBuy portal for 5x points (2.5% return)." },
      amazon: { rate: 2.5, isPoints: true, tip: "Purchase Amazon shopping vouchers via HDFC SmartBuy to net 5x points (2.5% value)." },
      flipkart: { rate: 2.5, isPoints: true, tip: "Purchase brand e-vouchers on GYFTR SmartBuy for 5x points (2.5% return)." },
      myntra: { rate: 5.0, isPoints: true, tip: "Earn 5% milestone value or buy Myntra vouchers via HDFC SmartBuy to get 10x points." },
      bookmyshow: { rate: 2.5, isPoints: true, tip: "Buy BookMyShow vouchers on SmartBuy to secure 5x reward points." },
      uber: { rate: 2.5, isPoints: true, tip: "Buy Uber vouchers via GYFTR SmartBuy for accelerated 5x reward points." },
      flights: { rate: 5.0, isPoints: true, tip: "Book directly on HDFC SmartBuy flights portal to score 10x points (5% travel return)." },
      utility: { rate: 1.33, isPoints: true, tip: "Earn standard base reward points (1.33% yield) on utilities up to monthly milestone caps." },
      offline: { rate: 1.33, isPoints: true, tip: "Earn 4 reward points per ₹150 spent (1.33% yield, where 1 RP = ₹0.50)." }
    }
  },
  'simplyclick': {
    name: 'SBI SimplyCLICK',
    pointsValue: 0.25,
    pointsName: 'Reward Points',
    merchants: {
      swiggy: { rate: 1.25, isPoints: true, tip: "Earn 5x Reward Points (1.25% value back) on preferred dining apps." },
      zomato: { rate: 1.25, isPoints: true, tip: "Online dining gets 5x points (1.25% value return)." },
      amazon: { rate: 2.5, isPoints: true, tip: "SBI SimplyCLICK partner benefit! Earn 10x Reward Points (2.5% return) on Amazon spends." },
      flipkart: { rate: 1.25, isPoints: true, tip: "Earn 5x Reward Points (1.25% cashback equivalent)." },
      myntra: { rate: 1.25, isPoints: true, tip: "Enjoy 5x Reward Points (1.25% yield) on fashion shopping." },
      bookmyshow: { rate: 2.5, isPoints: true, tip: "SBI partner benefit! Earn 10x Reward Points (2.5% return) on Movie bookings." },
      uber: { rate: 1.25, isPoints: true, tip: "Cab rides grant 5x points (1.25% value back)." },
      flights: { rate: 1.25, isPoints: true, tip: "Travel booking yields 5x points online reward multiplier." },
      utility: { rate: 0.25, isPoints: true, tip: "Bills and utility payments earn 1x base point (0.25% return)." },
      offline: { rate: 0.25, isPoints: true, tip: "Offline stores yield base 1x points (0.25% reward back)." }
    }
  },
  'amazon': {
    name: 'Amazon Pay ICICI',
    pointsValue: 1.0,
    pointsName: 'Reward Points',
    merchants: {
      swiggy: { rate: 2.0, isPoints: false, tip: "Dining and food count under preferred merchant categories yielding flat 2% cashback." },
      zomato: { rate: 2.0, isPoints: false, tip: "Earn 2% cashback directly on billing transactions." },
      amazon: { rate: 5.0, isPoints: false, tip: "Unmatched 5% flat unlimited cashback for Prime members, directly into Amazon Pay wallet." },
      flipkart: { rate: 1.0, isPoints: false, tip: "Competitor portal. Earn standard 1% cashback." },
      myntra: { rate: 1.0, isPoints: false, tip: "Standard online shopping yields unlimited 1% statement cashback." },
      bookmyshow: { rate: 1.0, isPoints: false, tip: "Earn standard base rate of 1% cashback on book tickets." },
      uber: { rate: 2.0, isPoints: false, tip: "Enjoy 2% cash refund on Uber travels." },
      flights: { rate: 2.0, isPoints: false, tip: "Book via Amazon Flights to secure 2% cashback refund." },
      utility: { rate: 2.0, isPoints: false, tip: "Bills and recharge items processed inside Amazon Pay app earn 2% cashback." },
      offline: { rate: 1.0, isPoints: false, tip: "Earn unlimited 1% flat cashback across local stores." }
    }
  },
  'millennia': {
    name: 'HDFC Millennia',
    pointsValue: 1.0,
    pointsName: 'Cash Points',
    merchants: {
      swiggy: { rate: 5.0, isPoints: false, tip: "Millennia 5% partner merchant! Direct statement cashback (capped at ₹1,000/mo)." },
      zomato: { rate: 5.0, isPoints: false, tip: "Earn flat 5% on Zomato spends (up to ₹1000 cashback cap limit)." },
      amazon: { rate: 5.0, isPoints: false, tip: "Accelerated partner! Get 5% cashback on Amazon transactions." },
      flipkart: { rate: 5.0, isPoints: false, tip: "Part of the 5% merchant pool. Capped at ₹1,000 total per calendar cycle." },
      myntra: { rate: 5.0, isPoints: false, tip: "Fashion spends yield 5% direct cashback refund." },
      bookmyshow: { rate: 5.0, isPoints: false, tip: "Movie bookings get 5% cashback inside the preferred loyalty tier." },
      uber: { rate: 5.0, isPoints: false, tip: "Ride sharing on Uber yields 5% direct savings cash rebate." },
      flights: { rate: 1.0, isPoints: false, tip: "Direct travel spends earn standard 1% statement credit." },
      utility: { rate: 1.0, isPoints: false, tip: "Utility bills earn base cashback of 1%." },
      offline: { rate: 1.0, isPoints: false, tip: "All other offline spends yield flat 1% unlimited cashback." }
    }
  },
  'ace': {
    name: 'Axis Bank Ace',
    pointsValue: 1.0,
    pointsName: 'Cashback',
    merchants: {
      swiggy: { rate: 4.0, isPoints: false, tip: "Perfect dining companion! Flat 4% statement cashback on Swiggy delivery orders." },
      zomato: { rate: 4.0, isPoints: false, tip: "Enjoy 4% direct cashback on Zomato food and dining." },
      amazon: { rate: 1.5, isPoints: false, tip: "Earn unlimited 1.5% cashback on general online spends." },
      flipkart: { rate: 1.5, isPoints: false, tip: "Earn standard Ace 1.5% base online cashback." },
      myntra: { rate: 1.5, isPoints: false, tip: "Receive 1.5% statement cash rebate." },
      bookmyshow: { rate: 1.5, isPoints: false, tip: "Standard base rate of 1.5% online cashback." },
      uber: { rate: 4.0, isPoints: false, tip: "Ace partner rate! 4% direct cashback on Uber rides." },
      flights: { rate: 1.5, isPoints: false, tip: "Travel expenses earn flat 1.5% unlimited cashback." },
      utility: { rate: 5.0, isPoints: false, tip: "Superb utility benefit! 5% cashback on Google Pay recharges and bill payments (capped at ₹500/mo)." },
      offline: { rate: 1.5, isPoints: false, tip: "Market leading base rate of 1.5% unlimited cashback on offline spends." }
    }
  },
  'infinia': {
    name: 'HDFC Infinia / Diners Black',
    pointsValue: 1.0,
    pointsName: 'Reward Points',
    merchants: {
      swiggy: { rate: 10.0, isPoints: true, tip: "Buy Swiggy gift vouchers on SmartBuy GYFTR portal to score 3x Reward Points (10% value back)." },
      zomato: { rate: 10.0, isPoints: true, tip: "Buy Zomato gift vouchers via HDFC SmartBuy portal to score 3x Reward Points (10% return)." },
      amazon: { rate: 10.0, isPoints: true, tip: "Purchase Amazon Pay vouchers via SmartBuy GYFTR to receive 3x Reward Points (10% return)." },
      flipkart: { rate: 10.0, isPoints: true, tip: "Buy Flipkart vouchers on GYFTR SmartBuy for accelerated 10% value points." },
      myntra: { rate: 10.0, isPoints: true, tip: "Buy Myntra store vouchers via HDFC SmartBuy to yield 3x points (10% return)." },
      bookmyshow: { rate: 3.3, isPoints: true, tip: "Earn 1x base Reward Points (3.3% return since 1 Reward Point = ₹1.00)." },
      uber: { rate: 10.0, isPoints: true, tip: "Buy Uber vouchers via HDFC SmartBuy GYFTR for 3x Reward Points (10% yield)." },
      flights: { rate: 16.6, isPoints: true, tip: "Aviation gold! Book flights directly via HDFC SmartBuy portal to earn 5x points (16.6% cash benefit)." },
      utility: { rate: 3.3, isPoints: true, tip: "Direct bill payments earn base rewards of 3.3% return." },
      offline: { rate: 3.3, isPoints: true, tip: "Earn flat 1x base Reward Points on offline transactions (3.3% return)." }
    }
  },
  'atlas': {
    name: 'Axis Bank Atlas',
    pointsValue: 2.0, // Conversions are 1 Edge Mile = 2 Miles (and 1 Mile is worth ₹1)
    pointsName: 'EDGE Miles',
    merchants: {
      swiggy: { rate: 4.0, isPoints: true, tip: "Earn 2 EDGE Miles per ₹100. Best transferred to Air Miles / Hotels at 1:2 ratio (yielding ~4% travel value)." },
      zomato: { rate: 4.0, isPoints: true, tip: "Earn 2 EDGE Miles per ₹100 (~4% travel redemption return)." },
      amazon: { rate: 4.0, isPoints: true, tip: "Earn 2 EDGE Miles per ₹100 (~4% return when converted)." },
      flipkart: { rate: 4.0, isPoints: true, tip: "Earn 2 EDGE Miles per ₹100 (~4% travel return)." },
      myntra: { rate: 4.0, isPoints: true, tip: "Earn 2 EDGE Miles per ₹100 (~4% travel return)." },
      bookmyshow: { rate: 4.0, isPoints: true, tip: "Earn 2 EDGE Miles per ₹100 (~4% travel return)." },
      uber: { rate: 4.0, isPoints: true, tip: "Earn 2 EDGE Miles per ₹100 (4% value on miles conversion)." },
      flights: { rate: 10.0, isPoints: true, tip: "Axis Atlas super multiplier! Book directly with airlines / hotels to receive 5x EDGE Miles (10% travel value)." },
      utility: { rate: 4.0, isPoints: true, tip: "Earn standard base reward of 2 EDGE Miles per ₹100 (4% travel value)." },
      offline: { rate: 4.0, isPoints: true, tip: "Great base rate of 2 EDGE Miles per ₹100 (~4% redemption value on partners)." }
    }
  },
  'flipkart': {
    name: 'Flipkart Axis Bank',
    pointsValue: 1.0,
    pointsName: 'Cashback',
    merchants: {
      swiggy: { rate: 4.0, isPoints: false, tip: "Preferred partner! Direct 4% statement cashback on Swiggy delivery." },
      zomato: { rate: 4.0, isPoints: false, tip: "Enjoy 4% cashback on Zomato food delivery." },
      amazon: { rate: 1.5, isPoints: false, tip: "Competitor store. Earn base online spend rate of 1.5% cashback." },
      flipkart: { rate: 5.0, isPoints: false, tip: "Store co-brand card! Direct unlimited 5% statement cashback." },
      myntra: { rate: 5.0, isPoints: false, tip: "Preferred store! Get unlimited 5% direct statement cashback." },
      bookmyshow: { rate: 1.5, isPoints: false, tip: "Standard 1.5% statement cashback on offline and external platforms." },
      uber: { rate: 4.0, isPoints: false, tip: "Superb transit rebate! Flat 4% statement cashback on Uber rides." },
      flights: { rate: 1.5, isPoints: false, tip: "Standard 1.5% cashback rebate on flight bookings." },
      utility: { rate: 1.5, isPoints: false, tip: "Bills and utility recharges gain standard 1.5% cashback." },
      offline: { rate: 1.5, isPoints: false, tip: "Collect unlimited 1.5% statement cashback on all generic spends." }
    }
  }
};

export default function CardComparison() {
  const [activeTab, setActiveTab] = useState<'budget_compare' | 'spend_suggester'>('budget_compare');
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);

  // BUDGET TAB STATES
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<Record<string, number>>(
    CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {})
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isExpensesOpen, setIsExpensesOpen] = useState(false);

  // SPEND SUGGESTER STATES
  const [ownedCardIds, setOwnedCardIds] = useState<string[]>([]);
  const [spendAmount, setSpendAmount] = useState<number>(10000);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('swiggy');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  // New Wallet optimization states to support scaling to 100+ cards
  const [walletFilterSearch, setWalletFilterSearch] = useState('');
  const [walletShowOnlySelected, setWalletShowOnlySelected] = useState(false);
  const [walletBankFilter, setWalletBankFilter] = useState('All');
  const [walletNetworkFilter, setWalletNetworkFilter] = useState('All');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetch('/api/cards')
      .then(res => res.json())
      .then(data => {
        setCreditCards(data);
        if (data.length > 0) {
          // Prefill owned cards with all of them by default (so users can immediately compare)
          const allIds = data.map((c: any) => c._id || c.id);
          setOwnedCardIds(allIds);
          
          // Pre-select first two cards for Side-by-side comparison budget calculator
          if (data.length >= 2) {
            setSelectedCardIds([allIds[0], allIds[1]]);
          } else {
            setSelectedCardIds([allIds[0]]);
          }
        }
      })
      .catch(err => console.error("Failed to fetch cards:", err))
      .finally(() => setLoading(false));
  }, []);

  // Filter cards list dynamically to handle 100+ cards seamlessly
  const filteredWalletCards = useMemo(() => {
    return creditCards.filter(card => {
      const id = (card as any)._id || card.id;

      // 1. Filter: show only selected
      if (walletShowOnlySelected && !ownedCardIds.includes(id)) {
        return false;
      }

      // 2. Filter: Bank match
      if (walletBankFilter !== 'All') {
        if (walletBankFilter === 'Others') {
          const mainBanks = ['hdfc', 'sbi', 'axis', 'icici', 'idfc', 'amex'];
          const bankLower = card.bankName?.toLowerCase() || '';
          if (mainBanks.some(mb => bankLower.includes(mb))) {
            return false;
          }
        } else {
          const bankLower = card.bankName?.toLowerCase() || '';
          if (!bankLower.includes(walletBankFilter.toLowerCase())) {
            return false;
          }
        }
      }

      // 2.5 Filter: Network match
      if (walletNetworkFilter !== 'All') {
        const netLower = walletNetworkFilter.toLowerCase();
        let matchesNetwork = false;
        if (Array.isArray(card.network)) {
          matchesNetwork = card.network.some((n: string) => n.toLowerCase().includes(netLower));
        } else if (typeof card.network === 'string') {
          matchesNetwork = card.network.toLowerCase().includes(netLower);
        }
        if (!matchesNetwork) {
          return false;
        }
      }

      // 3. Filter: Search string match
      if (walletFilterSearch.trim() !== '') {
        const lowerSearch = walletFilterSearch.toLowerCase();
        const matchesName = card.cardName?.toLowerCase().includes(lowerSearch);
        const matchesBank = card.bankName?.toLowerCase().includes(lowerSearch);
        const matchesReward = card.rewardType?.toLowerCase().includes(lowerSearch);
        if (!matchesName && !matchesBank && !matchesReward) {
          return false;
        }
      }

      return true;
    });
  }, [creditCards, ownedCardIds, walletShowOnlySelected, walletBankFilter, walletNetworkFilter, walletFilterSearch]);

  // Budget comparator calculators
  const handleExpenseChange = (category: string, value: number) => {
    setExpenses(prev => ({ ...prev, [category]: value }));
  };

  const toggleCardSelection = (id: string) => {
    if (selectedCardIds.includes(id)) {
      if (selectedCardIds.length > 1) {
        setSelectedCardIds(prev => prev.filter(cardId => cardId !== id));
      }
    } else {
      if (selectedCardIds.length < 6) {
        setSelectedCardIds(prev => [...prev, id]);
      }
    }
  };

  const selectedCards = useMemo(() => {
    return selectedCardIds
      .map(id => creditCards.find(c => (c as any)._id === id || c.id === id))
      .filter(Boolean) as CreditCard[];
  }, [selectedCardIds, creditCards]);

  const randomCards = useMemo(() => {
    if (creditCards.length === 0) return [];
    return [...creditCards].sort((a, b) => ((a as any)._id || a.id).localeCompare((b as any)._id || b.id)).slice(0, 10);
  }, [creditCards]);

  const displayedCards = useMemo(() => {
    let result: CreditCard[] = [];
    if (debouncedSearchTerm.trim() === '') {
      result = randomCards;
    } else {
      const lowerSearch = debouncedSearchTerm.toLowerCase();
      result = creditCards.filter(c => 
        c.cardName.toLowerCase().includes(lowerSearch) || 
        c.bankName.toLowerCase().includes(lowerSearch)
      ).slice(0, 10);
    }
    
    const selectedSet = new Set(result.map(c => (c as any)._id || c.id));
    const missingSelected = creditCards.filter(c => 
      selectedCardIds.includes((c as any)._id || c.id) && !selectedSet.has((c as any)._id || c.id)
    );
    
    return [...missingSelected, ...result];
  }, [debouncedSearchTerm, randomCards, creditCards, selectedCardIds]);

  const calculateBudgetSavings = (card: CreditCard) => {
    let total = 0;
    const breakdown: Record<string, number> = {};

    CATEGORIES.forEach(category => {
      const expense = expenses[category] || 0;
      if (expense === 0) return;

      const savingRule = card.totalSavings?.find(s => s.category.toLowerCase() === category.toLowerCase());
      if (savingRule) {
        let saving = 0;
        if (savingRule.unit === '%') {
          saving = expense * (savingRule.value / 100);
        } else if (savingRule.unit === 'Flat') {
          saving = savingRule.value;
        } else if (savingRule.unit === 'Points') {
          saving = expense * (savingRule.value / 100);
        }

        if (savingRule.capLimit && saving > savingRule.capLimit) {
          saving = savingRule.capLimit;
        }

        total += saving;
        breakdown[category] = saving;
      }
    });

    return { total, breakdown };
  };

  // SPEND SUGGESTER COMPLEX EVALUATION ENGINE
  const selectedMerchant = useMemo(() => {
    return MERCHANTS.find(m => m.id === selectedMerchantId) || MERCHANTS[0];
  }, [selectedMerchantId]);

  const spendResults = useMemo(() => {
    if (creditCards.length === 0 || ownedCardIds.length === 0) return [];

    const amount = Number(spendAmount) || 0;

    return ownedCardIds.map(id => {
      const card = creditCards.find(c => (c as any)._id === id || c.id === id);
      if (!card) return null;

      const cardNameLower = card.cardName.toLowerCase();
      const bankNameLower = card.bankName.toLowerCase();

      // Find best matching predefined rule
      let matchedRuleKey = '';
      if (cardNameLower.includes('regalia')) matchedRuleKey = 'regalia';
      else if (cardNameLower.includes('simplyclick') || cardNameLower.includes('simply click')) matchedRuleKey = 'simplyclick';
      else if (cardNameLower.includes('amazon') || cardNameLower.includes('apay')) matchedRuleKey = 'amazon';
      else if (cardNameLower.includes('millennia') || cardNameLower.includes('millenia')) matchedRuleKey = 'millennia';
      else if (cardNameLower.includes('ace')) matchedRuleKey = 'ace';
      else if (cardNameLower.includes('infinia') || cardNameLower.includes('diners black')) matchedRuleKey = 'infinia';
      else if (cardNameLower.includes('atlas')) matchedRuleKey = 'atlas';
      else if (cardNameLower.includes('flipkart')) matchedRuleKey = 'flipkart';

      let rate = 1.0;
      let isPoints = card.rewardType === 'Points' || card.rewardType === 'Miles';
      let pointsValue = 0.25;
      let pointsName = card.rewardType || 'Points';
      let tip = '';

      if (matchedRuleKey && PREDEFINED_CARD_RULES[matchedRuleKey]) {
        const rule = PREDEFINED_CARD_RULES[matchedRuleKey];
        pointsValue = rule.pointsValue;
        pointsName = rule.pointsName;
        const merchantRule = rule.merchants[selectedMerchantId] || rule.merchants['offline'];
        rate = merchantRule.rate;
        isPoints = merchantRule.isPoints;
        tip = merchantRule.tip;
      } else {
        // Fallback: lookup from card's dynamic mongoose totalSavings attributes
        const merchantCategory = selectedMerchant.category;
        const savingRule = card.totalSavings?.find(s => 
          s.category.toLowerCase() === merchantCategory.toLowerCase() ||
          (merchantCategory === 'Food' && s.category.toLowerCase().includes('dining')) ||
          (merchantCategory === 'Shopping' && s.category.toLowerCase().includes('online'))
        );

        if (savingRule) {
          rate = savingRule.value;
          isPoints = savingRule.unit === 'Points' || card.rewardType === 'Points';
          if (savingRule.unit === 'Points') pointsValue = 0.25;
          tip = `Calculated via standard ${savingRule.category} category rate of ${savingRule.value}${savingRule.unit}.`;
        } else {
          // Generic fail-safes
          if (card.rewardType === 'Cashback') {
            rate = 1.5;
            isPoints = false;
            tip = "Applied Ace-level fallback cashback of 1.5% for this card spend category.";
          } else {
            rate = 1.0;
            isPoints = true;
            pointsValue = 0.25;
            tip = "Applied general online base reward rate of 1% because no specific multipliers are configured.";
          }
        }
      }

      const rewardInINR = (amount * rate) / 100;
      const pointsEarned = isPoints ? Math.round(rewardInINR / pointsValue) : 0;

      return {
        card,
        rate,
        rewardInINR,
        isPoints,
        pointsValue,
        pointsName,
        pointsEarned,
        tip
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.rewardInINR || 0) - (a?.rewardInINR || 0)) as {
      card: CreditCard;
      rate: number;
      rewardInINR: number;
      isPoints: boolean;
      pointsValue: number;
      pointsName: string;
      pointsEarned: number;
      tip: string;
    }[];
  }, [creditCards, ownedCardIds, spendAmount, selectedMerchantId, selectedMerchant]);

  // Highlight metrics computed
  const suggesterMetrics = useMemo(() => {
    if (spendResults.length === 0) return null;
    const best = spendResults[0];
    const avgValue = spendResults.reduce((sum, r) => sum + r.rewardInINR, 0) / spendResults.length;
    const worst = spendResults[spendResults.length - 1];
    
    const cashbackMarginGain = Math.round(best.rewardInINR - (spendResults[1]?.rewardInINR || worst.rewardInINR));
    const pointsSaved = best.pointsEarned;

    return {
      best,
      worst,
      avgValue,
      cashbackMarginGain,
      pointsSaved
    };
  }, [spendResults]);

  // AI assistant lookup advisor
  const handleAskWizardAI = async () => {
    if (spendResults.length === 0) return;
    setAiLoading(true);
    setAiResult(null);

    const cardsOwnedNames = spendResults.map(r => `- ${r.card.bankName} ${r.card.cardName} (${r.card.rewardType})`).join('\n');
    const bestChoice = `${spendResults[0].card.bankName} ${spendResults[0].card.cardName}`;
    const amountStr = `₹${spendAmount.toLocaleString('en-IN')}`;

    const prompt = `I need an expert credit card spend strategy advice for a ${amountStr} purchase on "${selectedMerchant.name}" (Category: ${selectedMerchant.category}).
    
    My wallet has the following cards:
    ${cardsOwnedNames}
    
    My calculated best card according to the reward rates is: "${bestChoice}".
    
    Give me an elite, highly professional, short spending consultation (around 2-3 paragraphs or scannable bullet points maximum).
    Highlight:
    1. If they should buy a brand gift voucher from portals like HDFC SmartBuy / GyFTR to get a massive points multiplier instead of raw swiping.
    2. The exact cashback margin or companion savings benefit.
    3. Any reward milestone caps or warning criteria (Capping limits).
    Keep it in character as the Wealth Wizard, extremely clear, using elegant markdown formatting. No redundant text.`;

    try {
      const response = await getFinancialAdvice(prompt);
      setAiResult(response);
    } catch (err) {
      console.error(err);
      setAiResult("The crystal ball failed to load. However, standard calculation verifies you should use " + bestChoice + " as it yields the highest return.");
    } finally {
      setAiLoading(false);
    }
  };

  const toggleOwnedCard = (id: string) => {
    if (ownedCardIds.includes(id)) {
      if (ownedCardIds.length > 1) {
        setOwnedCardIds(prev => prev.filter(cardId => cardId !== id));
      }
    } else {
      setOwnedCardIds(prev => [...prev, id]);
    }
  };

  const selectAllOwned = () => {
    setOwnedCardIds(creditCards.map((c: any) => c._id || c.id));
  };

  const clearAllOwned = () => {
    if (creditCards.length > 0) {
      const firstId = (creditCards[0] as any)._id || creditCards[0].id;
      setOwnedCardIds([firstId]);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium font-sans">Summoning available card information...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* Visual Title Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 flex items-center gap-3">
            <ArrowRightLeft className="text-indigo-600" size={32} />
            Card comparison & Spend Suggester
          </h1>
          <p className="text-slate-500 text-sm">Compare side-by-side budgets, or find out exactly which card in your wallet to swipe for instant upcoming expenses.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs py-1.5 px-3 rounded-full shrink-0">
          <Sparkles className="animate-pulse" size={14} />
          <span>Reward Engine Active</span>
        </div>
      </div>

      {/* Main Mode Toggle Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-full max-w-md">
        <button
          onClick={() => setActiveTab('spend_suggester')}
          className={cn(
            "flex-1 py-3 text-center rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
            activeTab === 'spend_suggester' 
              ? "bg-white text-indigo-900 shadow-sm border border-slate-200" 
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <Zap size={16} className={cn(activeTab === 'spend_suggester' ? "text-indigo-600 animate-pulse" : "")} />
          🍔 Spend Suggester
        </button>
        <button
          onClick={() => setActiveTab('budget_compare')}
          className={cn(
            "flex-1 py-3 text-center rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
            activeTab === 'budget_compare' 
              ? "bg-white text-indigo-905 shadow-sm border border-slate-200" 
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <Calculator size={16} />
          📊 Budget Calculator
        </button>
      </div>

      <AnimatePresence mode="wait">
        
        {/* SPEND SUGGESTER VIEW MODE */}
        {activeTab === 'spend_suggester' ? (
          <motion.div
            key="spend-suggester-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Form & Selection Wallet (8 cols) */}
              <div className="lg:col-span-8 space-y-6">

                {/* 1. Select Cards in Your Wallet */}
                <div className="bg-white border border-slate-200.5 rounded-3xl p-6 space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-md font-sans">
                        <CardIcon size={18} className="text-indigo-600" />
                        1. Select Cards in Your Wallet
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium font-sans">Toggle cards that you actually own to compare reward optimization rates.</p>
                    </div>
                    <div className="flex gap-2 self-start sm:self-auto shrink-0">
                      <button 
                        onClick={selectAllOwned}
                        className="text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
                      >
                        Select All ({creditCards.length})
                      </button>
                      <button 
                        onClick={clearAllOwned}
                        className="text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Scalable controls for 100+ cards */}
                  <div className="space-y-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                    <div className="flex flex-col sm:flex-row gap-2">
                      {/* Search bar */}
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                          type="text"
                          placeholder="Search card name / bank..."
                          value={walletFilterSearch}
                          onChange={(e) => setWalletFilterSearch(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-sans"
                        />
                        {walletFilterSearch && (
                          <button 
                            onClick={() => setWalletFilterSearch('')} 
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>

                      {/* Toggle state showing only wallet vs showing all */}
                      <button
                        onClick={() => setWalletShowOnlySelected(!walletShowOnlySelected)}
                        className={cn(
                          "px-3 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 flex items-center justify-center gap-1.5",
                          walletShowOnlySelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                        )}
                      >
                        <CardIcon size={12} />
                        Showing Owned Only ({ownedCardIds.length})
                      </button>
                    </div>

                    {/* Quick Bank Tabs */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100/60">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">Banks:</span>
                      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                        {['All', 'HDFC', 'SBI', 'Axis', 'ICICI', 'Amex', 'Others'].map(bank => (
                          <button
                            key={bank}
                            onClick={() => setWalletBankFilter(bank)}
                            className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap border",
                              walletBankFilter === bank
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-xs"
                                : "bg-white hover:bg-slate-50 text-slate-500 border-slate-200"
                            )}
                          >
                            {bank}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Network Tabs */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100/60">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">Network:</span>
                      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                        {['All', 'Visa', 'Mastercard', 'RuPay', 'Amex'].map(network => (
                          <button
                            key={network}
                            onClick={() => setWalletNetworkFilter(network)}
                            className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap border",
                              walletNetworkFilter === network
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-xs"
                                : "bg-white hover:bg-slate-50 text-slate-500 border-slate-200"
                            )}
                          >
                            {network}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* List Container with fixed height max-h-[340px] and premium grid styling */}
                  <div className="max-h-[340px] overflow-y-auto pr-1 gap-3 grid grid-cols-2 sm:grid-cols-3 border-t border-slate-100 pt-3 custom-scrollbar">
                    {filteredWalletCards.length > 0 ? (
                      filteredWalletCards.map(card => {
                        const id = (card as any)._id || card.id;
                        const isOwned = ownedCardIds.includes(id);
                        return (
                          <div
                            key={id}
                            onClick={() => toggleOwnedCard(id)}
                            className={cn(
                              "p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between hover:bg-slate-50 relative",
                              isOwned 
                                ? "border-indigo-600 bg-indigo-50/10 shadow-sm" 
                                : "border-slate-200 bg-white opacity-60 hover:opacity-100"
                            )}
                          >
                            {isOwned && (
                              <div className="absolute top-2 right-2 w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[9px]">
                                <Check size={10} strokeWidth={3} />
                              </div>
                            )}
                            <div className="space-y-1 pr-6">
                              <div className="flex items-center justify-between gap-1 overflow-hidden">
                                <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider truncate">
                                  {card.bankName}
                                </span>
                                {card.network && (
                                  <div className="flex gap-1 flex-wrap justify-end">
                                    {(Array.isArray(card.network) ? card.network : [card.network]).map((net: string, idx: number) => (
                                      <span key={idx} className="text-[8px] bg-slate-100 text-slate-600 font-extrabold px-1 rounded uppercase tracking-wider shrink-0">
                                        {net}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <h4 className="font-extrabold text-slate-800 text-xs truncate max-w-[90%] font-sans">
                                {card.cardName}
                              </h4>
                            </div>
                            
                            <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400 font-bold border-t border-slate-100 pt-1">
                              <span className="bg-slate-100 px-1 rounded truncate">
                                {card.rewardType || 'Cashback'}
                              </span>
                              <span>
                                {card.fees?.annualFee === 0 ? 'LTF' : `₹${card.fees?.annualFee || '0'}`}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-full py-12 text-center space-y-2">
                        <HelpCircle className="mx-auto text-slate-400 shrink-0" size={32} />
                        <h4 className="font-bold text-slate-700 text-xs">No matching cards found</h4>
                        <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                          Try searching something else, changing the bank filters, or toggling off the "Showing Owned Only" option.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Dynamic counts indicator */}
                  <div className="text-[11px] text-slate-400 font-medium flex justify-between items-center border-t border-slate-100 pt-2 font-mono">
                    <span>
                      Showing <strong>{filteredWalletCards.length}</strong> of <strong>{creditCards.length}</strong> cards
                    </span>
                    <span>
                      Selected: <strong>{ownedCardIds.length} cards</strong>
                    </span>
                  </div>
                </div>

                {/* 2. Transaction Parameters */}
                <div className="bg-white border border-slate-205 rounded-3xl p-6 space-y-6 shadow-sm">
                  <div>
                    <h3 className="font-extrabold text-slate-905 flex items-center gap-2 text-md">
                      <Calculator size={18} className="text-indigo-600" />
                      2. Spend Parameters
                    </h3>
                    <p className="text-[11px] text-slate-400">Specify transaction details to inspect standard and accelerated rewards.</p>
                  </div>

                  {/* Purchase Input and presetter caps */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    
                    {/* Enter price */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase block">Purchase Amount (INR)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">₹</span>
                        <input
                          type="number"
                          min={1}
                          max={10000000}
                          value={spendAmount}
                          onChange={(e) => setSpendAmount(e.target.value === '' ? '' as any : Number(e.target.value))}
                          className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-black text-slate-800 text-md transition-all"
                        />
                      </div>
                    </div>

                    {/* Pre-select keys */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase block">Quick Presets</label>
                      <div className="flex flex-wrap gap-1.5">
                        {[1000, 5000, 10000, 25000, 50000].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setSpendAmount(val)}
                            className={cn(
                              "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border",
                              spendAmount === val 
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                            )}
                          >
                            ₹{val.toLocaleString('en-IN')}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Merchant Category grids */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase block">Select Merchant Platform</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {MERCHANTS.map(m => {
                        const isSelected = selectedMerchantId === m.id;
                        return (
                          <div
                            key={m.id}
                            onClick={() => setSelectedMerchantId(m.id)}
                            className={cn(
                              "p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col justify-between hover:bg-slate-50 relative",
                              isSelected 
                                ? "border-indigo-500 bg-indigo-50/20 ring-2 ring-indigo-500/10 shadow-sm"
                                : "border-slate-200 bg-white shadow-xs"
                            )}
                          >
                            <span className="text-2xl block mb-1">{m.logo}</span>
                            <h4 className="font-extrabold text-slate-900 text-xs leading-tight">{m.name}</h4>
                            <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                              {m.category}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </div>

              {/* Right Column: Calculations, recommendation, and margins (4 cols) */}
              <div className="lg:col-span-4 space-y-6">

                {/* Best Card Highlight Box */}
                {suggesterMetrics && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden shadow-xl"
                  >
                    {/* Glowing circular element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl -mr-16 -mt-16"></div>
                    
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-1.5 bg-yellow-400 text-slate-950 font-black px-3 py-1 rounded-full uppercase tracking-widest text-[9px]">
                        <Award size={12} />
                        Recommended Swish
                      </div>

                      <div>
                        <span className="text-[10px] text-indigo-300 font-bold uppercase block tracking-widest">
                          {suggesterMetrics.best.card.bankName}
                        </span>
                        <h4 className="text-xl font-black tracking-tight leading-snug">
                          {suggesterMetrics.best.card.cardName}
                        </h4>
                      </div>

                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                        <span className="text-indigo-200 text-[10px] font-bold uppercase">Estimated Transaction Return</span>
                        <div className="text-3xl font-extrabold text-emerald-400 flex items-baseline gap-1 mt-1">
                          <span className="text-xl">₹</span>
                          {Math.round(suggesterMetrics.best.rewardInINR).toLocaleString('en-IN')}
                          <span className="text-xs text-white/70 font-bold ml-1">
                            ({suggesterMetrics.best.rate.toFixed(1)}% yield)
                          </span>
                        </div>
                        {suggesterMetrics.best.pointsEarned > 0 && (
                          <div className="text-[10px] text-indigo-200 mt-2 font-bold flex items-center gap-1 bg-white/5 py-1 px-2 rounded">
                            <Check size={10} className="text-emerald-400" />
                            Accrues {suggesterMetrics.best.pointsEarned.toLocaleString()} {suggesterMetrics.best.pointsName}!
                          </div>
                        )}
                      </div>

                      {/* Display margins and points saved */}
                      <div className="border-t border-white/10 pt-3 space-y-2.5 text-xs text-slate-300">
                        
                        {/* Margin metrics */}
                        {suggesterMetrics.cashbackMarginGain > 0 ? (
                          <div className="flex justify-between items-center">
                            <span>Cashback Margin Gain:</span>
                            <span className="text-emerald-300 font-extrabold flex items-center gap-1">
                              +₹{suggesterMetrics.cashbackMarginGain} extra
                            </span>
                          </div>
                        ) : null}

                        {/* Difference reference */}
                        <div className="text-[10.5px] text-indigo-200 leading-normal bg-indigo-950/40 p-2.5 rounded border border-indigo-800/20">
                          {suggesterMetrics.cashbackMarginGain > 0 ? (
                            <span>
                              💡 Save <strong>₹{suggesterMetrics.cashbackMarginGain}</strong> cash value by swiping {suggesterMetrics.best.card.cardName} instead of using your next-best card!
                            </span>
                          ) : (
                            <span>
                              💡 Standard swipe recommendation matches all configured card limits perfectly!
                            </span>
                          )}
                        </div>

                        {/* Rule tip text */}
                        <p className="text-[10px] text-slate-400 italic">
                          ℹ️ {suggesterMetrics.best.tip}
                        </p>
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* Gemini Strategy box */}
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase">Interactive Strategy Assistant</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Advanced milestone consulting</p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Need to know the most advanced GyFTR multiplier voucher routes, specific flight booking portals, or monthly bonus tier milestone rewards for this check?
                  </p>

                  <button
                    onClick={handleAskWizardAI}
                    disabled={aiLoading}
                    className="w-full py-2.5 px-4 bg-white hover:bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200 text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Summoning the Wealth Wizard...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Get Optimized Strategy Insights ✨
                      </>
                    )}
                  </button>

                  <AnimatePresence>
                    {aiResult && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-indigo-950 text-indigo-50 p-4 rounded-2xl text-[11px] font-sans leading-relaxed border border-indigo-850 max-h-56 overflow-y-auto space-y-2 shadow-inner"
                      >
                        <strong className="text-yellow-400 block pb-1 font-bold">🧙‍♂️ Wealth Wizard Strategy:</strong>
                        <div className="prose prose-invert prose-sm text-indigo-200 font-medium">
                          <Markdown>{aiResult}</Markdown>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>

            </div>

            {/* Leaderboard Comparison and Margins List */}
            <div className="bg-white border border-slate-200.5 rounded-3xl p-6 space-y-6 shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="text-indigo-600" size={18} />
                  Wallet Card Leaderboard Rank
                </h3>
                <p className="text-xs text-slate-500">Ranked performance efficiency showing exact return value and cashback gap margins for ₹{spendAmount.toLocaleString('en-IN')}.</p>
              </div>

              <div className="space-y-4">
                {spendResults.map((res, index) => {
                  const maxReward = spendResults[0]?.rewardInINR || 1;
                  const pct = maxReward > 0 ? (res.rewardInINR / maxReward) * 100 : 0;
                  const isBest = index === 0;
                  const gapToBest = Math.round(maxReward - res.rewardInINR);

                  return (
                    <div 
                      key={(res.card as any)._id || res.card.id}
                      className={cn(
                        "p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200",
                        isBest ? "border-indigo-400 bg-indigo-50/10 shadow-sm" : "border-slate-100 bg-white"
                      )}
                    >
                      {/* Rank & Card descriptor */}
                      <div className="md:w-60 shrink-0 flex items-center gap-3">
                        <div className={cn(
                          "w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 shadow-sm",
                          isBest ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                        )}>
                          #{index + 1}
                        </div>
                        <div className="truncate">
                          <span className="text-[9px] text-slate-400 block tracking-widest uppercase font-bold">{res.card.bankName}</span>
                          <h4 className="font-extrabold text-xs text-slate-800 truncate">{res.card.cardName}</h4>
                        </div>
                      </div>

                      {/* Power Progress bar */}
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                          <span>Return Efficiency</span>
                          <span>{res.rate.toFixed(1)}% Return</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              isBest 
                                ? "bg-gradient-to-r from-indigo-500 to-indigo-600" 
                                : "bg-slate-400"
                            )}
                          />
                        </div>
                      </div>

                      {/* Reward Gained text */}
                      <div className="md:w-36 shrink-0 text-left md:text-right">
                        <p className="text-sm font-black text-slate-900">
                          ₹{Math.round(res.rewardInINR)} value
                        </p>
                        <p className="text-[10px] text-indigo-600 font-extrabold block">
                          {res.isPoints ? `~${res.pointsEarned} Points` : 'Cashback Credit'}
                        </p>
                      </div>

                      {/* Gap Margin */}
                      <div className="md:w-40 shrink-0 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                        {isBest ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-emerald-200">
                            <Check size={10} /> Max Cashback Margin
                          </span>
                        ) : (
                          <div className="text-left md:text-right">
                            <p className="text-[10px] text-red-500 font-extrabold uppercase">
                              -₹{gapToBest} Value Gap
                            </p>
                            <p className="text-[9px] text-slate-400 font-bold">
                              Loss margin on swipe
                            </p>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

          </motion.div>
        ) : (
          
          /* BUDGET CALCULATOR VIEW MODE */
          <motion.div
            key="budget-compare-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-8"
          >
            {/* Left Sidebar: Expense Inputs */}
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit lg:sticky lg:top-24 z-10">
              <div 
                className="flex items-center justify-between cursor-pointer lg:cursor-default mb-6"
                onClick={() => setIsExpensesOpen(!isExpensesOpen)}
              >
                <div className="flex items-center gap-2 text-lg font-bold text-slate-850">
                  <Calculator size={20} className="text-indigo-600" />
                  Monthly Expenses
                </div>
                <button className="lg:hidden text-slate-400">
                  {isExpensesOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>
              
              <div className={cn("space-y-4", !isExpensesOpen && "hidden lg:block")}>
                {CATEGORIES.map(category => (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between mb-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">{category}</label>
                      <span className="text-sm font-bold text-indigo-600">₹{(expenses[category] || 0).toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100000"
                      step="500"
                      value={expenses[category] || 0}
                      onChange={(e) => handleExpenseChange(category, Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                ))}
              </div>

              <div className={cn("mt-8 pt-6 border-t border-slate-100", !isExpensesOpen && "hidden lg:block")}>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Total Spends</div>
                <div className="text-2xl font-black text-slate-900">
                  ₹{Object.values(expenses).reduce((a: number, b: number) => a + b, 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Right Area: Card Selection & Comparison */}
            <div className="lg:col-span-3 space-y-8">
              
              {/* Card Selector panel */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 text-sm uppercase block">Select Cards to Compare ({selectedCardIds.length}/6)</h3>
                  <span className="text-xs text-slate-500 font-medium">Min 1, Max 6</span>
                </div>
                
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-450" size={18} />
                  <input
                    type="text"
                    placeholder="Search by card or bank name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  {displayedCards.map(card => {
                    const id = (card as any)._id || card.id;
                    const isSelected = selectedCardIds.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleCardSelection(id)}
                        disabled={!isSelected && selectedCardIds.length >= 6}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border",
                          isSelected 
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold" 
                            : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                      >
                        {isSelected ? <X size={14} /> : <Plus size={14} />}
                        {card.cardName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comparison Grid card layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {selectedCards.map(card => {
                  const { total, breakdown } = calculateBudgetSavings(card);
                  const annualFee = card.fees?.annualFee ?? (card as any).annualFee ?? 0;
                  const netYearlySavings = (total * 12) - annualFee;

                  return (
                    <motion.div
                      layout
                      key={(card as any)._id || card.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                    >
                      <div className="p-5 bg-gradient-to-br from-slate-800 to-slate-900 text-white relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <CardIcon size={64} />
                        </div>
                        <div className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1">{card.bankName}</div>
                        <h3 className="text-lg font-bold mb-4 relative z-10 truncate">{card.cardName}</h3>
                        
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                          <div className="text-white/80 text-sm mb-1">Estimated Monthly Savings</div>
                          <div className="text-3xl font-bold text-emerald-400 flex items-center">
                            <IndianRupee size={24} className="mr-1" />
                            {total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </div>
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div className="space-y-3 mb-6">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category Spends Savings</div>
                          {Object.entries(breakdown).map(([cat, amount]) => (
                            <div key={cat} className="flex justify-between items-center text-sm">
                              <span className="text-slate-600">{cat}</span>
                              <span className="font-semibold text-emerald-600">+₹{amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                          ))}
                          {Object.keys(breakdown).length === 0 && (
                            <div className="text-sm text-slate-400 italic">No savings computed based on monthly parameters.</div>
                          )}
                        </div>

                        <div className="pt-4 border-t border-slate-100 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Yearly Savings (12x)</span>
                            <span className="font-semibold text-slate-850">₹{(total * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Annual Card Fee</span>
                            <span className="font-semibold text-red-500">-₹{annualFee.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-base pt-2 border-t border-slate-100">
                            <span className="font-bold text-slate-800">Net Clean Yearly Benefit</span>
                            <span className={cn("font-bold", netYearlySavings >= 0 ? "text-emerald-600" : "text-red-500")}>
                              {netYearlySavings >= 0 ? '+' : ''}₹{netYearlySavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
