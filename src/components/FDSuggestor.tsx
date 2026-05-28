import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { 
  TrendingUp, 
  Calculator, 
  Calendar, 
  ArrowUpRight, 
  Percent, 
  Sliders, 
  HelpCircle, 
  Activity, 
  Sparkles, 
  Check, 
  RefreshCw, 
  Landmark, 
  Info, 
  ArrowDownRight, 
  Award,
  Table,
  Plus,
  ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getFinancialAdvice } from '../services/gemini';
import { FixedDeposit } from '../types';

export default function FDSuggestor() {
  const [fds, setFds] = useState<FixedDeposit[]>([]);
  const [tenure, setTenure] = useState<'All' | '1-2 Years' | '3-5 Years'>('All');
  const [amount, setAmount] = useState<number | ''>(50000);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loading, setLoading] = useState(true);

  // Active Tab: optimizer (original list) vs ladder (new interactive planner)
  const [activeTab, setActiveTab] = useState<'optimizer' | 'ladder'>('optimizer');

  // FD Laddering States
  const [ladderAmount, setLadderAmount] = useState<number>(500000);
  const [ladderSteps, setLadderSteps] = useState<number>(5);
  const [ladderSenior, setLadderSenior] = useState<boolean>(false);
  const [ladderCustomBaseRate, setLadderCustomBaseRate] = useState<number>(7.20);
  const [ladderRatesMode, setLadderRatesMode] = useState<'optimized' | 'custom'>('optimized');
  const [selectedLegIndex, setSelectedLegIndex] = useState<number>(0);

  useEffect(() => {
    const fetchData = () => {
      fetch('/api/fds')
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data)) {
            setFds(data);
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredFDs = useMemo(() => {
    return fds.filter(fd => {
      const currentAmount = Number(amount) || 0;
      if (fd.minAmount && currentAmount < fd.minAmount) return false;
      if (tenure === 'All') return true;

      const daysMatch = fd.tenureRange.match(/(\d+)/);
      if (daysMatch && fd.tenureRange.toLowerCase().includes('day')) {
        const days = parseInt(daysMatch[1], 10);
        const years = days / 365;
        
        if (tenure === '1-2 Years') {
          return years >= 1 && years <= 2;
        } else if (tenure === '3-5 Years') {
          return years > 2 && years <= 5;
        }
      }

      return fd.tenureRange === tenure;
    });
  }, [fds, tenure, amount]);

  // Generate ladder information
  const ladderData = useMemo(() => {
    const steps = Number(ladderSteps) || 5;
    const unitAmount = (Number(ladderAmount) || 500000) / steps;
    
    const results = [];
    for (let i = 1; i <= steps; i++) {
      let rate = Number(ladderCustomBaseRate) || 7.2;
      let matchedBank = "Standard Bank";
      
      if (ladderRatesMode === 'optimized' && fds.length > 0) {
        // Find best bank rate matching approximately i years
        const possibleFDs = fds.filter(fd => {
          const tr = fd.tenureRange.toLowerCase();
          if (i === 1) return tr.includes('365') || tr.includes('1 yr') || tr.includes('1 year');
          if (i === 2) return tr.includes('2 yr') || tr.includes('2 year') || tr.includes('700') || tr.includes('2 years');
          if (i === 3) return tr.includes('3 yr') || tr.includes('3 year') || tr.includes('3 years');
          if (i === 4) return tr.includes('4 yr') || tr.includes('4 year') || tr.includes('4 years');
          if (i === 5) return tr.includes('5 yr') || tr.includes('5 year') || tr.includes('5 years');
          return false;
        });
        
        if (possibleFDs.length > 0) {
          const sorted = [...possibleFDs].sort((a,b) => b.interestRate - a.interestRate);
          rate = sorted[0].interestRate;
          matchedBank = sorted[0].bankName;
        } else {
          // Standard real curves for fallback
          const standardCurves: {[key: number]: {rate: number, bank: string}} = {
            1: { rate: 7.10, bank: "HDFC Bank" },
            2: { rate: 7.30, bank: "ICICI Bank" },
            3: { rate: 7.45, bank: "IDFC First Bank" },
            4: { rate: 7.20, bank: "Axis Bank" },
            5: { rate: 7.55, bank: "IndusInd Bank" },
            6: { rate: 7.35, bank: "SBI" }
          };
          const curve = standardCurves[i] || { rate: 7.2, bank: "SBI" };
          rate = curve.rate;
          matchedBank = curve.bank;
        }
      } else {
        // Flat input option or subtle curve adjustment manually
        if (ladderSteps === 5) {
          const standardCurves: {[key: number]: {rate: number, bank: string}} = {
            1: { rate: 7.10, bank: "HDFC Bank" },
            2: { rate: 7.30, bank: "ICICI Bank" },
            3: { rate: 7.45, bank: "IDFC First Bank" },
            4: { rate: 7.20, bank: "Axis Bank" },
            5: { rate: 7.55, bank: "IndusInd Bank" }
          };
          // Base customized curve around base custom rate
          const shift = (standardCurves[i]?.rate ?? 7.2) - 7.3;
          rate = Number((Number(ladderCustomBaseRate) + shift).toFixed(2));
          matchedBank = standardCurves[i]?.bank ?? "Standard Bank";
        } else {
          const sampleBanks = ["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak Bank"];
          matchedBank = sampleBanks[(i - 1) % sampleBanks.length];
        }
      }
      
      const actualRate = ladderSenior ? rate + 0.5 : rate;
      
      // Quarterly compounded Indian FD formula: A = P * (1 + R/400) ^ (4 * years)
      const maturityValue = unitAmount * Math.pow(1 + actualRate / 400, 4 * i);
      const totalInterest = maturityValue - unitAmount;
      
      results.push({
        step: i,
        tenureYears: i,
        bank: matchedBank,
        principal: unitAmount,
        rate: actualRate,
        baseRateOnly: rate,
        maturityValue: Math.round(maturityValue),
        totalInterest: Math.round(totalInterest)
      });
    }
    return results;
  }, [fds, ladderAmount, ladderSteps, ladderSenior, ladderCustomBaseRate, ladderRatesMode]);

  // Calculate high-yield compounding reinvestment projection logs over 10 Years
  const compoundingSchedule = useMemo(() => {
    let yearLogs = [];
    const steps = Number(ladderSteps) || 5;
    
    // Initial setups: each leg has principal & initial rate
    let activeFDs = ladderData.map(log => ({
      remainingYears: log.tenureYears,
      originalTenure: steps, // always reinvest into top tier tenure
      principal: log.principal,
      rate: log.rate,
      accruedInterest: 0,
      bank: log.bank
    }));

    // Find the premium reinvestment rate (which is the i=steps leg rate)
    const premiumRateItem = ladderData.find(d => d.step === steps);
    const premiumRate = premiumRateItem ? premiumRateItem.rate : (ladderCustomBaseRate + (ladderSenior ? 0.5 : 0));
    const premiumBank = premiumRateItem ? premiumRateItem.bank : "Top Yield Partner";

    let cumulativeValue = Number(ladderAmount);

    for (let year = 1; year <= 10; year++) {
      let totalMaturedValueThisYear = 0;
      let logsForThisYear = [];
      let totalValueAtEnd = 0;

      // Update remaining tenures and calculate maturity
      activeFDs = activeFDs.map(fd => {
        const nextRemaining = fd.remainingYears - 1;
        
        if (nextRemaining === 0) {
          // Quarterly compounded value calculation for its remaining duration
          const mVal = fd.principal * Math.pow(1 + fd.rate / 400, 4 * fd.remainingYears);
          totalMaturedValueThisYear += mVal;
          logsForThisYear.push({
            bank: fd.bank,
            amount: fd.principal,
            mVal: mVal,
            interest: mVal - fd.principal
          });
          
          // Reinvest into full premium tenure (e.g. 5-Year FD)
          return {
            remainingYears: steps,
            originalTenure: steps,
            principal: mVal, // reinvesting both principal and interest compounding
            rate: premiumRate,
            accruedInterest: 0,
            bank: premiumBank
          };
        } else {
          return {
            ...fd,
            remainingYears: nextRemaining
          };
        }
      });

      // Recalculate ending total asset balance across all active FDs in the ladder
      totalValueAtEnd = activeFDs.reduce((sum, fd) => {
        // Elapsed duration inside this year for this specific leg
        const yearsHeld = fd.originalTenure - fd.remainingYears;
        const currentLegVal = fd.principal * Math.pow(1 + fd.rate / 400, 4 * yearsHeld);
        return sum + currentLegVal;
      }, 0);

      yearLogs.push({
        year,
        maturedAmount: Math.round(totalMaturedValueThisYear),
        interestEarned: Math.round(logsForThisYear.reduce((acc, l) => acc + l.interest, 0)),
        reinvestedAs: `New ${steps}-Yr FD at ${premiumRate}%`,
        totalLadderValue: Math.round(totalValueAtEnd),
        details: logsForThisYear
      });
    }

    return yearLogs;
  }, [ladderData, ladderAmount, ladderSteps, ladderCustomBaseRate, ladderSenior]);

  const handleGetAiAdvice = async () => {
    setLoadingAi(true);
    let prompt = "";
    if (activeTab === 'optimizer') {
      prompt = `I want to invest ₹${amount} in a Fixed Deposit for ${tenure === 'All' ? 'any tenure' : tenure}. Based on these options: ${JSON.stringify(filteredFDs.slice(0, 10))}, which one gives the best return? Also, give me a quick tip on FD laddering.`;
    } else {
      prompt = `I am designing a Fixed Deposit Ladder of ₹${ladderAmount} using ${ladderSteps} steps/staggers. The current structure is: ${JSON.stringify(ladderData)}. How can I optimize this ladder to ensure high liquidity while maximizing returns? Provide expert structural advice on FD laddering.`;
    }
    const advice = await getFinancialAdvice(prompt);
    setAiAdvice(advice);
    setLoadingAi(false);
  };

  // Switch tabs reset advice
  const handleTabChange = (tab: 'optimizer' | 'ladder') => {
    setActiveTab(tab);
    setAiAdvice(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Optimizing deposit rates...</p>
      </div>
    );
  }

  const selectedLeg = ladderData[selectedLegIndex] || ladderData[0];

  return (
    <div className="space-y-8">
      {/* Title Header with interactive options */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">FD Optimizer & Laddering</h2>
          <p className="text-slate-500">Maximize your savings with the best Fixed Deposit rates and dynamic ladder planning.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* AI Strategy Button */}
          <button
            onClick={handleGetAiAdvice}
            disabled={loadingAi}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 active:bg-emerald-700 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-100 disabled:opacity-50 text-sm"
          >
            <Sparkles size={16} />
            {loadingAi ? 'Calculating Strategy...' : "Ask Wealth Wizard ✨"}
          </button>
        </div>
      </div>

      {/* Primary Tab Toggle */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full max-w-md">
        <button
          onClick={() => handleTabChange('optimizer')}
          className={cn(
            "flex-1 py-3 text-center rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
            activeTab === 'optimizer' 
              ? "bg-white text-emerald-800 shadow-sm" 
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <Calculator size={16} />
          FD Rate Optimizer
        </button>
        <button
          onClick={() => handleTabChange('ladder')}
          className={cn(
            "flex-1 py-3 text-center rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
            activeTab === 'ladder' 
              ? "bg-white text-emerald-800 shadow-sm" 
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <TrendingUp size={16} />
          🪜 Interactive FD Ladder
        </button>
      </div>

      {/* Wealth Wizard AI Response View */}
      {aiAdvice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-100 rounded-2xl shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md">
              <Sparkles size={20} className="text-emerald-100" />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Wizard's Interactive Recommendation</h4>
              <div className="prose prose-sm prose-emerald max-w-none prose-p:leading-relaxed text-slate-700">
                <Markdown>{aiAdvice}</Markdown>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === 'optimizer' ? (
          <motion.div
            key="optimizer-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <Calculator className="text-emerald-600" size={20} />
                  <h3>Investment Details</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Investment Amount (₹)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Preferred Tenure</label>
                    <div className="flex gap-2 p-1 bg-slate-50 border border-slate-200 rounded-xl">
                      {(['All', '1-2 Years', '3-5 Years'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTenure(t)}
                          className={cn(
                            "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                            tenure === t ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-white"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-900 rounded-2xl p-6 text-white flex flex-col justify-center relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <TrendingUp size={160} />
                </div>
                <div className="relative z-10 space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800 text-emerald-300 text-xs font-bold uppercase tracking-wide">
                    <Award size={12} />
                    Expert Strategy Tip
                  </div>
                  <h4 className="text-xl font-bold text-emerald-300">Maximize with FD Laddering!</h4>
                  <p className="text-slate-200 text-sm leading-relaxed">
                    Senior citizens get up to <span className="text-white font-bold underline decoration-emerald-400">0.50% extra</span> interest. Split your funds into our new Laddering Planner to combine maximum maturity yield and emergency monthly liquidity!
                  </p>
                </div>
              </div>
            </div>

            {/* List of custom rates available */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Available High-Yield FD Rates</h3>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                  {filteredFDs.length} Banks Available
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {filteredFDs.map((fd) => {
                  const currentAmount = Number(amount) || 0;
                  const interest = (currentAmount * fd.interestRate * 1) / 100;
                  return (
                    <motion.div
                      layout
                      key={fd.id}
                      className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-emerald-300 transition-colors shadow-sm"
                    >
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                          <Landmark size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{fd.bankName}</h4>
                          <span className="text-[12px] font-medium text-slate-500 flex items-center gap-1">
                            <Calendar size={12} /> {fd.tenureRange}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10 w-full md:w-auto text-left">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Regular Rate</p>
                          <p className="text-lg font-bold text-emerald-600">{fd.interestRate}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Senior Citizen</p>
                          <p className="text-lg font-bold text-indigo-600">{fd.seniorCitizenRate}%</p>
                        </div>
                        <div className="hidden lg:block">
                          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Est. 1-Yr Maturity</p>
                          <p className="text-lg font-bold text-slate-900">₹{Math.floor(currentAmount + interest).toLocaleString()}</p>
                        </div>
                      </div>

                      <button className="w-full md:w-auto px-5 py-3 bg-slate-950 hover:bg-slate-800 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 group text-sm shadow-sm">
                        Invest 
                        <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="ladder-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Top Interactive Controls Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Sliders className="text-emerald-600" size={20} />
                    <h3>Laddering Variables</h3>
                  </div>
                  <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full border border-indigo-100">
                    Auto-compounding Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Total Capital Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-500 uppercase">Total Capital Splitting</label>
                      <span className="font-extrabold text-slate-950 text-base">₹{Number(ladderAmount).toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min={50000}
                      max={2000000}
                      step={25000}
                      value={ladderAmount}
                      onChange={(e) => setLadderAmount(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span>₹50K</span>
                      <span>₹5 Lakh (Standard)</span>
                      <span>₹20 Lakh</span>
                    </div>
                  </div>

                  {/* Stagger Steps Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase block">Ladder steps (Tenure levels)</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[3, 4, 5, 6].map((steps) => (
                        <button
                          key={steps}
                          onClick={() => {
                            setLadderSteps(steps);
                            setSelectedLegIndex(0);
                          }}
                          className={cn(
                            "py-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center",
                            ladderSteps === steps 
                              ? "bg-slate-900 text-white border-slate-900 shadow-md" 
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          <span className="text-sm">{steps}</span>
                          <span className="text-[9px] opacity-70">FDs</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interest Rates Source */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase block">Interest Rate Allocation</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setLadderRatesMode('optimized')}
                        className={cn(
                          "py-3 rounded-xl border text-xs font-extrabold transition-all flex items-center justify-center gap-1.5",
                          ladderRatesMode === 'optimized'
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <Sparkles size={14} className="text-emerald-600" />
                        Best Bank Rates
                      </button>
                      <button
                        onClick={() => setLadderRatesMode('custom')}
                        className={cn(
                          "py-3 rounded-xl border text-xs font-extrabold transition-all flex items-center justify-center gap-1.5",
                          ladderRatesMode === 'custom'
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <Sliders size={14} className="text-emerald-600" />
                        Manual Control
                      </button>
                    </div>
                  </div>

                  {/* Manual slider representation (Shown only if in Custom mode) */}
                  <div className="space-y-2 flex flex-col justify-end">
                    {ladderRatesMode === 'custom' ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-500">CUSTOM BASE REWARD</span>
                          <span className="font-bold text-emerald-600">{ladderCustomBaseRate}%</span>
                        </div>
                        <input
                          type="range"
                          min={5.0}
                          max={9.5}
                          step={0.05}
                          value={ladderCustomBaseRate}
                          onChange={(e) => setLadderCustomBaseRate(Number(e.target.value))}
                          className="w-full accent-emerald-600 cursor-pointer"
                        />
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-500 leading-relaxed">
                        ⚡ <strong className="text-emerald-800 font-extrabold">Best Bank Rates mode</strong> is checking live bank parameters dynamically for your tenures to give exact simulation values.
                      </div>
                    )}
                  </div>
                </div>

                {/* Senior Citizen Toggle */}
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                  <div className="flex items-start gap-2.5">
                    <Award className="text-emerald-700 mt-0.5" size={18} />
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase">Senior Citizen Interest Boost</h4>
                      <p className="text-[11px] text-slate-500">Unlocks an extra booster of <span className="font-semibold text-emerald-700">0.50%</span> across all FD staggers.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setLadderSenior(!ladderSenior)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative focus:outline-none",
                      ladderSenior ? "bg-emerald-600" : "bg-slate-300"
                    )}
                  >
                    <span 
                      className={cn(
                        "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                        ladderSenior ? "translate-x-6" : ""
                      )} 
                    />
                  </button>
                </div>
              </div>

              {/* Laddering Quick Explainer Card */}
              <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <TrendingUp size={240} />
                </div>
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800 text-emerald-300 text-[10px] font-bold uppercase tracking-widest">
                    <HelpCircle size={12} />
                    What is FD Laddering?
                  </div>
                  <h4 className="text-xl font-extrabold tracking-tight leading-snug">The Elite Liquid Yield Strategy</h4>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Instead of locking all <strong>₹{Number(ladderAmount).toLocaleString()}</strong> in a single long-term FD, splitting it into staggered years lets you:
                  </p>
                  <ul className="space-y-2 text-[11px] text-slate-200">
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold select-none">✔</span>
                      <strong>Never pay withdrawal fines:</strong> 1 FD matures fully every single year, giving you reliable access to liquid cash penalty-free.
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold select-none">✔</span>
                      <strong>Compound to premium tiers:</strong> Upon maturity, reinvesting each block into a new 5-Year FD locks in premium maximum returns over the decade.
                    </li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between items-center text-[10px] text-emerald-400 font-semibold">
                  <span>Maturity schedule staggered</span>
                  <span>100% Secure</span>
                </div>
              </div>
            </div>

            {/* Interactive Flowchart visual schedule section */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Staggered Maturity Flowchart</h3>
                <p className="text-xs text-slate-500">Live visualization representing principal split and timeline maturity schedules.</p>
              </div>

              {/* Graphical Timeline Rows Container */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Horizontal Timeline Bar Graphs */}
                <div className="lg:col-span-8 space-y-4">
                  {ladderData.map((leg, index) => {
                    const isSelected = selectedLegIndex === index;
                    const maxYears = Math.max(...ladderData.map(l => l.tenureYears));
                    const percentageWidth = (leg.tenureYears / maxYears) * 100;

                    return (
                      <div 
                        key={leg.step}
                        onClick={() => setSelectedLegIndex(index)}
                        className={cn(
                          "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row items-stretch gap-4 hover:bg-slate-50",
                          isSelected 
                            ? "border-emerald-500 bg-emerald-50/40 shadow-sm" 
                            : "border-slate-200 bg-white"
                        )}
                      >
                        {/* Circle Tag / Bank name */}
                        <div className="md:w-36 shrink-0 flex items-center gap-2.5">
                          <span className={cn(
                            "w-8 h-8 rounded-lg text-xs font-extrabold flex items-center justify-center select-none",
                            isSelected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                          )}>
                            #{leg.step}
                          </span>
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs truncate max-w-[110px]">{leg.bank}</h4>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">{leg.tenureYears} Year FD</span>
                          </div>
                        </div>

                        {/* Progress visual bar */}
                        <div className="flex-1 flex flex-col justify-center min-h-[36px] space-y-1">
                          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden relative">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percentageWidth}%` }}
                              className={cn(
                                "h-full rounded-full transition-all duration-300",
                                isSelected ? "bg-emerald-600" : "bg-slate-400"
                              )}
                            />
                          </div>
                          {/* Scale Marker Labels */}
                          <div className="flex justify-between text-[9px] text-slate-400 font-extrabold">
                            <span>Start (Year 0)</span>
                            <span>Matures at end of Year {leg.tenureYears}</span>
                          </div>
                        </div>

                        {/* Pricing Preview */}
                        <div className="md:w-32 shrink-0 flex flex-col justify-center text-left md:text-right pl-2 md:pl-0 border-l md:border-l-0 border-slate-200">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Maturity Value</span>
                          <span className="text-sm font-bold text-slate-900">₹{leg.maturityValue.toLocaleString()}</span>
                          <span className="text-[10px] text-emerald-600 font-extrabold">+{leg.rate}% interest</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Leg side analytics dashboard */}
                <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <div className="w-7 h-7 bg-emerald-100 text-emerald-800 rounded-lg flex items-center justify-center text-xs font-bold">
                      #{selectedLeg.step}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase">Selected FD Details</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Leg stagger analysis</p>
                    </div>
                  </div>

                  {/* Pricing elements details */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Bank Partner</span>
                      <span className="font-bold text-slate-900">{selectedLeg.bank}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Amount Principal Spared</span>
                      <span className="font-extrabold text-slate-900">₹{Math.round(selectedLeg.principal).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Interest Yield Rate</span>
                      <span className="font-extrabold text-emerald-600">{selectedLeg.rate}%</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Tenure Duration</span>
                      <span className="font-bold text-indigo-700">{selectedLeg.tenureYears} Year{selectedLeg.tenureYears > 1 ? 's' : ''}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Compounded Interest</span>
                      <span className="font-extrabold text-emerald-600">₹{selectedLeg.totalInterest.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-900 font-bold">Maturity Return</span>
                      <span className="font-black text-slate-950 text-sm">₹{selectedLeg.maturityValue.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-[10px] text-slate-500 leading-relaxed text-center font-medium">
                    🏆 By staggering tenure, if you encounter an emergency at Year {selectedLeg.step}, you can access this block without touching the rest of your assets.
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Compounding Maturity Schedule & Cashflow Logs Table */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Table className="text-emerald-600" size={18} />
                    Dynamic Compounding & Cashflow Logs
                  </h3>
                  <p className="text-xs text-slate-500">Stagger reinvestment projection at top 5-year rate over a 10-year holding period.</p>
                </div>
                <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-slate-600">
                  <RefreshCw size={12} className="text-emerald-600 animate-spin" />
                  Auto-Calculated Live Logs
                </div>
              </div>

              {/* Table wrapper */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px]">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">Year of Stagger</th>
                      <th className="py-3.5 px-4 font-bold text-right">Matured Cashflow (Liquid)</th>
                      <th className="py-3.5 px-4 font-bold text-right">Interest Generated</th>
                      <th className="py-3.5 px-4 font-bold text-center">Reinvest Details</th>
                      <th className="py-3.5 px-4 font-bold text-right">Cumulative Asset Asset Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {compoundingSchedule.map((row) => (
                      <tr key={row.year} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-extrabold text-slate-900 border-r border-slate-100">
                          Year {row.year}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-indigo-700">
                          ₹{row.maturedAmount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right text-emerald-600 font-extrabold">
                          + ₹{row.interestEarned.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-150 border border-slate-200 text-slate-600 text-[10px] font-bold">
                            <RefreshCw size={10} className="text-indigo-600" />
                            {row.reinvestedAs}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-950 text-xs border-l border-slate-100 bg-slate-50/40">
                          ₹{row.totalLadderValue.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Educational Highlight summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                    <Info size={14} className="text-indigo-600" />
                    How Reinvestment Sustains Maximum Interest
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    When Year 1 ends, FD #1 (which had a 1-year tenure) matures. Because you don't need the immediate emergency cash, you reinvest it into a <strong>new 5-year FD</strong>. Naturally, 5-year FDs yield the highest rates. By repeating this stagger year-after-year, your entire portfolio earns 5-year rates, while you still receive penalty-free maturity and liquid cashflow exactly once a year!
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-emerald-700" />
                    Estimated 10-Year Cumulative Gain
                  </h4>
                  <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                    Splitting ₹{Number(ladderAmount).toLocaleString()} using a {ladderSteps}-step stagger grows your total asset balance to:
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-700">₹{compoundingSchedule[9]?.totalLadderValue.toLocaleString()}</span>
                    <span className="text-[11px] text-slate-400 font-bold uppercase">Total Compounded Assets</span>
                  </div>
                  <p className="text-[10px] text-emerald-600 font-extrabold">
                    🚀 Gain of ~₹{Math.round(compoundingSchedule[9]?.totalLadderValue - Number(ladderAmount)).toLocaleString()} (Net +{Math.round(((compoundingSchedule[9]?.totalLadderValue - Number(ladderAmount)) / Number(ladderAmount)) * 100)}% absolute growth)
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
