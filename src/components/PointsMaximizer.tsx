import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gift, 
  Plane, 
  ShoppingBag, 
  CreditCard, 
  Zap, 
  IndianRupee, 
  Sparkles, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  ArrowRight, 
  Search, 
  Check, 
  Sliders, 
  Award, 
  HelpCircle, 
  ArrowUpRight,
  RefreshCw,
  Landmark
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getFinancialAdvice } from '../services/gemini';
import { CreditCard as CreditCardType } from '../types';

interface RedemptionOption {
  method: string;
  category: 'Travel' | 'Shopping' | 'Cashback' | 'Other';
  transferRatio: string;
  valuePerPoint: number;
  totalValue: number;
  recommendation: string;
  steps: string[];
}

const PARTNERS = [
  { id: 'all', name: 'Accor Live Limitless (ALL)', type: 'Hotel Reward', logo: '🏨', color: 'bg-amber-500', val: 1.8, desc: 'Stay in luxury brands (Sofitel, Fairmont, Raffles). points are worth €0.02 each.' },
  { id: 'marriott', name: 'Marriott Bonvoy', type: 'Hotel Reward', logo: '🛎️', color: 'bg-slate-900', val: 1.0, desc: 'Redeem at over 8,000 hotels worldwide. Points are worth ~₹0.80 to ₹1.20.' },
  { id: 'itc', name: 'Club ITC Hotels', type: 'Hotel Reward', logo: '👑', color: 'bg-yellow-600', val: 1.2, desc: 'High redemption values at Indian luxury properties. Points are worth ~₹1.20 each.' },
  { id: 'krisflyer', name: 'Singapore Airlines KrisFlyer', type: 'Air Miles', logo: '✈️', color: 'bg-blue-800', val: 1.0, desc: 'Best for premium business class cabins. Value can exceed ₹1.50 per mile.' },
  { id: 'vistara', name: 'Club Vistara / Flying Returns', type: 'Air Miles', logo: '🛫', color: 'bg-indigo-700', val: 0.85, desc: 'Best for domestic premium economy/business class flights in India.' },
  { id: 'united', name: 'United Airlines MileagePlus', type: 'Air Miles', logo: '🌐', color: 'bg-sky-600', val: 0.9, desc: 'Star Alliance partner. Excellent for international long-haul award flights.' }
];

