import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Wallet, Search, Filter, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { getFinancialAdvice } from '../services/gemini';
import { BankAccount } from '../types';

export default function AccountSuggestor() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'High Interest' | 'Zero Balance'>('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      fetch('/api/accounts')
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data)) {
            setAccounts(data);
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    };

    fetchData(); // Initial fetch
    
    // Poll every 5 seconds for real-time updates
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const ALLOWED_CATEGORIES = ['Cashback', 'Travel', 'Dinning', 'Entertainment', 'Movies', 'Fuel', 'Health', 'Lifestyle', 'Forex Friendly'];

  const filteredAccounts = useMemo(() => {
    let result = accounts.filter(acc => {
      const matchesSearch = acc.bankName.toLowerCase().includes(search.toLowerCase()) || 
                           (acc.accountName || '').toLowerCase().includes(search.toLowerCase());
      
      // Fix: Ensure 'High Interest' doesn't filter out everything before sorting
      const matchesFilter = filter === 'All' || 
                            filter === 'High Interest' ||
                           (filter === 'Zero Balance' && Number(acc.minBalance) === 0);
      
      let matchesTag = true;
      // Only apply tag filtering if we are in the 'All' section
      if (filter === 'All' && selectedTag !== 'All') {
        if (Array.isArray(acc.tag)) {
          matchesTag = acc.tag.some(t => t.trim().toLowerCase() === selectedTag.toLowerCase());
        } else if (typeof acc.tag === 'string') {
          matchesTag = acc.tag.toLowerCase().includes(selectedTag.toLowerCase());
        } else {
          matchesTag = false;
        }
      }

      return matchesSearch && matchesFilter && matchesTag;
    });

    if (filter === 'High Interest') {
      // Sort by interest rate descending
      const sorted = [...result].sort((a, b) => (Number(b.interestRate) || 0) - (Number(a.interestRate) || 0));
      if (sorted.length > 0) {
        // Find the 5th highest account's interest rate (or the lowest if < 5 accounts)
        const thresholdAccount = sorted[Math.min(4, sorted.length - 1)];
        const thresholdRate = Number(thresholdAccount.interestRate) || 0;
        // Include all accounts that have at least this interest rate (handles ties)
        result = sorted.filter(a => (Number(a.interestRate) || 0) >= thresholdRate);
      }
    }

    return result;
  }, [accounts, search, filter, selectedTag]);

  const handleGetAiAdvice = async () => {
    setLoadingAi(true);
    const prompt = `Based on these bank accounts: ${JSON.stringify(accounts)}, which one should I choose if I want high interest and low fees? Explain why.`;
    const advice = await getFinancialAdvice(prompt);
    setAiAdvice(advice);
    setLoadingAi(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Summoning account details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Account Suggestor</h2>
          <p className="text-slate-500">Compare the best savings accounts tailored to your needs.</p>
        </div>
        <button
          onClick={handleGetAiAdvice}
          disabled={loadingAi}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 disabled:opacity-50"
        >
          <Wallet size={20} />
          {loadingAi ? 'Consulting Wizard...' : 'Ask Wealth Wizard'}
        </button>
      </div>

      {aiAdvice && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl relative overflow-hidden"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shrink-0">
              <Wallet size={20} />
            </div>
            <div>
              <h4 className="font-bold text-indigo-900 mb-2">Wizard's Recommendation</h4>
              <p className="text-indigo-800 leading-relaxed whitespace-pre-wrap">{aiAdvice}</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search banks or account names..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-xl overflow-x-auto">
            {(['All', 'High Interest', 'Zero Balance'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  filter === f ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filter === 'All' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-sm font-medium text-slate-500 whitespace-nowrap mr-2">Categories:</span>
            {['All', ...ALLOWED_CATEGORIES].map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border",
                  selectedTag === tag 
                    ? "bg-indigo-100 text-indigo-700 border-indigo-200" 
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAccounts.map((acc) => (
          <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            key={acc.id}
            className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{acc.bankName}</h3>
                {acc.accountName && (
                  <p className="text-slate-600 font-medium mb-2">{acc.accountName}</p>
                )}
                <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{acc.accountType}</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-600">{acc.interestRate}%</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Interest p.a.</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 mb-1">Compounding</div>
                <div className="font-semibold">{acc.compounding}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 mb-1">Min. Balance</div>
                <div className="font-semibold">₹{acc.minBalance.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 mb-1">Debit Card Fee</div>
                <div className="font-semibold">₹{acc.debitCardFees}/yr</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 mb-1">Other Charges</div>
                <div className="font-semibold text-sm">{acc.otherCharges}</div>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <div className="text-sm font-bold text-slate-700">Key Benefits</div>
              {acc.benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
              Apply Now <ArrowUpRight size={18} />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
