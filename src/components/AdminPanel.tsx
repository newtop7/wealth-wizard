import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Database, Plus, Edit2, Trash2, X, Save, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

type Tab = 'accounts' | 'cards' | 'fds';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  const [activeTab, setActiveTab] = useState<Tab>('cards');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Incorrect password. Try "admin123"');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/${activeTab}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setLoginError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, activeTab]);

  const handleOpenModal = (item?: any) => {
    setJsonError('');
    if (item) {
      setEditingItem(item);
      // Remove _id and __v so they aren't accidentally modified by the user
      const { _id, __v, ...rest } = item;
      setJsonInput(JSON.stringify(rest, null, 2));
    } else {
      setEditingItem(null);
      
      // Provide helpful templates based on the active tab
      let template = {};
      if (activeTab === 'cards') {
        template = {
          cardName: "Example Card",
          bankName: "Example Bank",
          category: ["Travel", "Shopping"],
          network: "Visa",
          rewardType: "Cashback",
          fees: {
            joiningFee: 500,
            annualFee: 500,
            renewalWaiver: {
              threshold: 100000,
              description: "Waived on annual spend of ₹1 Lakh"
            }
          },
          totalSavings: [
            {
              category: "Travel",
              value: 5,
              unit: "%",
              capLimit: 1000
            }
          ],
          cardTip: "Best for frequent travelers."
        };
      } else if (activeTab === 'accounts') {
        template = {
          bankName: "Example Bank",
          accountName: "Example Savings Account",
          accountType: "Savings",
          interestRate: 4.0,
          compounding: "Quarterly",
          minBalance: 10000,
          debitCardFees: 500,
          benefits: ["Free airport lounge access", "Zero cross-currency markup"],
          tag: ["High Interest", "Premium"]
        };
      } else if (activeTab === 'fds') {
        template = {
          bankName: "Example Bank",
          tenureRange: "1 Year to < 2 Years",
          interestRate: 7.1,
          seniorCitizenRate: 7.6,
          minAmount: 10000
        };
      }
      
      setJsonInput(JSON.stringify(template, null, 2));
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      setJsonError('');
      const parsedData = JSON.parse(jsonInput);
      
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem ? `/api/${activeTab}/${editingItem._id}` : `/api/${activeTab}`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedData)
      });
      
      if (!res.ok) throw new Error('Failed to save');
      
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON or server error');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    
    try {
      const res = await fetch(`/api/${activeTab}/${deleteConfirmId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      fetchData();
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete item');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Admin Access</h1>
          <p className="text-slate-500 mb-6">Enter the admin password to manage datasets.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {loginError && <p className="text-red-500 text-sm text-left">{loginError}</p>}
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              Login
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Database className="text-indigo-600" size={32} />
            Dataset Manager
          </h1>
          <p className="text-slate-600 mt-2">Create, update, and delete application data directly in the database.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Add New Record
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 pb-px overflow-x-auto hide-scrollbar">
        {(['cards', 'accounts', 'fds'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-3 font-medium text-sm capitalize transition-colors border-b-2 whitespace-nowrap",
              activeTab === tab 
                ? "border-indigo-600 text-indigo-600" 
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            {tab === 'fds' ? 'Fixed Deposits' : tab}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <RefreshCw className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-medium text-slate-600 text-sm">ID</th>
                  <th className="p-4 font-medium text-slate-600 text-sm">Name / Title</th>
                  <th className="p-4 font-medium text-slate-600 text-sm">Bank</th>
                  <th className="p-4 font-medium text-slate-600 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">No records found.</td>
                  </tr>
                ) : (
                  data.map(item => (
                    <tr key={item._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-sm text-slate-500 font-mono">{item._id.slice(-6)}</td>
                      <td className="p-4 font-medium text-slate-900">
                        {item.cardName || item.accountName || `${item.tenureRange} FD`}
                      </td>
                      <td className="p-4 text-slate-600">{item.bankName || '-'}</td>
                      <td className="p-4 text-right space-x-2">
                        <button 
                          onClick={() => handleOpenModal(item)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-block"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(item._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-block"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* JSON Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">
                {editingItem ? 'Edit Record' : 'Add New Record'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-hidden flex flex-col">
              <p className="text-sm text-slate-500 mb-2">
                Edit the JSON data below. Make sure it matches the schema for <strong>{activeTab}</strong>.
              </p>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full flex-1 p-4 font-mono text-sm bg-slate-900 text-emerald-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                spellCheck="false"
              />
              {jsonError && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                  {jsonError}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-2"
              >
                <Save size={18} />
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Record?</h3>
              <p className="text-slate-500 mb-6">
                Are you sure you want to delete this record? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 px-4 py-3 bg-red-600 text-white font-medium hover:bg-red-700 rounded-xl transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
