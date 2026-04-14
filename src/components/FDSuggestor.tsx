import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Calculator, Calendar, ArrowUpRight, Percent } from 'lucide-react';
import { cn } from '../lib/utils';
import { getFinancialAdvice } from '../services/gemini';
import { FixedDeposit } from '../types';

export default function FDSuggestor() {
  const [fds, setFds] = useState<FixedDeposit[]>([]);
  const [tenure, setTenure] = useState<'All' | '1-2 Years' | '3-5 Years'>('All');
  const [amount, setAmount] = useState<number>(50000);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loading, setLoading] = useState(true);

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
      if (tenure === 'All') return true;

      // Try to parse days from strings like "365 Days", "700 days"
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

      // Fallback for exact match if format is different
      return fd.tenureRange === tenure;
    });
  }, [fds, tenure]);

  const handleGetAiAdvice = async () => {
    setLoadingAi(true);
    const prompt = `I want to invest ₹${amount} in a Fixed Deposit for ${tenure === 'All' ? 'any tenure' : tenure}. Based on these options: ${JSON.stringify(fds)}, which one gives the best return? Also, give me a quick tip on FD laddering.`;
    const advice = await getFinancialAdvice(prompt);
    setAiAdvice(advice);
    setLoadingAi(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Optimizing deposit rates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">FD Optimizer</h2>
          <p className="text-slate-500">Maximize your savings with the best Fixed Deposit rates.</p>
        </div>
        <button
          onClick={handleGetAiAdvice}
          disabled={loadingAi}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100 disabled:opacity-50"
        >
          <TrendingUp size={20} />
          {loadingAi ? 'Calculating Returns...' : 'Ask Wealth Wizard'}
        </button>
      </div>

      {aiAdvice && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white shrink-0">
              <Percent size={20} />
            </div>
            <div>
              <h4 className="font-bold text-emerald-900 mb-2">Wizard's Strategy</h4>
              <p className="text-emerald-800 leading-relaxed whitespace-pre-wrap">{aiAdvice}</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
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
                onChange={(e) => setAmount(Number(e.target.value))}
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

        <div className="bg-emerald-900 rounded-2xl p-6 text-white flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <TrendingUp size={160} />
          </div>
          <div className="relative z-10">
            <h4 className="text-emerald-400 font-bold uppercase tracking-widest text-xs mb-2">Pro Tip</h4>
            <p className="text-xl font-medium leading-relaxed">
              "Senior citizens typically get an additional <span className="text-emerald-400 font-bold">0.50%</span> interest rate on most FDs. Always check for special tenure rates like 444 or 777 days!"
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900">Available FD Rates</h3>
        <div className="grid grid-cols-1 gap-4">
          {filteredFDs.map((fd) => {
            const interest = (amount * fd.interestRate * 1) / 100; // Simple 1yr calculation for demo
            return (
              <motion.div
                layout
                key={fd.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-emerald-300 transition-colors"
              >
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{fd.bankName}</h4>
                    <span className="text-sm text-slate-500">{fd.tenureRange}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 w-full md:w-auto">
                  <div>
                    <div className="text-xs text-slate-400 font-bold uppercase mb-1">Regular Rate</div>
                    <div className="text-xl font-bold text-emerald-600">{fd.interestRate}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-bold uppercase mb-1">Senior Citizen</div>
                    <div className="text-xl font-bold text-indigo-600">{fd.seniorCitizenRate}%</div>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-xs text-slate-400 font-bold uppercase mb-1">Est. Return (1yr)</div>
                    <div className="text-xl font-bold text-slate-900">₹{interest.toLocaleString()}</div>
                  </div>
                </div>

                <button className="w-full md:w-auto px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                  Invest <ArrowUpRight size={18} />
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
