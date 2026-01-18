
import React, { useState, useRef, useEffect } from 'react';
import { AdminAIService } from '../services/geminiService';

interface AdminBotProps {
  appState: any;
  onAutoAction?: (type: 'support' | 'broadcast' | 'rates', data?: any) => void;
}

const AdminBot: React.FC<AdminBotProps> = ({ appState, onAutoAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: 'Admin Protocol Eotkzip881 Initialized. System active.' }
  ]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const aiService = new AdminAIService();

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSend = async () => {
    if (!query.trim()) return;
    const userMsg = query;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setQuery('');
    setLoading(true);

    const response = await aiService.getAdminGuidance(userMsg, appState);
    setMessages(prev => [...prev, { role: 'bot', text: response || 'Neural link failed. Terminal retry required.' }]);
    setLoading(false);
  };

  return (
    <div className="fixed bottom-24 right-4 z-[200] flex flex-col items-end gap-3">
      {isOpen && (
        <div className="w-[300px] bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-200 flex flex-col overflow-hidden max-h-[60vh] animate-in slide-in-from-bottom-5">
          <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="font-black tracking-tight text-[8px] uppercase">Eotkzip Command</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white text-xs"><i className="fas fa-times"></i></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 scrollbar-hide">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-3 rounded-2xl text-[10px] leading-relaxed font-bold shadow-sm border ${
                  m.role === 'user' ? 'bg-blue-600 text-white border-blue-500' : 'bg-white text-slate-800 border-slate-100'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100 flex gap-1">
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 border-t border-slate-100 bg-white">
            <div className="flex gap-1.5">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Query..."
                className="flex-1 bg-slate-100 border-none rounded-xl px-3 py-2 text-[10px] focus:ring-1 focus:ring-blue-500 transition-all font-bold"
              />
              <button onClick={handleSend} disabled={loading} className="bg-slate-900 text-white w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-50 shadow-md"><i className="fas fa-location-arrow text-xs"></i></button>
            </div>
          </div>
        </div>
      )}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-900 text-white w-12 h-12 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform ring-2 ring-white relative group"
      >
        <div className="absolute inset-0 bg-blue-600 rounded-full opacity-0 group-hover:opacity-20 animate-ping"></div>
        <i className={`fas ${isOpen ? 'fa-minus' : 'fa-brain'} text-xl`}></i>
      </button>
    </div>
  );
};

export default AdminBot;
