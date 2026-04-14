import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { CreditCard as CardIcon, ArrowRightLeft, Plus, X, Calculator, IndianRupee, Search } from 'lucide-react';
import { CreditCard } from '../types';
import { cn } from '../lib/utils';

const CATEGORIES = ['Travel', 'Shopping', 'Fuel', 'Food', 'Offline Expenses', 'Premium', 'Movies'];

export default function CardComparison() {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<Record<string, number>>(
    CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {})
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetch('/api/cards')
      .then(res => res.json())
      .then(data => {
        setCreditCards(data);
        // Pre-select first two cards if available
        if (data.length >= 2) {
          setSelectedCardIds([data[0]._id || data[0].id, data[1]._id || data[1].id]);
        }
      })
      .catch(err => console.error("Failed to fetch cards:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleExpenseChange = (category: string, value: number) => {
    setExpenses(prev => ({ ...prev, [category]: value }));
  };

  const toggleCardSelection = (id: string) => {
    if (selectedCardIds.includes(id)) {
      if (selectedCardIds.length > 2) {
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
    // Stable random selection based on first 10 to avoid jumping on every render
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
    
    // Ensure selected cards are always visible in the selector
    const selectedSet = new Set(result.map(c => (c as any)._id || c.id));
    const missingSelected = creditCards.filter(c => 
      selectedCardIds.includes((c as any)._id || c.id) && !selectedSet.has((c as any)._id || c.id)
    );
    
    return [...missingSelected, ...result];
  }, [debouncedSearchTerm, randomCards, creditCards, selectedCardIds]);

  const calculateSavings = (card: CreditCard) => {
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
          saving = savingRule.value; // Assuming flat per month if expense > 0
        } else if (savingRule.unit === 'Points') {
          // Simplification: assume 1 point = 0.25 Rs if not specified, 
          // but usually value is the % equivalent or points multiplier.
          // Let's assume 'value' is the effective cashback percentage for simplicity if it's points.
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-4 flex items-center justify-center gap-3">
          <ArrowRightLeft className="text-purple-600" size={32} />
          Card Comparison Calculator
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Compare up to 6 cards side-by-side. Enter your monthly expenses to see exactly how much you can save with each card based on their specific cashback rates and caps.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar: Expense Inputs */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit lg:sticky lg:top-24 z-10">
          <div className="flex items-center gap-2 mb-6 text-lg font-bold text-slate-800">
            <Calculator size={20} className="text-purple-600" />
            Monthly Expenses
          </div>
          
          <div className="space-y-4">
            {CATEGORIES.map(category => (
              <div key={category}>
                <div className="flex justify-between mb-1">
                  <label className="text-sm font-medium text-slate-700">{category}</label>
                  <span className="text-sm font-bold text-purple-600">₹{(expenses[category] || 0).toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100000"
                  step="500"
                  value={expenses[category] || 0}
                  onChange={(e) => handleExpenseChange(category, Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="text-sm text-slate-500 mb-2">Total Monthly Spends</div>
            <div className="text-2xl font-bold text-slate-900">
              ₹{Object.values(expenses).reduce((a: number, b: number) => a + b, 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Right Area: Card Selection & Comparison */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Card Selector */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800">Select Cards to Compare ({selectedCardIds.length}/6)</h3>
              <span className="text-xs text-slate-500">Min 2, Max 6</span>
            </div>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by card or bank name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {displayedCards.map(card => {
                const id = (card as any)._id || card.id;
                const isSelected = selectedCardIds.includes(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggleCardSelection(id)}
                    disabled={!isSelected && selectedCardIds.length >= 6}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border",
                      isSelected 
                        ? "bg-purple-50 border-purple-200 text-purple-700" 
                        : "bg-white border-slate-200 text-slate-600 hover:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {isSelected ? <X size={14} /> : <Plus size={14} />}
                    {card.cardName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {selectedCards.map(card => {
              const { total, breakdown } = calculateSavings(card);
              const annualFee = card.fees?.annualFee ?? (card as any).annualFee ?? 0;
              const netYearlySavings = (total * 12) - annualFee;

              return (
                <motion.div
                  key={(card as any)._id || card.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="p-5 bg-gradient-to-br from-slate-800 to-slate-900 text-white relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <CardIcon size={64} />
                    </div>
                    <div className="text-xs text-white/60 font-bold uppercase tracking-wider mb-1">{card.bankName}</div>
                    <h3 className="text-lg font-bold mb-4 relative z-10">{card.cardName}</h3>
                    
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                      <div className="text-white/80 text-sm mb-1">Estimated Monthly Savings</div>
                      <div className="text-3xl font-bold text-emerald-400 flex items-center">
                        <IndianRupee size={24} className="mr-1" />
                        {total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="space-y-3 mb-6 flex-1">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Savings Breakdown</div>
                      {Object.entries(breakdown).map(([cat, amount]) => (
                        <div key={cat} className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">{cat}</span>
                          <span className="font-semibold text-emerald-600">+₹{amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                      ))}
                      {Object.keys(breakdown).length === 0 && (
                        <div className="text-sm text-slate-400 italic">No savings in selected categories.</div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Yearly Savings (12x)</span>
                        <span className="font-semibold text-slate-800">₹{(total * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Annual Fee</span>
                        <span className="font-semibold text-red-500">-₹{annualFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-base pt-2 border-t border-slate-100">
                        <span className="font-bold text-slate-800">Net Yearly Benefit</span>
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
      </div>
    </div>
  );
}