const PREMIUM_CARDS_DATA = [
  {
    id: 'axis-atlas',
    name: 'Axis Bank Atlas',
    pointsName: 'EDGE Miles',
    desc: 'The gold standard travel card with generous 1:2 premium transfer ratio.',
    partners: {
      all: { ratio: '1 EDGE Mile = 2 ALL Points', factor: 2, valuePerPoint: 3.6 },
      marriott: { ratio: '1 EDGE Mile = 2 Bonvoy Points', factor: 2, valuePerPoint: 2.0 },
      itc: { ratio: '1 EDGE Mile = 2 Club ITC Points', factor: 2, valuePerPoint: 2.4 },
      krisflyer: { ratio: '1 EDGE Mile = 2 KrisFlyer Miles', factor: 2, valuePerPoint: 2.0 },
      vistara: { ratio: '1 EDGE Mile = 2 CV Points', factor: 2, valuePerPoint: 1.7 },
      united: { ratio: '1 EDGE Mile = 2 Miles', factor: 2, valuePerPoint: 1.8 }
    },
    cashbackValue: 0.25
  },
  {
    id: 'hdfc-infinia',
    name: 'HDFC Infinia / Diners Black',
    pointsName: 'Reward Points',
    desc: 'Super-premium invite-only card with unmatched 1:1 transfer ratios.',
    partners: {
      all: { ratio: '1 Reward Point = 1 ALL Point', factor: 1, valuePerPoint: 1.8 },
      marriott: { ratio: '1 Reward Point = 1 Bonvoy Point', factor: 1, valuePerPoint: 1.0 },
      itc: { ratio: '1 Reward Point = 1.25 Club ITC Points', factor: 1.25, valuePerPoint: 1.5 },
      krisflyer: { ratio: '1 Reward Point = 1 KrisFlyer Mile', factor: 1, valuePerPoint: 1.0 },
      vistara: { ratio: '1 Reward Point = 1 CV Point', factor: 1, valuePerPoint: 0.85 },
      united: { ratio: '1 Reward Point = 1 Mile', factor: 1, valuePerPoint: 0.9 }
    },
    cashbackValue: 1.0 // SmartBuy flights booking value
  },
  {
    id: 'amex-plat-travel',
    name: 'Amex Platinum Travel',
    pointsName: 'MR Points',
    desc: 'The ultimate milestone reward card with solid Marriott / Accor transfers.',
    partners: {
      all: { ratio: '1 MR Point = 1 ALL Point (via promotion)', factor: 1, valuePerPoint: 1.8 },
      marriott: { ratio: '1 MR Point = 1 Marriott Bonvoy Point', factor: 1, valuePerPoint: 1.0 },
      itc: { ratio: '1 MR Point = 1 Club ITC Point', factor: 1, valuePerPoint: 1.2 },
      krisflyer: { ratio: '2 MR Points = 1 KrisFlyer Mile', factor: 0.5, valuePerPoint: 0.5 },
      vistara: { ratio: '2 MR Points = 1 CV Point', factor: 0.5, valuePerPoint: 0.425 },
      united: { ratio: '2 MR Points = 1 Mile', factor: 0.5, valuePerPoint: 0.45 }
    },
    cashbackValue: 0.25
  },
  {
    id: 'amex-gold',
    name: 'American Express Gold Card',
    pointsName: 'MR Points',
    desc: 'Legendary gold charge card with monthly multiplier target returns.',
    partners: {
      all: { ratio: '1 MR Point = 1 ALL Point', factor: 1, valuePerPoint: 1.8 },
      marriott: { ratio: '1 MR Point = 1 Marriott Bonvoy Point', factor: 1, valuePerPoint: 1.0 },
      itc: { ratio: '1 MR Point = 1 Club ITC Point', factor: 1, valuePerPoint: 1.2 },
      krisflyer: { ratio: '2 MR Points = 1 KrisFlyer Mile', factor: 0.5, valuePerPoint: 0.5 },
      vistara: { ratio: '2 MR Points = 1 CV Point', factor: 0.5, valuePerPoint: 0.425 },
      united: { ratio: '2 MR Points = 1 Mile', factor: 0.5, valuePerPoint: 0.45 }
    },
    cashbackValue: 0.25
  },
  {
    id: 'sbi-aurum',
    name: 'SBI Aurum',
    pointsName: 'Reward Points',
    desc: 'Invite-only super-premium card from State Bank of India.',
    partners: {
      all: { ratio: '1 Reward Point = 0.5 ALL Point', factor: 0.5, valuePerPoint: 0.9 },
      marriott: { ratio: '1 Reward Point = 0.5 Bonvoy Point', factor: 0.5, valuePerPoint: 0.5 },
      itc: { ratio: '1 Reward Point = 0.5 Club ITC Point', factor: 0.5, valuePerPoint: 0.6 },
      krisflyer: { ratio: '4 Reward Points = 1 KrisFlyer Mile', factor: 0.25, valuePerPoint: 0.25 },
      vistara: { ratio: '4 Reward Points = 1 CV Point', factor: 0.25, valuePerPoint: 0.21 },
      united: { ratio: '4 Reward Points = 1 Mile', factor: 0.25, valuePerPoint: 0.225 }
    },
    cashbackValue: 1.0
  }
];

