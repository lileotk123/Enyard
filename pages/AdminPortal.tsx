
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, TaskOffer, ApprovalRequest, SupportMessage, GlobalConfig, AdCampaign, ChatMessage } from '../types';
import { ADMIN_PASSWORD } from '../constants';
import AdminBot from '../components/AdminBot';

interface AdminPortalProps {
  onExit: () => void;
  globalConfig: GlobalConfig;
  setGlobalConfig: React.Dispatch<React.SetStateAction<GlobalConfig>>;
  users: User[]; setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  approvals: ApprovalRequest[]; setApprovals: React.Dispatch<React.SetStateAction<ApprovalRequest[]>>;
  tasks: TaskOffer[]; setTasks: React.Dispatch<React.SetStateAction<TaskOffer[]>>;
  support: SupportMessage[]; setSupport: React.Dispatch<React.SetStateAction<SupportMessage[]>>;
  chatMessages: ChatMessage[]; setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ 
  onExit, globalConfig, setGlobalConfig,
  users, setUsers,
  approvals, setApprovals, tasks, setTasks,
  support, setSupport,
  chatMessages, setChatMessages
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [activeTab, setActiveTab] = useState<'insights' | 'users' | 'approvals' | 'tasks' | 'support' | 'ads' | 'community'>('insights');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Advanced Filter States
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'frozen' | 'banned'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin' | 'creator'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'balanceHigh' | 'balanceLow'>('newest');

  // Quick Action States
  const [depositInputs, setDepositInputs] = useState<{[key: string]: string}>({});
  const [newBroadcast, setNewBroadcast] = useState('');
  const [editGhsDepositRate, setEditGhsDepositRate] = useState(globalConfig.ghsDepositRate);
  const [editDailyBoost, setEditDailyBoost] = useState(globalConfig.dailyInterestRate);
  
  // Modals
  const [showQuickBroadcast, setShowQuickBroadcast] = useState(false);
  const [showQuickRates, setShowQuickRates] = useState(false);

  // Task Creation
  const [newOfferTitle, setNewOfferTitle] = useState('');
  const [newOfferDesc, setNewOfferDesc] = useState('');
  const [newOfferLink, setNewOfferLink] = useState('');
  const [newOfferReward, setNewOfferReward] = useState('0.10');
  const [newOfferMax, setNewOfferMax] = useState('100');

  // Ad Management
  const [adTitle, setAdTitle] = useState(globalConfig.activeAd?.title || '');
  const [adContent, setAdContent] = useState(globalConfig.activeAd?.content || '');
  const [adCta, setAdCta] = useState(globalConfig.activeAd?.ctaText || 'Check it out');
  const [adReward, setAdReward] = useState(globalConfig.activeAd?.rewardAmount || 0);
  const [isAdActive, setIsAdActive] = useState(globalConfig.activeAd?.isActive || false);

  // Support
  const [replyText, setReplyText] = useState<{[key: string]: string}>({});

