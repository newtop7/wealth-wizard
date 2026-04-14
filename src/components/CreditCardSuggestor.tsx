import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CreditCard as CardIcon, Search, Star, ArrowUpRight, CheckCircle2, Zap, Globe, ShieldCheck, ArrowRightLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { getFinancialAdvice } from '../services/gemini';
import { CreditCard } from '../types';

export default function CreditCardSuggestor() {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Cashback' | 'Miles' | 'Points' | 'Lifetime Free'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('All');
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      fetch('/api/cards')
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data)) {
            setCreditCards(data);
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const ALLOWED_CATEGORIES = ['Travel', 'Shopping', 'Fuel', 'Food', 'Offline Expenses', 'Premium', 'Movies'];
  const ALLOWED_NETWORKS = ['RuPay', 'Amex', 'Mastercard', 'Visa'];

  const filteredCards = useMemo(() => {
    return creditCards.filter(card => {
      const matchesSearch = card.cardName.toLowerCase().includes(search.toLowerCase()) || 
                           card.bankName.toLowerCase().includes(search.toLowerCase());
      
      const annualFee = card.fees?.annualFee ?? card.annualFee ?? 0;
      const matchesFilter = filter === 'All' || 
                            (filter === 'Lifetime Free' ? Number(annualFee) === 0 : card.rewardType === filter);
      
      let matchesCategory = true;
      let matchesNetwork = true;

      if (filter === 'All') {
        if (selectedCategory !== 'All') {
          if (Array.isArray(card.category)) {
            matchesCategory = card.category.some(c => c.trim().toLowerCase() === selectedCategory.toLowerCase());
          } else {
            matchesCategory = false;
          }
        }

        if (selectedNetwork !== 'All') {
          if (Array.isArray(card.network)) {
            matchesNetwork = card.network.some(n => n.toLowerCase() === selectedNetwork.toLowerCase());
          } else {
            matchesNetwork = (card.network || '').toLowerCase() === selectedNetwork.toLowerCase();
          }
        }
      }

      return matchesSearch && matchesFilter && matchesCategory && matchesNetwork;
    });
  }, [creditCards, search, filter, selectedCategory, selectedNetwork]);

  const handleGetAiAdvice = async () => {
    setLoadingAi(true);
    const prompt = `Based on these credit cards: ${JSON.stringify(creditCards)}, which one is best for someone who travels a lot but hates annual fees? If none fit perfectly, suggest the closest one.`;
    const advice = await getFinancialAdvice(prompt);
    setAiAdvice(advice);
    setLoadingAi(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Fetching the best cards for you...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Credit Card Suggestor</h2>
          <p className="text-slate-500">Discover cards that reward your lifestyle and spending habits.</p>
        </div>
        <button
          onClick={handleGetAiAdvice}
          disabled={loadingAi}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-100 disabled:opacity-50"
        >
          <Zap size={20} />
          {loadingAi ? 'Consulting Wizard...' : 'Ask Wealth Wizard'}
        </button>
      </div>

      {aiAdvice && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-purple-50 border border-purple-100 rounded-2xl"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white shrink-0">
              <Star size={20} />
            </div>
            <div>
              <h4 className="font-bold text-purple-900 mb-2">Wizard's Pick</h4>
              <p className="text-purple-800 leading-relaxed whitespace-pre-wrap">{aiAdvice}</p>
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
              placeholder="Search cards or banks..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-xl overflow-x-auto">
            {(['All', 'Cashback', 'Miles', 'Points', 'Lifetime Free'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  filter === f ? "bg-purple-600 text-white" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filter === 'All' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-sm font-medium text-slate-500 whitespace-nowrap mr-2">Categories:</span>
              {['All', ...ALLOWED_CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border",
                    selectedCategory === cat 
                      ? "bg-purple-100 text-purple-700 border-purple-200" 
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <span className="text-sm font-medium text-slate-500 whitespace-nowrap mr-2">Network:</span>
              {['All', ...ALLOWED_NETWORKS].map((net) => (
                <button
                  key={net}
                  onClick={() => setSelectedNetwork(net)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border",
                    selectedNetwork === net 
                      ? "bg-purple-100 text-purple-700 border-purple-200" 
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {net}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCards.map((card) => (
          <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={card.id}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all group"
          >
            <div className="h-48 bg-gradient-to-br from-slate-800 to-slate-950 p-6 flex flex-col justify-between relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <CardIcon size={120} />
              </div>
              <div className="flex justify-between items-start relative z-10">
                <div className="text-white/60 text-xs font-bold uppercase tracking-widest">{card.bankName}</div>
                <div className="flex gap-2 flex-wrap justify-end max-w-[60%]">
                  {card.network && (
                    Array.isArray(card.network) ? (
                      card.network.map((net, i) => (
                        <div key={i} className="bg-white/10 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white font-bold uppercase tracking-wider">
                          {net}
                        </div>
                      ))
                    ) : (
                      <div className="bg-white/10 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white font-bold uppercase tracking-wider">
                        {card.network}
                      </div>
                    )
                  )}
                  <div className="bg-white/10 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white font-bold uppercase tracking-wider">
                    {card.rewardType}
                  </div>
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-1">{card.cardName}</h3>
                {card.bestFor && <div className="text-white/60 text-sm italic">Best for {card.bestFor}</div>}
                {card.category && card.category.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {card.category.map((cat, i) => (
                      <span key={i} className="text-[10px] text-purple-200 bg-purple-900/50 px-2 py-0.5 rounded-full">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-400 uppercase font-bold mb-1">Annual Fee</div>
                  <div className="font-bold text-slate-900">₹{(card.fees?.annualFee ?? card.annualFee ?? 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase font-bold mb-1">Joining Fee</div>
                  <div className="font-bold text-slate-900">₹{(card.fees?.joiningFee ?? card.joiningFee ?? 0).toLocaleString()}</div>
                </div>
              </div>

              {card.fees?.renewalWaiver && (
                <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                  <span className="font-bold text-slate-700">Waiver:</span> {card.fees.renewalWaiver.description}
                </div>
              )}

              {card.forexCharges && (
                <div className="flex items-start gap-2 text-sm text-slate-600 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                  <Globe size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800 block mb-0.5">Forex Markup: {card.forexCharges.markupPercentage}%</strong>
                    <span className="text-xs text-slate-500">{card.forexCharges.description}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-xs text-slate-400 uppercase font-bold">Top Benefits</div>
                {card.rewards?.welcomeBenefit && card.rewards.welcomeBenefit !== "N/A" && !card.rewards.welcomeBenefit.startsWith("N/A") && (
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 size={16} className="text-purple-500 shrink-0 mt-0.5" />
                    <span><strong className="text-slate-800">Welcome:</strong> {card.rewards.welcomeBenefit}</span>
                  </div>
                )}
                {(card.rewards?.benefits?.base || card.rewards?.rate?.base) && (
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 size={16} className="text-purple-500 shrink-0 mt-0.5" />
                    <span><strong className="text-slate-800">Base Reward:</strong> {card.rewards?.benefits?.base || card.rewards?.rate?.base}</span>
                  </div>
                )}
                {(card.rewards?.benefits?.accelerated || card.rewards?.rate?.accelerated) && (
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 size={16} className="text-purple-500 shrink-0 mt-0.5" />
                    <span><strong className="text-slate-800">Accelerated:</strong> {card.rewards?.benefits?.accelerated || card.rewards?.rate?.accelerated}</span>
                  </div>
                )}
                {card.rewards?.capping?.earning && (
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 size={16} className="text-purple-500 shrink-0 mt-0.5" />
                    <span><strong className="text-slate-800">Earning Cap:</strong> {card.rewards.capping.earning}</span>
                  </div>
                )}
                {card.rewards?.capping?.redemption && (
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 size={16} className="text-purple-500 shrink-0 mt-0.5" />
                    <span><strong className="text-slate-800">Redemption:</strong> {card.rewards.capping.redemption}</span>
                  </div>
                )}
                {card.benefits && card.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 size={16} className="text-purple-500 shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              {card.eligibility && (
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase font-bold">
                    <ShieldCheck size={14} /> Eligibility Criteria
                  </div>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                    {card.eligibility.minCibil && (
                      <div>
                        <div className="text-xs text-slate-400 mb-0.5">Min CIBIL</div>
                        <strong className="text-slate-800">{card.eligibility.minCibil}</strong>
                      </div>
                    )}
                    {card.eligibility.minIncome && (
                      <div>
                        <div className="text-xs text-slate-400 mb-0.5">Min Income</div>
                        <strong className="text-slate-800">₹{(card.eligibility.minIncome).toLocaleString()}</strong>
                      </div>
                    )}
                    {card.eligibility.age && (
                      <div>
                        <div className="text-xs text-slate-400 mb-0.5">Age Range</div>
                        <strong className="text-slate-800">{card.eligibility.age.min} - {card.eligibility.age.max} yrs</strong>
                      </div>
                    )}
                    {card.eligibility.employment && card.eligibility.employment.length > 0 && (
                      <div className="col-span-2">
                        <div className="text-xs text-slate-400 mb-0.5">Employment Type</div>
                        <strong className="text-slate-800">{card.eligibility.employment.join(', ')}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {card.cardTip && (
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-sm text-amber-800">
                  <strong className="block mb-1 text-amber-900">💡 Pro Tip</strong>
                  {card.cardTip}
                </div>
              )}

              <Link to="/compare" className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                Compare <ArrowRightLeft size={18} />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