export default function PointsMaximizer() {
  const [cards, setCards] = useState<CreditCardType[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [pointsBalance, setPointsBalance] = useState<number | ''>(25000);
  const [options, setOptions] = useState<RedemptionOption[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [loadingAi, setLoadingAi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Active Tab Toggle State: 'ai_optimizer' or 'partner_matrix'
  const [activeTab, setActiveTab] = useState<'ai_optimizer' | 'partner_matrix'>('ai_optimizer');

  // Interactive Partner Matrix State
  const [selectedMatrixCardId, setSelectedMatrixCardId] = useState<string>('axis-atlas');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('all');
  const [matrixPoints, setMatrixPoints] = useState<number>(25000);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetch('/api/cards')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data)) {
          // Filter to only show cards that have reward points/miles/cashback
          const pointCards = data.filter(c => c.rewardType === 'Points' || c.rewardType === 'Miles' || c.rewardType === 'Cashback');
          setCards(pointCards);
          if (pointCards.length > 0) {
            setSelectedCardId(pointCards[0]._id || pointCards[0].id);
          }
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingCards(false));
  }, []);

  const handleMaximize = async () => {
    if (!selectedCardId || !pointsBalance) return;
    
    const card = cards.find(c => (c as any)._id === selectedCardId || c.id === selectedCardId);
    if (!card) return;

    setLoadingAi(true);
    setError(null);
    setOptions([]);
    setExpandedIndex(0);

    try {
      const prompt = `You are an elite credit card rewards optimization engine for Indian credit cards, designed to be superior to SaveSage. 
      The user has ${pointsBalance} reward points on their "${card.bankName} ${card.cardName}" credit card.
      
      Provide the top 3 to 4 most lucrative redemption options for this specific card. Include transfer partners (like Air Vistara, KrisFlyer, Marriott Bonvoy) if applicable for this card.
      
      CRITICAL INSTRUCTION: Return ONLY a valid JSON array of objects. Do not include any markdown formatting, backticks, or extra text. Just the raw JSON array.
      
      Each object MUST have exactly these keys:
      - "method" (string): The redemption method or partner (e.g., "Transfer to KrisFlyer Miles", "SmartBuy Flights").
      - "category" (string): Must be exactly one of: "Travel", "Shopping", "Cashback", or "Other".
      - "transferRatio" (string): The exact conversion ratio (e.g., "1 Reward Point = 0.5 Miles" or "1 RP = ₹0.25").
      - "valuePerPoint" (number): The estimated value of 1 Reward Point in INR after conversion (e.g., 0.5, 1.0).
      - "totalValue" (number): The total value in INR for ${pointsBalance} points.
      - "recommendation" (string): A short, punchy reason why this is a good choice.
      - "steps" (array of strings): 2 to 3 actionable, step-by-step instructions on exactly how the user can execute this redemption online.
      
      Order the array by highest totalValue first. The last option should usually be standard statement credit/cashback for comparison.`;

      const response = await getFinancialAdvice(prompt);
      
      // Clean the response
      let cleanJson = response.trim();
      if (cleanJson.startsWith('\`\`\`json')) {
        cleanJson = cleanJson.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
      } else if (cleanJson.startsWith('\`\`\’')) {
        cleanJson = cleanJson.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
      } else if (cleanJson.startsWith('\`\`\`')) {
        cleanJson = cleanJson.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
      }

      const parsedOptions = JSON.parse(cleanJson);
      
      if (Array.isArray(parsedOptions) && parsedOptions.length > 0) {
        setOptions(parsedOptions);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Failed to parse AI response:", err);
      setError("The Wizard had trouble calculating the exact values. Please try again.");
    } finally {
      setLoadingAi(false);
    }
  };

  const getIconForCategory = (category: string) => {
    switch (category) {
      case 'Travel': return <Plane size={24} />;
      case 'Shopping': return <ShoppingBag size={24} />;
      case 'Cashback': return <CreditCard size={24} />;
      default: return <Gift size={24} />;
    }
  };

  // Live Conversion matrix computed analytics
  const matrixData = useMemo(() => {
    const activeCard = PREMIUM_CARDS_DATA.find(c => c.id === selectedMatrixCardId) || PREMIUM_CARDS_DATA[0];
    const pointsAmount = Number(matrixPoints) || 0;

    // Standard cash/voucher back-stop reference
    const cashbackValueVal = pointsAmount * activeCard.cashbackValue;

    // Partners list with evaluated results for the specific card
    const list = PARTNERS.map(p => {
      const cardMapping = (activeCard.partners as any)[p.id];
      const factor = cardMapping ? cardMapping.factor : 1;
      const equivalentPoints = Math.round(pointsAmount * factor);
      const valuePerPoint = cardMapping ? cardMapping.valuePerPoint : p.val;
      const travelValue = Math.round(pointsAmount * valuePerPoint);
      const ratioStr = cardMapping ? cardMapping.ratio : `1:1`;

      return {
        ...p,
        equivalentPoints,
        valuePerPoint,
        travelValue,
        ratioStr,
        multiplier: cashbackValueVal > 0 ? (travelValue / cashbackValueVal).toFixed(1) : '1.0'
      };
    });

    const activePartnerObj = list.find(p => p.id === selectedPartnerId) || list[0];

    return {
      activeCard,
      activePartner: activePartnerObj,
      cashbackValue: Math.round(cashbackValueVal),
      partnerList: list
    };
  }, [selectedMatrixCardId, selectedPartnerId, matrixPoints]);

  if (loadingCards) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading your cards...</p>
      </div>
    );
  }

  const baseValue = options.length > 0 ? options[options.length - 1].totalValue : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Title Header with interactive options */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Points Maximizer Pro</h2>
          <p className="text-slate-500">Stop wasting reward miles. Analyze exact transfer ratios instantly to maximize loyalty travel value in India.</p>
        </div>
        
        {/* Top visual key */}
        <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-100 text-rose-600 py-1.5 px-3 rounded-xl text-xs font-semibold shrink-0">
          <Sparkles size={14} className="animate-pulse" />
          <span>Reward Transfer Engine Live</span>
        </div>
      </div>

      {/* Primary Tab Selector */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full max-w-md">
        <button
          onClick={() => setActiveTab('partner_matrix')}
          className={cn(
            "flex-1 py-3 text-center rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
            activeTab === 'partner_matrix' 
              ? "bg-white text-rose-800 shadow-sm" 
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <Plane size={16} />
          🛫 Partner Matrix
        </button>
        <button
          onClick={() => setActiveTab('ai_optimizer')}
          className={cn(
            "flex-1 py-3 text-center rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
            activeTab === 'ai_optimizer' 
              ? "bg-white text-rose-800 shadow-sm" 
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <Sparkles size={16} />
          🎯 Smart Rewards Optimizer
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'partner_matrix' ? (
          <motion.div
            key="partner-matrix-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Interactive Inputs Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Point Input Controls Card */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-slate-950 font-bold">
                    <Sliders className="text-rose-600" size={18} />
                    <h3>Transfer Calculator Parameters</h3>
                  </div>
                  <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full border border-indigo-100">
                    Live Rates Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Select Card */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase block">Select Premium Credit Card</label>
                    <div className="relative">
                      <select 
                        value={selectedMatrixCardId}
                        onChange={(e) => setSelectedMatrixCardId(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none rounded-xl font-bold text-slate-800 transition-all text-sm appearance-none cursor-pointer"
                      >
                        {PREMIUM_CARDS_DATA.map(card => (
                          <option key={card.id} value={card.id}>
                            {card.name} ({card.pointsName})
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {PREMIUM_CARDS_DATA.find(c => c.id === selectedMatrixCardId)?.desc}
                    </p>
                  </div>

                  {/* Type Points Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase block">Current Points Balance</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        min={0}
                        max={10000000}
                        value={matrixPoints}
                        onChange={(e) => setMatrixPoints(e.target.value === '' ? '' as any : Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none rounded-xl font-extrabold text-slate-800 text-sm transition-all"
                        placeholder="e.g. 25000"
                      />
                      <Gift size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-500" />
                    </div>
                  </div>
                </div>

                {/* Card Points Slider */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500 uppercase">Interactive Points Slider</span>
                    <span className="font-extrabold text-slate-950 text-base">{Number(matrixPoints || 0).toLocaleString()} {matrixData.activeCard.pointsName}</span>
                  </div>
                  <input 
                    type="range"
                    min={5000}
                    max={500000}
                    step={5000}
                    value={matrixPoints || 0}
                    onChange={(e) => setMatrixPoints(Number(e.target.value))}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>5,000 Points</span>
                    <span>100,000 Points</span>
                    <span>500,000 Points</span>
                  </div>
                </div>
              </div>

              {/* Informative Stats Card */}
              <div className="bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 text-white rounded-3xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Plane size={240} className="text-rose-100" />
                </div>

                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1 bg-rose-800 text-rose-300 font-bold px-3 py-1 rounded-full uppercase tracking-widest text-[10px]">
                    <Award size={12} />
                    Expert Value Analysis
                  </div>
                  <h4 className="text-xl font-bold tracking-tight leading-snug">Unlocking 4x Travel Value</h4>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    By transferring reward points to elite travel partners rather than redeeming for statement vouchers, you instantly obtain premium rewards! For example:
                  </p>
                  
                  <div className="space-y-2 text-[11px] text-slate-200 border-t border-white/10 pt-3">
                    <div className="flex justify-between">
                      <span>Standard Statement Cash Value:</span>
                      <span className="font-bold text-red-300">₹{matrixData.cashbackValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-rose-300 font-bold text-sm">
                      <span>Maximum Partner Travel Value:</span>
                      <span>₹{Math.max(...matrixData.partnerList.map(p => p.travelValue)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-normal border-t border-white/10 pt-3 mt-3">
                  💡 High multiplier cards like Axis Atlas automatically double points upon transferring to elite airline alliances.
                </p>
              </div>

            </div>

            {/* Selecting Partner Matrix Grid */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-950">Select Loyalty Transfer Partner</h3>
                <p className="text-xs text-slate-500">Pick any program to view conversion ratios and equivalent reward points immediately.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {matrixData.partnerList.map(p => {
                  const isSelected = selectedPartnerId === p.id;
                  return (
                    <motion.div
                      layout
                      key={p.id}
                      onClick={() => setSelectedPartnerId(p.id)}
                      className={cn(
                        "p-4 rounded-2xl border text-center transition-all duration-200 cursor-pointer flex flex-col justify-between hover:bg-slate-50 relative",
                        isSelected 
                          ? "border-rose-500 bg-rose-50/30 ring-2 ring-rose-500/10 shadow-md"
                          : "border-slate-200 bg-white shadow-sm"
                      )}
                    >
                      {isSelected && (
                        <span className="absolute top-2 right-2 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        </span>
                      )}
                      
                      <div className="space-y-1.5">
                        <span className="text-2xl block">{p.logo}</span>
                        <h4 className="font-extrabold text-slate-900 text-xs line-clamp-2 leading-tight min-h-[32px]">{p.name}</h4>
                        <span className="inline-flex py-0.5 px-2 bg-slate-100 hover:bg-slate-200 rounded text-[9px] font-bold text-slate-500 uppercase">
                          {p.type}
                        </span>
                      </div>

                      <div className="pt-3 border-t border-slate-150 mt-3 space-y-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">TRAVEL VALUE</p>
                        <p className="text-sm font-black text-rose-600">₹{p.travelValue.toLocaleString()}</p>
                        <p className="text-[9px] text-slate-500 font-bold">{p.multiplier}x Cash</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Main Interactive Conversion analysis & Comparative chart layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Leaderboard Chart (8 cols) */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Dynamic Conversion Charts</h3>
                  <p className="text-xs text-slate-500">Visualizing redeemed flight and luxury hotel booking equivalence value in INR.</p>
                </div>

                {/* Custom SVG Bar Chart */}
                <div className="space-y-4">
                  {matrixData.partnerList.map((partner) => {
                    const maxVal = Math.max(...matrixData.partnerList.map(p => p.travelValue), matrixData.cashbackValue);
                    const percentageWidth = maxVal > 0 ? (partner.travelValue / maxVal) * 100 : 0;
                    const isSelected = selectedPartnerId === partner.id;

                    return (
                      <div 
                        key={partner.id}
                        className={cn(
                          "p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 cursor-pointer hover:bg-slate-50/50",
                          isSelected ? "border-rose-400 bg-rose-50/10 shadow-sm" : "border-slate-100"
                        )}
                        onClick={() => setSelectedPartnerId(partner.id)}
                      >
                        {/* Partner label */}
                        <div className="md:w-52 shrink-0 flex items-center gap-2">
                          <span className="text-lg">{partner.logo}</span>
                          <div>
                            <h4 className="font-extrabold text-xs text-slate-900 truncate max-w-[180px]">{partner.name}</h4>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">{partner.ratioStr}</span>
                          </div>
                        </div>

                        {/* Visual Bar line */}
                        <div className="flex-1 space-y-1">
                          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden relative">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percentageWidth}%` }}
                              className={cn(
                                "h-full rounded-full transition-all duration-300",
                                isSelected ? "bg-rose-600" : "bg-slate-400"
                              )}
                            />
                          </div>
                        </div>

                        {/* Extracted value in INR */}
                        <div className="md:w-32 shrink-0 text-left md:text-right">
                          <p className="text-sm font-black text-slate-900">₹{partner.travelValue.toLocaleString()}</p>
                          <p className="text-[9px] text-emerald-600 font-extrabold flex items-center justify-start md:justify-end gap-0.5">
                            <TrendingUp size={10} /> {partner.multiplier}x value
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Standard statement cashback comparison bar line */}
                  <div className="p-4 rounded-xl border border-dashed border-red-300 bg-red-50/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="md:w-52 shrink-0 flex items-center gap-2">
                      <span className="text-lg">💳</span>
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900">Standard Statement Credit Vouchers</h4>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Statement cash back option</span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden relative">
                        <div 
                          className="bg-red-400 h-full rounded-full" 
                          style={{ width: `${(matrixData.cashbackValue / Math.max(...matrixData.partnerList.map(p => p.travelValue), matrixData.cashbackValue)) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="md:w-32 shrink-0 text-left md:text-right">
                      <p className="text-sm font-black text-rose-800">₹{matrixData.cashbackValue.toLocaleString()}</p>
                      <p className="text-[9px] text-red-500 font-extrabold uppercase">Base Redemption rate</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Partner detailed info widget (4 cols) */}
              <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <div className="w-10 h-10 bg-rose-100 text-rose-800 rounded-xl flex items-center justify-center text-lg font-bold">
                    {matrixData.activePartner.logo}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase">Transfer Partner Details</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Conversion & value mapping</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Program Name</span>
                    <strong className="text-slate-900">{matrixData.activePartner.name}</strong>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Card conversion ratio</span>
                    <strong className="text-slate-900">{matrixData.activePartner.ratioStr}</strong>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Equiv. Loyalty Points</span>
                    <strong className="text-rose-600 font-extrabold">{matrixData.activePartner.equivalentPoints.toLocaleString()} Points</strong>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Est. Val. Per Point</span>
                    <strong className="text-slate-900 font-bold">~₹{matrixData.activePartner.valuePerPoint.toFixed(2)}</strong>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                    <span className="text-slate-700 font-bold">Total Estimated Reward Value</span>
                    <span className="font-extrabold text-emerald-600 text-sm">₹{matrixData.activePartner.travelValue.toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed bg-white p-3 rounded-xl border border-slate-150">
                  {matrixData.activePartner.desc}
                </p>

                <div className="pt-2">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Redemption Process Guidelines</h5>
                  <ol className="space-y-2 text-[10px] text-slate-600 list-decimal pl-3 leading-relaxed">
                    <li>Link your loyalty member number to your banking reward control panel.</li>
                    <li>Initiate point transfer instantly (usually completes in 1-48 hours).</li>
                    <li>Book hotel/flight directly through partner site to maximize companion reward perks.</li>
                  </ol>
                </div>
              </div>

            </div>
          </motion.div>
        ) : (
          <motion.div
            key="ai-optimizer-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Input card for original AI options */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-200 p-6 md:p-8 relative overflow-visible">
              <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 pointer-events-none"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end relative z-20">
                <div className="space-y-2 relative" ref={dropdownRef}>
                  <label className="text-sm font-bold text-slate-700">Select Your Credit Card</label>
                  <div 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl transition-all font-medium text-slate-700 cursor-pointer flex justify-between items-center"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <span className="truncate">
                      {selectedCardId 
                        ? `${cards.find(c => (c as any)._id === selectedCardId || c.id === selectedCardId)?.bankName} ${cards.find(c => (c as any)._id === selectedCardId || c.id === selectedCardId)?.cardName}` 
                        : 'Select a card...'}
                    </span>
                    <ChevronDown size={20} className={cn("text-slate-400 transition-transform", isDropdownOpen && "rotate-180")} />
                  </div>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
                      >
                        <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                          <Search size={18} className="text-slate-400 ml-2" />
                          <input 
                            type="text" 
                            placeholder="Search for a card..." 
                            className="w-full bg-transparent p-2 focus:outline-none text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {cards.filter(c => 
                            `${c.bankName} ${c.cardName}`.toLowerCase().includes(searchQuery.toLowerCase())
                          ).length > 0 ? (
                            cards.filter(c => 
                              `${c.bankName} ${c.cardName}`.toLowerCase().includes(searchQuery.toLowerCase())
                            ).map(card => {
                              const cardId = (card as any)._id || card.id;
                              const isSelected = selectedCardId === cardId;
                              return (
                                <div
                                  key={cardId}
                                  className={cn(
                                    "px-4 py-3 cursor-pointer flex items-center justify-between hover:bg-rose-50 transition-colors",
                                    isSelected && "bg-rose-50/50"
                                  )}
                                  onClick={() => {
                                    setSelectedCardId(cardId);
                                    setIsDropdownOpen(false);
                                    setSearchQuery('');
                                  }}
                                >
                                  <span className="text-sm font-medium text-slate-800">{card.bankName} {card.cardName}</span>
                                  {isSelected && <Check size={16} className="text-rose-600" />}
                                </div>
                              );
                            })
                          ) : (
                            <div className="p-4 text-center text-sm text-slate-500">No cards found matching "{searchQuery}"</div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Current Reward Points Balance</label>
                  <div className="relative">
                    <Gift className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 25000"
                      value={pointsBalance}
                      onChange={(e) => setPointsBalance(e.target.value ? Number(e.target.value) : '')}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-center relative z-10">
                <button
                  onClick={handleMaximize}
                  disabled={loadingAi || !pointsBalance || !selectedCardId}
                  className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-rose-600 to-orange-500 text-white rounded-xl font-bold hover:from-rose-700 hover:to-orange-600 transition-all shadow-lg shadow-rose-200 disabled:opacity-50 disabled:shadow-none w-full md:w-auto justify-center text-lg group"
                >
                  {loadingAi ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Analyzing Transfer Partners...
                    </>
                  ) : (
                    <>
                      <Zap size={22} className="group-hover:scale-110 transition-transform" />
                      Find Maximum Value
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center font-medium border border-red-100">
                {error}
              </div>
            )}

            {options.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Your Optimization Strategy</h3>
                    <p className="text-slate-500">Ranked by highest monetary value.</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-lg flex items-center gap-2">
                    <TrendingUp className="text-emerald-600" size={20} />
                    <span className="text-sm font-medium text-emerald-800">
                      Potential Gain: <strong className="text-emerald-600 text-lg">₹{(options[0].totalValue - baseValue).toLocaleString('en-IN')}</strong> vs Cash
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {options.map((option, index) => {
                    const isExpanded = expandedIndex === index;
                    const multiplier = baseValue > 0 ? (option.totalValue / baseValue).toFixed(1) : '1.0';
                    const isBest = index === 0;

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          "relative overflow-hidden rounded-2xl border transition-all duration-300",
                          isBest 
                            ? "bg-white border-rose-200 shadow-md ring-1 ring-rose-100" 
                            : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                        )}
                      >
                        {isBest && (
                          <div className="absolute top-0 right-0 bg-gradient-to-r from-rose-500 to-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl z-10 shadow-sm">
                            MAXIMUM VALUE
                          </div>
                        )}
                        
                        {/* Card Header (Clickable) */}
                        <div 
                          className="p-6 md:pr-16 cursor-pointer flex flex-col md:flex-row md:items-center gap-6 relative z-0"
                          onClick={() => setExpandedIndex(isExpanded ? null : index)}
                        >
                          <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                            isBest ? "bg-gradient-to-br from-rose-100 to-orange-100 text-rose-600" : "bg-slate-100 text-slate-600"
                          )}>
                            {getIconForCategory(option.category)}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn(
                                "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
                                option.category === 'Travel' ? "bg-sky-100 text-sky-700" :
                                option.category === 'Shopping' ? "bg-fuchsia-100 text-fuchsia-700" :
                                option.category === 'Cashback' ? "bg-emerald-100 text-emerald-700" :
                                "bg-slate-100 text-slate-700"
                              )}>
                                {option.category}
                              </span>
                              {Number(multiplier) > 1.1 && (
                                <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Zap size={10} /> {multiplier}x Value
                                </span>
                              )}
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 mb-1 pr-12 md:pr-0">{option.method}</h4>
                            <p className="text-slate-600 text-sm line-clamp-1">{option.recommendation}</p>
                          </div>

                          <div className="md:text-right shrink-0 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center w-full md:w-auto mt-4 md:mt-0 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                            <div>
                              <div className="text-sm text-slate-500 font-medium mb-1 md:text-right">Total Value</div>
                              <div className={cn(
                                "text-3xl font-bold flex items-center",
                                isBest ? "text-rose-600" : "text-slate-900"
                              )}>
                                <IndianRupee size={24} className="mr-1" />
                                {option.totalValue.toLocaleString('en-IN')}
                              </div>
                            </div>
                            <button className="md:hidden w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
                              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                          </div>
                          
                          <div className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-50 items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </div>
                        </div>

                        {/* Expandable Details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/50">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  
                                  {/* Left Column: Metrics */}
                                  <div className="md:col-span-1 space-y-4">
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                      <div className="text-xs text-slate-500 font-bold uppercase mb-1">Conversion Ratio</div>
                                      <div className="font-medium text-slate-900">{option.transferRatio}</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                      <div className="text-xs text-slate-500 font-bold uppercase mb-1">Value Per Point</div>
                                      <div className="font-medium text-slate-900 flex items-center">
                                        <IndianRupee size={14} className="mr-0.5 text-slate-400" />
                                        {option.valuePerPoint.toFixed(2)}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right Column: Steps */}
                                  <div className="md:col-span-2">
                                    <h5 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                      <Info size={16} className="text-indigo-500" />
                                      How to Redeem
                                    </h5>
                                    <div className="space-y-3">
                                      {option.steps.map((step, stepIdx) => (
                                        <div key={stepIdx} className="flex gap-3">
                                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                            {stepIdx + 1}
                                          </div>
                                          <p className="text-sm text-slate-700 leading-relaxed">{step}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