  // Chat
  const chatScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if(activeTab === 'community') chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, activeTab]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert("Access Denied. Incorrect Protocol Key.");
    }
  };

  const handleUpdateRates = () => {
    setGlobalConfig(prev => ({ ...prev, ghsDepositRate: editGhsDepositRate, dailyInterestRate: editDailyBoost }));
    setShowQuickRates(false);
    alert("Synced.");
  };

  const handleMaintenanceToggle = () => {
    setGlobalConfig(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }));
  };

  const handleUpdateAd = () => {
    const newAd: AdCampaign = {
      id: 'ad-' + Date.now(),
      title: adTitle,
      content: adContent,
      ctaText: adCta,
      rewardAmount: adReward,
      isActive: isAdActive
    };
    setGlobalConfig(prev => ({ ...prev, activeAd: newAd }));
    alert("Campaign Published Successfully.");
  };

  const handleBroadcastSignal = () => {
    if (!newBroadcast.trim()) return;
    setGlobalConfig(prev => ({ ...prev, notifications: [newBroadcast, ...prev.notifications] }));
    setNewBroadcast('');
    setShowQuickBroadcast(false);
    alert("Transmitted.");
  };

  const executeDeposit = (userId: string, customAmount?: number) => {
    const amount = customAmount || parseFloat(depositInputs[userId] || '0');
    if (amount < 0.1) return alert("Invalid Amount");
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, walletBalance: (u.walletBalance || 0) + amount, targetedNotifications: [...(u.targetedNotifications || []), `Funded (Admin): $${amount.toFixed(2)}.`] } : u));
    setDepositInputs(prev => ({ ...prev, [userId]: '' }));
    if (!customAmount) alert(`Added $${amount.toFixed(2)}.`);
  };

  const toggleFreeze = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isFrozen: !u.isFrozen } : u));
  };

  const strikeUser = (userId: string) => {
    const userToStrike = users.find(u => u.id === userId);
    if (!userToStrike) return;
    const confirmStrike = window.confirm(`Initiate protocol strike on ${userToStrike.name}?`);
    if (confirmStrike) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBanned: !u.isBanned } : u));
      alert(userToStrike.isBanned ? "Node Reinstated." : "Strike Successful.");
    }
  };

  const handleApprove = (id: string) => {
    const req = approvals.find(r => r.id === id);
    if (!req) return;
    
    if (req.type === 'deposit') {
        setUsers(prev => {
            const userIndex = prev.findIndex(u => u.id === req.userId);
            if (userIndex === -1) return prev;
            
            const user = prev[userIndex];
            const updatedUsers = [...prev];
            
            // 1. Update User Balance
            updatedUsers[userIndex] = {
                ...user,
                walletBalance: user.walletBalance + req.amount,
                targetedNotifications: [...(user.targetedNotifications || []), `Deposit Approved: $${req.amount.toFixed(2)}`]
            };

            // 2. Check for Referral Bonus (First Deposit only, min $1)
            if (user.referredBy && !user.referralBonusPaid && req.amount >= 1) {
                const referrerIndex = prev.findIndex(u => u.id === user.referredBy);
                if (referrerIndex !== -1) {
                    const referrer = updatedUsers[referrerIndex];
                    updatedUsers[referrerIndex] = {
                        ...referrer,
                        walletBalance: referrer.walletBalance + 1.00, // $1 Bonus
                        referralEarnings: (referrer.referralEarnings || 0) + 1.00,
                        targetedNotifications: [...(referrer.targetedNotifications || []), `Referral Bonus: $1.00 earned from ${user.name}'s first deposit.`]
                    };
                    // Mark user as paid to prevent duplicate bonus
                    updatedUsers[userIndex].referralBonusPaid = true;
                }
            }
            
            return updatedUsers;
        });
        setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' } : a));
    } 
    else if (req.type === 'withdrawal') {
        setUsers(prev => prev.map(u => u.id === 'admin_user' ? { ...u, walletBalance: u.walletBalance + req.amount } : u));
        setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' } : a));
    }
    else if (req.type === 'premium') {
        // Activate Premium for User
        setUsers(prev => prev.map(u => u.id === req.userId ? { 
            ...u, 
            isPremium: true,
            premiumExpiry: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
            walletBalance: u.walletBalance + 1, // Add $1 Bonus
            targetedNotifications: [...(u.targetedNotifications || []), `Yard+ Active! $1.00 Bonus Added. Expires in 30 days.`]
        } : u));
        setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' } : a));
    }
  };

  const handleReject = (id: string) => {
      const req = approvals.find(r => r.id === id);
      if (req && req.type === 'withdrawal') {
          setUsers(prev => prev.map(u => u.id === req.userId ? { ...u, walletBalance: u.walletBalance + req.amount } : u));
      }
      setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' } : a));
  };

  const handleTaskCreate = () => {
      if (!newOfferTitle || !newOfferDesc) return;
      const newTask: TaskOffer = {
          id: 'T-' + Date.now(),
          title: newOfferTitle,
          description: newOfferDesc,
          reward: parseFloat(newOfferReward),
          link: newOfferLink,
          status: 'active',
          createdBy: 'admin',
          maxParticipations: parseInt(newOfferMax),
          currentParticipations: 0
      };
      setTasks(prev => [newTask, ...prev]);
      setNewOfferTitle(''); setNewOfferDesc(''); setNewOfferLink('');
      alert("Mission Deployed.");
  };

  const handleSupportReply = (ticketId: string) => {
      const reply = replyText[ticketId];
      if (!reply) return;
      setSupport(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'responded', response: reply } : t));
      setReplyText(prev => ({ ...prev, [ticketId]: '' }));
  };

  const stats = useMemo(() => {
    const totalBalance = users.reduce((acc, curr) => acc + (curr.walletBalance || 0), 0);
    const pendingCount = approvals.filter(a => a.status === 'pending').length;
    const activeTasks = tasks.filter(t => t.status === 'active').length;
    return { totalBalance, pendingCount, activeTasks };
  }, [users, approvals, tasks]);

  const filteredUsers = useMemo(() => {
      return users
        .filter(u => {
            if (statusFilter === 'active') return !u.isFrozen && !u.isBanned;
            if (statusFilter === 'frozen') return u.isFrozen;
            if (statusFilter === 'banned') return u.isBanned;
            return true;
        })
        .filter(u => {
            if (roleFilter === 'all') return true;
            if (roleFilter === 'creator') return u.isCreator;
            return u.role === roleFilter;
        })
        .filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()) || u.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (sortOrder === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            if (sortOrder === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            if (sortOrder === 'balanceHigh') return b.walletBalance - a.walletBalance;
            if (sortOrder === 'balanceLow') return a.walletBalance - b.walletBalance;
            return 0;
        });
  }, [users, statusFilter, roleFilter, sortOrder, searchQuery]);

  const leaderboard = useMemo(() => {
     return [...users]
        .filter(u => u.role !== 'admin')
        .sort((a, b) => b.walletBalance - a.walletBalance)
        .slice(0, 50);
  }, [users]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <form onSubmit={handleAuth} className="w-full max-w-sm space-y-6 animate-in zoom-in duration-500">
           <div className="text-center">
              <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/20 rotate-3 transition-transform hover:rotate-6">
                <i className="fas fa-fingerprint text-3xl"></i>
              </div>
              <h1 className="text-3xl font-black uppercase tracking-widest text-white">Admin Core</h1>
              <p className="text-[11px] text-slate-500 font-bold mt-2 tracking-[0.3em] uppercase">Restricted Access</p>
           </div>
           <input 
             type="password" 
             value={passInput} 
             onChange={e => setPassInput(e.target.value)} 
             placeholder="ACCESS KEY" 
             className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center font-black tracking-[0.5em] text-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-700" 
           />
           <button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 py-5 rounded-2xl font-black text-xs uppercase shadow-xl shadow-emerald-600/20 active:scale-95 transition-transform hover:shadow-2xl">Initialize Session</button>
           <button type="button" onClick={onExit} className="w-full text-slate-600 text-[10px] font-black uppercase hover:text-white transition-colors tracking-widest">Abort</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative flex flex-col">
      <AdminBot appState={{ config: globalConfig, users, approvals, tasks }} />
      
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-4 sticky top-0 z-[100] flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-lg">EY</div>
              <div>
                <h1 className="font-black text-sm uppercase tracking-tight leading-none text-slate-900">Admin Console</h1>
                <div className="flex items-center gap-2 mt-1">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Live Stream</p>
                </div>
              </div>
          </div>
          <button onClick={onExit} className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">
            <i className="fas fa-power-off"></i>
          </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-32 pt-6 px-4 md:px-8 max-w-7xl mx-auto w-full scrollbar-hide">
        {activeTab === 'insights' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-5">
            {/* Main Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <InsightCard label="Total Users" value={users.length} icon="fa-users" color="bg-slate-900 text-white" />
                <InsightCard label="Pending Orders" value={stats.pendingCount} icon="fa-clock" color="bg-amber-500 text-white" />
                <InsightCard label="Vault Assets" value={`$${stats.totalBalance.toLocaleString()}`} icon="fa-vault" color="bg-emerald-600 text-white" />
                <InsightCard label="Active Missions" value={stats.activeTasks} icon="fa-bolt" color="bg-blue-600 text-white" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions Panel */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 -z-0 group-hover:bg-slate-100 transition-colors"></div>
                  <h3 className="font-black text-xl mb-6 relative z-10 flex items-center gap-2">
                    <i className="fas fa-sliders text-slate-900"></i> Platform Controls
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                    <ControlTile 
                      title="Global Rates" 
                      desc={`GHS: ${globalConfig.ghsDepositRate} | Boost: ${globalConfig.dailyInterestRate * 100}%`}
                      onClick={() => setShowQuickRates(!showQuickRates)} 
                      active={showQuickRates}
                      icon="fa-chart-line"
                    />
                    <ControlTile 
                      title="Push Broadcast" 
                      desc="Send global alert to all nodes" 
                      onClick={() => setShowQuickBroadcast(!showQuickBroadcast)} 
                      active={showQuickBroadcast}
                      icon="fa-tower-broadcast"
                    />
                    <ControlTile 
                      title="Maintenance" 
                      desc={globalConfig.maintenanceMode ? "ACTIVE (Lockdown)" : "INACTIVE (Live)"} 
                      onClick={handleMaintenanceToggle} 
                      active={globalConfig.maintenanceMode}
                      icon="fa-lock"
                      variant={globalConfig.maintenanceMode ? 'danger' : 'default'}
                    />
                  </div>

                  {(showQuickRates || showQuickBroadcast) && (
                    <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 animate-in zoom-in-95 duration-200">
                      {showQuickRates && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Deposit Rate (GHS)</label><input type="number" value={editGhsDepositRate} onChange={e => setEditGhsDepositRate(parseFloat(e.target.value))} className="w-full p-4 rounded-2xl border-none shadow-sm bg-white font-black text-lg outline-none focus:ring-2 focus:ring-emerald-500/20" /></div>
                            <div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Daily Boost (%)</label><input type="number" step="0.01" value={editDailyBoost} onChange={e => setEditDailyBoost(parseFloat(e.target.value))} className="w-full p-4 rounded-2xl border-none shadow-sm bg-white font-black text-lg outline-none focus:ring-2 focus:ring-emerald-500/20" /></div>
                          </div>
                          <button onClick={handleUpdateRates} className="w-full bg-slate-900 text-white py-4 rounded-2xl text-xs font-black uppercase shadow-xl hover:bg-black transition-all">Sync Rates</button>
                        </div>
                      )}
                      {showQuickBroadcast && (
                        <div className="space-y-4">
                          <div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Alert Message</label><textarea value={newBroadcast} onChange={e => setNewBroadcast(e.target.value)} className="w-full p-4 rounded-2xl border-none shadow-sm bg-white text-sm font-bold min-h-[100px] resize-none outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Type urgent message..." /></div>
                          <button onClick={handleBroadcastSignal} className="w-full bg-blue-600 text-white py-4 rounded-2xl text-xs font-black uppercase shadow-xl hover:bg-blue-700 transition-all">Broadcast</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Sidebar */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                   <h4 className="font-black text-xs uppercase tracking-widest mb-4 text-slate-400">Live Logs</h4>
                   <div className="space-y-2">
                      {globalConfig.notifications.slice(0, 4).map((n, i) => (
                        <div key={i} className="flex gap-3 items-center text-[10px] text-slate-600 bg-slate-50 p-3 rounded-xl">
                          <i className="fas fa-rss text-emerald-500 text-[8px]"></i>
                          <p className="font-medium line-clamp-1">{n}</p>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Management */}
        {activeTab === 'users' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-5">
                {/* Advanced Filtering Control Bar */}
                <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input type="text" placeholder="Search Node ID / Email / Name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-12 pr-6 py-4 rounded-2xl border-none bg-slate-50 shadow-inner outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-sm" />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="px-4 py-4 rounded-2xl bg-slate-50 border-none font-bold text-xs outline-none">
                            <option value="all">Status: All</option>
                            <option value="active">Active</option>
                            <option value="frozen">Frozen</option>
                            <option value="banned">Banned</option>
                        </select>
                        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as any)} className="px-4 py-4 rounded-2xl bg-slate-50 border-none font-bold text-xs outline-none">
                            <option value="all">Role: All</option>
                            <option value="user">User</option>
                            <option value="creator">Creator</option>
                            <option value="admin">Admin</option>
                        </select>
                        <select value={sortOrder} onChange={e => setSortOrder(e.target.value as any)} className="px-4 py-4 rounded-2xl bg-slate-50 border-none font-bold text-xs outline-none">
                            <option value="newest">Sort: Newest</option>
                            <option value="oldest">Sort: Oldest</option>
                            <option value="balanceHigh">Bal: High-Low</option>
                            <option value="balanceLow">Bal: Low-High</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredUsers.map(user => (
                      <div key={user.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-4">
                              <div className="flex gap-4">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-lg ${user.isBanned ? 'bg-red-500' : 'bg-slate-900'}`}>{user.name.charAt(0)}</div>
                                  <div>
                                      <p className="font-black text-sm">{user.name}</p>
                                      <p className="text-[10px] text-slate-400 font-bold">{user.email}</p>
                                  </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${user.isFrozen ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>{user.isFrozen ? 'Frozen' : 'Active'}</span>
                          </div>
                          
                          <div className="bg-slate-50 p-3 rounded-xl mb-4 flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Balance</span>
                              <span className="text-lg font-black text-slate-900">${user.walletBalance.toFixed(2)}</span>
                          </div>

                          <div className="flex gap-2">
                             <input type="number" placeholder="$" value={depositInputs[user.id] || ''} onChange={e => setDepositInputs(prev => ({ ...prev, [user.id]: e.target.value }))} className="w-16 bg-slate-50 rounded-xl px-3 text-xs font-bold outline-none border border-slate-100" />
                             <button onClick={() => executeDeposit(user.id)} className="bg-emerald-500 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-emerald-600 shadow-sm"><i className="fas fa-plus"></i></button>
                             <div className="w-px bg-slate-100 mx-1"></div>
                             <button onClick={() => toggleFreeze(user.id)} className={`flex-1 rounded-xl text-[10px] font-black uppercase transition-colors ${user.isFrozen ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-600'}`}>{user.isFrozen ? 'Unfreeze' : 'Freeze'}</button>
                             <button onClick={() => strikeUser(user.id)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${user.isBanned ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-500'}`}><i className="fas fa-ban"></i></button>
                          </div>
                      </div>
                  ))}
                </div>
            </div>
        )}

        {/* Approval Queue */}
        {activeTab === 'approvals' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-5">
                <div className="flex items-center justify-between">
                   <h2 className="font-black text-xl text-slate-900">Queue Management</h2>
                   <div className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black">{approvals.filter(a => a.status === 'pending').length} Pending</div>
                </div>
                
                {approvals.filter(a => a.status === 'pending').length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100 border-dashed">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                      <i className="fas fa-check text-emerald-500 text-xl"></i>
                    </div>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">All caught up</p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  {approvals.filter(a => a.status === 'pending').map(req => (
                      <div key={req.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">
                           <div className="flex-1">
                               <div className="flex items-center gap-3 mb-2">
                                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide ${req.type === 'deposit' ? 'bg-emerald-100 text-emerald-600' : req.type === 'premium' ? 'bg-yellow-100 text-yellow-600' : 'bg-amber-100 text-amber-600'}`}>{req.type}</span>
                                  <span className="text-[10px] font-bold text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                               </div>
                               <h4 className="font-black text-lg text-slate-900 mb-1">${req.amount.toFixed(2)}</h4>
                               <p className="text-xs text-slate-500 font-medium">Request by <span className="font-bold text-slate-900">{req.userName}</span></p>
                               {req.type === 'withdrawal' && (
                                 <div className="mt-3 bg-slate-50 p-3 rounded-xl text-[10px] text-slate-600 space-y-1">
                                    <div className="flex justify-between"><span>Method:</span> <span className="font-bold uppercase">{req.withdrawalMethod}</span></div>
                                    <div className="flex justify-between"><span>To:</span> <span className="font-mono">{req.withdrawalAddress}</span></div>
                                    <div className="flex justify-between border-t border-slate-200 pt-1 mt-1"><span>Fee:</span> <span className="font-bold text-red-500">-${(req.feeAmount || 0).toFixed(2)}</span></div>
                                 </div>
                               )}
                               {req.type === 'premium' && (
                                 <div className="mt-3 bg-yellow-50 border border-yellow-100 p-3 rounded-xl text-[10px] text-slate-600">
                                    <p className="font-bold text-yellow-700 uppercase">Premium Plan Verification</p>
                                    <p>Plan Tier: ${req.amount}</p>
                                 </div>
                               )}
                           </div>
                           <div className="flex gap-2 w-full md:w-auto">
                               <button onClick={() => handleApprove(req.id)} className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase shadow-lg hover:bg-black transition-all">Approve</button>
                               <button onClick={() => handleReject(req.id)} className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl font-black text-xs uppercase hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all">Reject</button>
                           </div>
                      </div>
                  ))}
                </div>
            </div>
        )}

        {/* Task Management */}
        {activeTab === 'tasks' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-5">
              <div className="lg:col-span-2 space-y-4">
                  <h3 className="font-black text-xl mb-4">Active Missions</h3>
                  {tasks.length === 0 && <p className="text-slate-400 text-sm">No tasks deployed.</p>}
                  {tasks.map(task => (
                    <div key={task.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center group hover:border-blue-100 transition-colors">
                       <div>
                         <h4 className="font-black text-sm">{task.title}</h4>
                         <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{task.description}</p>
                         <div className="flex gap-3 mt-3">
                           <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">${task.reward.toFixed(2)}</span>
                           <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">{task.currentParticipations}/{task.maxParticipations}</span>
                         </div>
                       </div>
                       <button onClick={() => setTasks(prev => prev.filter(t => t.id !== task.id))} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><i className="fas fa-trash"></i></button>
                    </div>
                  ))}
              </div>
              <div>
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 sticky top-24">
                  <h3 className="font-black text-lg mb-4">Deploy Official</h3>
                  <div className="space-y-3">
                      <input placeholder="Title" value={newOfferTitle} onChange={e => setNewOfferTitle(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 border-none font-bold text-xs outline-none focus:ring-1 focus:ring-blue-500" />
                      <textarea placeholder="Instructions..." value={newOfferDesc} onChange={e => setNewOfferDesc(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 border-none font-bold text-xs h-24 resize-none outline-none focus:ring-1 focus:ring-blue-500" />
                      <div className="grid grid-cols-2 gap-3">
                          <div><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Reward</label><input type="number" value={newOfferReward} onChange={e => setNewOfferReward(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 border-none font-bold text-xs outline-none" /></div>
                          <div><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Limit</label><input type="number" value={newOfferMax} onChange={e => setNewOfferMax(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 border-none font-bold text-xs outline-none" /></div>
                      </div>
                      <input placeholder="Link" value={newOfferLink} onChange={e => setNewOfferLink(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 border-none font-bold text-xs outline-none" />
                      <button onClick={handleTaskCreate} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-xs uppercase shadow-xl hover:bg-black transition-all mt-2">Launch Mission</button>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* Support System */}
        {activeTab === 'support' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-5">
              <div className="space-y-4">
                 <h3 className="font-black text-xl">Inbox</h3>
                 {support.length === 0 && <p className="text-slate-400 text-sm">No tickets found.</p>}
                 {support.map(ticket => (
                    <div key={ticket.id} className={`p-5 rounded-[2rem] border transition-all ${ticket.status === 'pending' ? 'bg-white border-blue-100 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-70'}`}>
                        <div className="flex justify-between items-start mb-2">
                           <div>
                              <p className="font-black text-sm">{ticket.userName}</p>
                              <p className="text-[10px] text-slate-400">{ticket.subject}</p>
                           </div>
                           {ticket.status === 'pending' && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed mb-4 bg-slate-50 p-3 rounded-xl">{ticket.content}</p>
                        {ticket.status === 'pending' ? (
                          <div className="flex gap-2">
                             <input value={replyText[ticket.id] || ''} onChange={e => setReplyText(prev => ({...prev, [ticket.id]: e.target.value}))} placeholder="Reply..." className="flex-1 bg-slate-100 rounded-xl px-3 py-2 text-xs font-bold outline-none" />
                             <button onClick={() => handleSupportReply(ticket.id)} className="bg-blue-600 text-white px-4 rounded-xl text-xs font-black"><i className="fas fa-paper-plane"></i></button>
                          </div>
                        ) : (
                          <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 p-2 rounded-lg"><i className="fas fa-check mr-1"></i> Responded: {ticket.response}</div>
                        )}
                    </div>
                 ))}
              </div>
              <div className="hidden lg:block bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[80px] opacity-50 -mr-20 -mt-20"></div>
                  <div className="relative z-10">
                    <h3 className="font-black text-2xl mb-4">Support Guidelines</h3>
                    <ul className="space-y-4 text-sm text-slate-300">
                      <li className="flex gap-3"><i className="fas fa-clock text-blue-400 mt-1"></i> <span>Respond to financial disputes within 24 hours.</span></li>
                      <li className="flex gap-3"><i className="fas fa-shield text-blue-400 mt-1"></i> <span>Verify user ID before approving complex refund requests.</span></li>
                      <li className="flex gap-3"><i className="fas fa-robot text-blue-400 mt-1"></i> <span>Use the AI assistant to draft standard policy responses.</span></li>
                    </ul>
                  </div>
              </div>
            </div>
        )}

        {/* Ads Publishing Center (New "Publishing Sessions") */}
        {activeTab === 'ads' && (
           <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                 <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <h3 className="font-black text-xl mb-6">Publish Campaign Session</h3>
                    <div className="space-y-4">
                        <div>
                           <label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-1 block">Headline</label>
                           <input value={adTitle} onChange={e => setAdTitle(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 border-none font-bold text-sm outline-none focus:ring-2 focus:ring-purple-500/20" placeholder="e.g. Weekend Bonus" />
                        </div>
                        <div>
                           <label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-1 block">Body Copy</label>
                           <textarea value={adContent} onChange={e => setAdContent(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 border-none font-bold text-sm h-32 resize-none outline-none focus:ring-2 focus:ring-purple-500/20" placeholder="Campaign details..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-1 block">Button Label</label>
                              <input value={adCta} onChange={e => setAdCta(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 border-none font-bold text-sm outline-none" placeholder="Action" />
                           </div>
                           <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-1 block">Bonus ($)</label>
                              <input type="number" value={adReward} onChange={e => setAdReward(parseFloat(e.target.value))} className="w-full p-4 rounded-2xl bg-slate-50 border-none font-bold text-sm outline-none" />
                           </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                           <button onClick={() => setIsAdActive(!isAdActive)} className={`w-12 h-7 rounded-full transition-colors relative ${isAdActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                              <div className={`w-5 h-5 bg-white rounded-full shadow-md absolute top-1 transition-all ${isAdActive ? 'left-6' : 'left-1'}`}></div>
                           </button>
                           <span className="font-bold text-sm text-slate-600">{isAdActive ? 'Campaign Live' : 'Draft Mode'}</span>
                        </div>
                        <button onClick={handleUpdateAd} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-black transition-all">Publish Session</button>
                    </div>
                 </div>

                 {/* Preview */}
                 <div>
                    <h3 className="font-black text-xs uppercase text-slate-400 mb-4 tracking-widest text-center">User View Preview</h3>
                    <div className="bg-slate-900 p-6 rounded-[3rem] shadow-2xl max-w-sm mx-auto border-4 border-slate-800">
                       <div className="bg-white rounded-[2rem] p-6 text-center relative overflow-hidden min-h-[300px] flex flex-col justify-center">
                          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-b-[50%] -mt-12"></div>
                          <div className="relative z-10 mt-6">
                             <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-4 text-2xl text-purple-600 rotate-12">
                                <i className="fas fa-gift"></i>
                             </div>
                             <h2 className="text-xl font-black text-slate-900 mb-2">{adTitle || 'Campaign Title'}</h2>
                             <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed">{adContent || 'Campaign content will appear here for all users.'}</p>
                             <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase shadow-lg">{adCta}</button>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* New Community Tab (Chat/Leaderboard) */}
        {activeTab === 'community' && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-5 h-[calc(100vh-200px)]">
              {/* Leaderboard Section */}
              <div className="lg:col-span-2 flex flex-col h-full bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                      <h3 className="font-black text-xl text-slate-900">Top Earners</h3>
                      <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-black">Live Ranking</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {leaderboard.map((user, idx) => (
                          <div key={user.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                              <div className="flex items-center gap-4">
                                  <div className={`w-8 h-8 flex items-center justify-center font-black rounded-full ${idx === 0 ? 'bg-yellow-400 text-yellow-900' : idx === 1 ? 'bg-slate-300 text-slate-700' : idx === 2 ? 'bg-orange-300 text-orange-800' : 'bg-slate-100 text-slate-400'}`}>
                                      {idx + 1}
                                  </div>
                                  <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                       <img src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.name}`} className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                      <p className="font-black text-sm">{user.name}</p>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase">{user.id}</p>
                                  </div>
                              </div>
                              <div className="flex items-center gap-4">
                                  <p className="font-black text-lg">${user.walletBalance.toFixed(2)}</p>
                                  <div className="flex gap-1">
                                    <button onClick={() => executeDeposit(user.id, 1.00)} className="px-3 py-1.5 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-black hover:bg-emerald-200 transition-colors">+$1</button>
                                    <button onClick={() => executeDeposit(user.id, 5.00)} className="px-3 py-1.5 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-black hover:bg-emerald-200 transition-colors">+$5</button>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Chat Monitor */}
              <div className="flex flex-col h-full bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-xl overflow-hidden">
                  <div className="p-6 border-b border-slate-800 bg-slate-900 z-10">
                      <h3 className="font-black text-white text-lg">Global Chat</h3>
                      <p className="text-slate-500 text-xs">Real-time feed</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {chatMessages.map(msg => (
                          <div key={msg.id} className="flex gap-3">
                              <div className={`w-8 h-8 rounded-full shrink-0 ${msg.isAdmin ? 'bg-blue-500' : 'bg-slate-700'} overflow-hidden`}>
                                   <img src={msg.profilePic || `https://ui-avatars.com/api/?name=${msg.userName}`} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                  <p className="text-[10px] text-slate-400 font-bold mb-0.5">{msg.userName} {msg.isAdmin && <span className="text-blue-400 ml-1">ADMIN</span>}</p>
                                  <p className="text-xs text-white bg-white/10 p-2 rounded-r-xl rounded-bl-xl inline-block">{msg.text}</p>
                              </div>
                          </div>
                      ))}
                      <div ref={chatScrollRef} />
                  </div>
              </div>
           </div>
        )}
      </main>

      {/* Floating Bottom Nav */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-2 py-2 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-full shadow-2xl flex items-center gap-1">
          <NavButton active={activeTab === 'insights'} onClick={() => setActiveTab('insights')} icon="fa-chart-pie" label="Core" />
          <NavButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon="fa-users" label="Nodes" />
          <NavButton active={activeTab === 'approvals'} onClick={() => setActiveTab('approvals')} icon="fa-check-double" label="Queue" badge={approvals.filter(a => a.status === 'pending').length} />
          <NavButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon="fa-list-check" label="Tasks" />
          <NavButton active={activeTab === 'community'} onClick={() => setActiveTab('community')} icon="fa-trophy" label="Rank" />
          <NavButton active={activeTab === 'support'} onClick={() => setActiveTab('support')} icon="fa-headset" label="Help" badge={support.filter(s => s.status === 'pending').length} />
          <NavButton active={activeTab === 'ads'} onClick={() => setActiveTab('ads')} icon="fa-bullhorn" label="Comms" />
      </nav>
    </div>
  );
};

const InsightCard = ({ label, value, icon, color }: { label: string, value: string | number, icon: string, color: string }) => (
  <div className={`p-6 rounded-[2rem] shadow-sm flex flex-col items-center text-center transition-all hover:-translate-y-1 ${color}`}>
    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-lg mb-3 backdrop-blur-sm">
      <i className={`fas ${icon}`}></i>
    </div>
    <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-60">{label}</p>
    <p className="text-2xl font-black tracking-tight">{value}</p>
  </div>
);

const ControlTile = ({ title, desc, onClick, active, icon, variant = 'default' }: { title: string, desc: string, onClick: () => void, active?: boolean, icon: string, variant?: 'default' | 'danger' }) => (
  <button 
    onClick={onClick} 
    className={`p-5 rounded-[2rem] border text-left transition-all ${
      active 
        ? (variant === 'danger' ? 'bg-red-500 border-red-600 shadow-lg text-white' : 'bg-slate-900 border-slate-800 shadow-lg text-white') 
        : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-md text-slate-900'
    }`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${active ? 'bg-white/20' : 'bg-slate-50 text-slate-500'}`}>
      <i className={`fas ${icon}`}></i>
    </div>
    <p className="font-black text-xs">{title}</p>
    <p className={`text-[9px] font-bold mt-0.5 ${active ? 'opacity-70' : 'text-slate-400'}`}>{desc}</p>
  </button>
);

const NavButton = ({ active, onClick, icon, label, badge }: { active: boolean, onClick: () => void, icon: string, label: string, badge?: number }) => (
  <button 
    onClick={onClick} 
    className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${active ? 'bg-white text-slate-900 shadow-lg scale-110' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
  >
    <i className={`fas ${icon} text-xs`}></i>
    {badge ? (
      <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 text-white text-[7px] font-black flex items-center justify-center rounded-full border border-slate-900">
        {badge}
      </span>
    ) : null}
  </button>
);

export default AdminPortal;
