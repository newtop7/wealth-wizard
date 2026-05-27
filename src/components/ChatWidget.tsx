import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Sparkles, User, HelpCircle, ArrowRight } from 'lucide-react';
import { getFinancialAdvice } from '../services/gemini';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  { text: "💳 Best Cashback Credit Cards?", label: "Cashback" },
  { text: "📈 Highest FD Interest Rates?", label: "Fixed Deposits" },
  { text: "💰 Zero Balance Savings Accounts?", label: "Savings" },
];

function FormattedMessage({ content, isUser = false }: { content: string; isUser?: boolean }) {
  const lines = content.split('\n');

  const parseBold = (text: string) => {
    const parts = text.split('**');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // Highlight financial rates, bank names, or currencies automatically
        const isFinHighlight = /₹|\d+(\.\d+)?%|lakh|crore|hdfc|icici|sbi|axis|amex|rupay/i.test(part);
        return (
          <strong 
            key={index} 
            className={cn(
              isUser ? "font-extrabold text-white" : "font-bold text-slate-900 transition-colors",
              isFinHighlight && (isUser 
                ? "bg-white/20 text-white px-1 py-0.5 rounded text-[11px] font-extrabold shadow-sm border border-white/20" 
                : "bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded text-[11px] font-extrabold shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-indigo-100/50")
            )}
          >
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className={cn(
      "space-y-1.5 text-xs leading-relaxed",
      isUser ? "text-indigo-50" : "text-slate-700"
    )}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Detect Subheaders / Item Headers
        if (trimmed.startsWith('###') || trimmed.startsWith('##') || trimmed.startsWith('#')) {
          const cleanText = trimmed.replace(/^#+\s*/, '');
          return (
            <h4 key={idx} className={cn(
              "font-bold pt-1 mt-2 mb-1 text-xs uppercase tracking-wider flex items-center gap-1.5",
              isUser ? "text-white" : "text-indigo-800"
            )}>
              <span className={cn("w-1 h-3 rounded-full", isUser ? "bg-white" : "bg-indigo-500")} />
              {parseBold(cleanText)}
            </h4>
          );
        }

        // Detect Bullet list items (using - or * or •)
        const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ');
        if (isBullet) {
          const cleanText = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1 my-0.5">
              <span className={cn("font-extrabold shrink-0 select-none mt-0.5 text-[10px]", isUser ? "text-indigo-200" : "text-indigo-500")}>✦</span>
              <span className="flex-1">{parseBold(cleanText)}</span>
            </div>
          );
        }

        // Detect Numbered List items (e.g. 1. or 2.)
        const isNumbered = /^\d+\.\s/.test(trimmed);
        if (isNumbered) {
          const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
          if (numMatch) {
            const num = numMatch[1];
            const text = numMatch[2];
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1 my-0.5">
                <span className={cn(
                  "w-3.5 h-3.5 font-extrabold text-[9px] flex items-center justify-center rounded-md shrink-0 select-none mt-0.5 border",
                  isUser 
                    ? "bg-white/10 border-white/10 text-white" 
                    : "bg-indigo-50 border-indigo-100 text-indigo-600"
                )}>
                  {num}
                </span>
                <span className="flex-1">{parseBold(text)}</span>
              </div>
            );
          }
        }

        // Normal text line
        return (
          <p key={idx} className={isUser ? "text-indigo-50" : "text-slate-600"}>
            {parseBold(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm the **Wealth Wizard**, your personal smart finance assistant.\n\nAsk me anything about credit card rewards, maximizing points, FD yield strategies, or high-yield savings accounts!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (messageText?: string) => {
    const finalInput = (messageText || input).trim();
    if (!finalInput || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: finalInput
    };

    setMessages(prev => [...prev, userMessage]);
    if (!messageText) setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => `${m.role === 'user' ? 'User' : 'Wealth Wizard'}: ${m.content}`).join('\n');
      const prompt = `You are the "Wealth Wizard", a helpful and knowledgeable financial AI assistant for an Indian personal finance app. 
      You help users with questions about credit cards, fixed deposits, and bank accounts in India.
      Keep your answers concise, friendly, and easy to understand.
      
      Conversation history:
      ${history}
      User: ${userMessage.content}
      Wealth Wizard:`;

      const response = await getFinancialAdvice(prompt);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting to my crystal ball right now. Please try again later."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center z-40 transition-transform ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageSquare size={24} />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="fixed bottom-6 right-6 w-[360px] sm:w-[420px] h-[550px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white p-4 flex items-center justify-between shadow-md relative shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center text-white border border-white/15">
                    <Sparkles size={20} className="text-violet-200 animate-pulse" />
                  </div>
                  {/* Glowing active indicator */}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-indigo-600 rounded-full shadow-sm animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                    Wealth Wizard
                  </h3>
                  <p className="text-[10px] text-indigo-200 font-medium">Online Advisor • Ready to help</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-100 text-purple-600'}`}>
                      {msg.role === 'user' ? <User size={15} /> : <Sparkles size={15} />}
                    </div>
                    <div 
                      className={cn(
                        "p-3.5 rounded-2xl text-[13px] shadow-sm border",
                        msg.role === 'user' 
                          ? 'bg-indigo-600 border-indigo-700 text-white rounded-tr-none font-medium' 
                          : 'bg-white border-slate-100 text-slate-700 rounded-tl-none'
                      )}
                    >
                      <FormattedMessage content={msg.content} isUser={msg.role === 'user'} />
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2.5 max-w-[85%]">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 text-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                      <Sparkles size={15} className="animate-spin" />
                    </div>
                    <div className="px-4 py-3 bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1 w-16 justify-center">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-1.5 whitespace-nowrap overflow-x-auto scrollbar-none shrink-0">
              {SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(sug.text)}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-indigo-50 active:bg-indigo-100 border border-slate-200 hover:border-indigo-200 rounded-full text-[10px] font-bold text-slate-600 hover:text-indigo-600 cursor-pointer shadow-sm transition-all disabled:opacity-50"
                >
                  {sug.text}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
              <div className="relative flex items-center">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a financial question..."
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none h-[48px] text-xs leading-relaxed"
                  rows={1}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2.5 w-8 h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-200 disabled:opacity-40 disabled:shadow-none"
                >
                  <Send size={14} />
                </button>
              </div>
              <div className="text-center mt-2.5">
                <span className="text-[9px] text-slate-400 font-medium">Verify rates and credentials independently. Always save water, spend smart.</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
