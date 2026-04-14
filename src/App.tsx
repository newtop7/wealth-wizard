import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, CreditCard as CardIcon, TrendingUp, Sparkles, Menu, X, ChevronRight, ArrowRightLeft, Home } from 'lucide-react';
import { cn } from './lib/utils';
import AccountSuggestor from './components/AccountSuggestor';
import CreditCardSuggestor from './components/CreditCardSuggestor';
import FDSuggestor from './components/FDSuggestor';
import CardComparison from './components/CardComparison';

function NavLink({ to, children, icon: Icon }: { to: string; children: React.ReactNode; icon: any }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200",
        isActive 
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
          : "text-slate-600 hover:bg-slate-100"
      )}
    >
      <Icon size={18} />
      <span className="font-medium">{children}</span>
    </Link>
  );
}

function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-semibold mb-6">
          <Sparkles size={16} />
          <span>AI-Powered Financial Guidance</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight">
          Master Your Money with <span className="text-indigo-600">Wealth Wizard</span>
        </h1>
        <p className="text-xl text-slate-600 mb-10 leading-relaxed">
          The ultimate companion for your financial journey. Compare accounts, find the best credit cards, and optimize your savings with precision.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mx-auto">
          {[
            { to: '/accounts', title: 'Account Suggestor', icon: Wallet, color: 'bg-blue-500', desc: 'Find high-interest savings accounts' },
            { to: '/cards', title: 'Card Suggestor', icon: CardIcon, color: 'bg-purple-500', desc: 'Best rewards for your lifestyle' },
            { to: '/compare', title: 'Card Comparison', icon: ArrowRightLeft, color: 'bg-indigo-500', desc: 'Compare savings based on your spends' },
            { to: '/fd', title: 'FD Optimizer', icon: TrendingUp, color: 'bg-emerald-500', desc: 'Maximize your fixed deposit returns' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group relative p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 text-left overflow-hidden"
            >
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 transition-transform group-hover:scale-110", item.color)}>
                <item.icon size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-500 mb-4">{item.desc}</p>
              <div className="flex items-center text-indigo-600 font-semibold text-sm">
                Get Started <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-bottom border-slate-200">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Sparkles size={24} />
              </div>
              <span className="text-xl font-bold tracking-tight">Wealth Wizard</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-2">
              <NavLink to="/" icon={Home}>Home</NavLink>
              <NavLink to="/accounts" icon={Wallet}>Accounts</NavLink>
              <NavLink to="/cards" icon={CardIcon}>Cards</NavLink>
              <NavLink to="/compare" icon={ArrowRightLeft}>Compare</NavLink>
              <NavLink to="/fd" icon={TrendingUp}>Fixed Deposits</NavLink>
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 text-slate-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Nav */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-2"
              >
                <Link to="/" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 rounded-xl bg-slate-50 font-medium">Home</Link>
                <Link to="/accounts" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 rounded-xl bg-slate-50 font-medium">Accounts</Link>
                <Link to="/cards" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 rounded-xl bg-slate-50 font-medium">Cards</Link>
                <Link to="/compare" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 rounded-xl bg-slate-50 font-medium">Compare</Link>
                <Link to="/fd" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 rounded-xl bg-slate-50 font-medium">Fixed Deposits</Link>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/accounts" element={<AccountSuggestor />} />
            <Route path="/cards" element={<CreditCardSuggestor />} />
            <Route path="/compare" element={<CardComparison />} />
            <Route path="/fd" element={<FDSuggestor />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 py-12 bg-white mt-20">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <Sparkles className="text-indigo-600" size={20} />
              <span className="font-bold">Wealth Wizard</span>
            </div>
            <p className="text-slate-500 text-sm">
              © 2026 Wealth Wizard. AI-powered financial intelligence.
            </p>
            <div className="flex gap-6 text-sm font-medium text-slate-600">
              <Link to="/admin" className="hover:text-indigo-600">Admin</Link>
              <a href="#" className="hover:text-indigo-600">Privacy</a>
              <a href="#" className="hover:text-indigo-600">Terms</a>
              <a href="#" className="hover:text-indigo-600">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
