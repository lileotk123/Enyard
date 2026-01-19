
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppView, TaskOffer, TaskSubmission, User, ApprovalRequest, GlobalConfig, SupportMessage, P2PMessage, ChatMessage } from './types';
import AdminPortal from './pages/AdminPortal';
import { PAYSTACK_URL, INITIAL_TASKS, INITIAL_USERS, INITIAL_APPROVALS, INITIAL_SUPPORT, TASK_REWARD } from './constants';
import { SupportAIService } from './services/geminiService';

// Extended AppView type to include onboarding
type ExtendedAppView = AppView | 'onboarding';

const App: React.FC = () => {
  const [view, setView] = useState<ExtendedAppView>('onboarding'); 
  const [authStep, setAuthStep] = useState<'selection' | 'login' | 'signup' | 'scan'>('selection');
  const [activeTab, setActiveTab] = useState<'home' | 'work' | 'hub' | 'community' | 'profile'>('home');
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(INITIAL_APPROVALS);
  const [allTasks, setAllTasks] = useState<TaskOffer[]>(INITIAL_TASKS);
  const [support, setSupport] = useState<SupportMessage[]>(INITIAL_SUPPORT);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [registeredTaskIds, setRegisteredTaskIds] = useState<string[]>([]);
  
  // Global Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 'c1', userId: 'admin_user', userName: 'EarnYard Admin', userRank: 0, text: 'Welcome to the Global Arena! Compete for daily prizes.', timestamp: new Date().toISOString(), isAdmin: true }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [config, setConfig] = useState<GlobalConfig>({
    dollarRate: 15.5,
    ghsDepositRate: 15.2,
    ghsWithdrawalRate: 15.0,
    dailyInterestRate: 0.02,
    notifications: [
      `Welcome to EarnYard`,
      "Referral Program: Earn $1 when friends deposit $1+.",
      "Daily 2% boost active on unused funds."
    ],
    autoAdminActive: false,
    maintenanceMode: false,
    activeAd: { id: 'default-1', title: 'Passive Income', content: 'Deposit and earn 2% daily just keeping funds unused.', ctaText: 'Deposit', rewardAmount: 0, isActive: true }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Ad System State
  const [showAd, setShowAd] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editProfilePic, setEditProfilePic] = useState<string | null>(null);

  // Support State
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportTab, setSupportTab] = useState<'ai' | 'admin'>('ai');
  const [aiQuery, setAiQuery] = useState('');
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: 'EarnYard Assistant here. How can I help you grow today?' }
  ]);
  const [aiLoading, setAiLoading] = useState(false);
  const [adminSubject, setAdminSubject] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const aiService = new SupportAIService();

  // Creator Hub State
  const [isCreatorRegModalOpen, setIsCreatorRegModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskLink, setNewTaskLink] = useState('');
  const [newTaskCount, setNewTaskCount] = useState(100);
  const [newTaskReward, setNewTaskReward] = useState(0.01);

  // Mission Submission State
  const [taskSubmissionId, setTaskSubmissionId] = useState<string | null>(null);
  const [taskScreenshot, setTaskScreenshot] = useState<string | null>(null);

  // Deposit State
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupStep, setTopupStep] = useState<1 | 2>(1); 
  const [topupAmount, setTopupAmount] = useState('');
  const [topupTxId, setTopupTxId] = useState('');

  // Withdrawal State
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNetwork, setWithdrawNetwork] = useState<'momo' | 'usdt'>('momo');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawName, setWithdrawName] = useState('');

  // Active Transaction Session
  const [activeSession, setActiveSession] = useState<ApprovalRequest | null>(null);
  const sessionChatRef = useRef<HTMLDivElement>(null);
  const [sessionChatInput, setSessionChatInput] = useState('');

  // Notifications
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // Premium & Spin State
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedPremiumPlan, setSelectedPremiumPlan] = useState<number | null>(null);
  const [premiumTxId, setPremiumTxId] = useState('');
  
  const [showSpinModal, setShowSpinModal] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<number | null>(null);

  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [referralInput, setReferralInput] = useState('');

  // Scanning State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('Initializing Bio-Scan...');
  const [scanProgress, setScanProgress] = useState(0);

  // Onboarding State
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    { title: "Earn Daily", desc: "Complete tasks & grow your balance.", icon: "fa-coins", color: "from-emerald-500 to-teal-600" },
    { title: "Fast Cashout", desc: "Mobile Money & Crypto supported.", icon: "fa-bolt", color: "from-blue-600 to-indigo-600" },
    { title: "Daily Interest", desc: "2% growth on all held funds.", icon: "fa-chart-line", color: "from-violet-600 to-purple-600" },
  ];

  // Logic
  useEffect(() => {
    if (isEditingProfile && currentUser) {
      setEditName(currentUser.name); setEditEmail(currentUser.email); setEditPassword(currentUser.password || ''); setEditCountry(currentUser.country || ''); setEditPhone(currentUser.phoneNumber || ''); setEditProfilePic(currentUser.profilePicture || null);
    }
  }, [isEditingProfile, currentUser]);

  useEffect(() => {
    if (view === 'user' && currentUser && config.activeAd?.isActive) {
      const sessions = parseInt(localStorage.getItem('sessionCount') || '0') + 1;
      localStorage.setItem('sessionCount', sessions.toString());
      if (sessions % 2 === 0) { setTimeout(() => setShowAd(true), 2000); }
    }
  }, [view, currentUser, config.activeAd]);

  useEffect(() => {
    if (authStep === 'scan') {
      setIsScanning(true); setScanProgress(0); setScanStatus("Initializing Camera...");
      let stream: MediaStream | null = null; let scanInterval: any;
      const startScan = async () => { try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }); if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.onloadedmetadata = () => { scanInterval = setInterval(() => { setScanProgress(prev => prev + 5); }, 1000); }; } } catch (err) { setScanStatus("Camera Error"); setIsScanning(false); } };
      startScan();
      const checkCompletion = setInterval(() => { setScanProgress(prev => { if (prev >= 100) { clearInterval(scanInterval); clearInterval(checkCompletion); if (stream) stream.getTracks().forEach(track => track.stop()); setIsScanning(false); completeRegistration(); return 100; } return prev; }); }, 1000);
      return () => { if (stream) stream.getTracks().forEach(track => track.stop()); clearInterval(scanInterval); clearInterval(checkCompletion); };
    }
  }, [authStep]);

  useEffect(() => { if(activeTab === 'community') chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, activeTab]);

  const completeRegistration = () => {
    if (users.find(u => u.email === emailInput)) return alert("Node exists.");
    const referrerId = referralInput ? users.find(u => u.referralCode === referralInput)?.id : undefined;
    
    const newUser: User = { 
      id: 'u' + (users.length + 100), name: emailInput.split('@')[0], email: emailInput, password: passwordInput, walletBalance: 0, 
      isBanned: false, isFrozen: false, role: 'user', createdAt: new Date().toISOString(), lastInterestHarvest: new Date().toISOString(),
      referralCode: 'REF-' + Math.random().toString(36).substr(2, 6).toUpperCase(), 
      referredBy: referrerId,
      referralEarnings: 0,
      referralBonusPaid: false
    };
    setUsers(prev => [...prev, newUser]); setCurrentUser(newUser); setAuthStep('selection'); setView('user'); alert("Identity Verified. Access Granted.");
  };

  useEffect(() => {
    if (currentUser) {
      const updatedUser = users.find(u => u.id === currentUser.id);
      if (updatedUser && (updatedUser.walletBalance !== currentUser.walletBalance || updatedUser.isPremium !== currentUser.isPremium || updatedUser.lastDailySpin !== currentUser.lastDailySpin || updatedUser.referralEarnings !== currentUser.referralEarnings)) {
        setCurrentUser(updatedUser);
      }
    }
  }, [users, currentUser?.id]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiMessages, isSupportOpen]);
  useEffect(() => { sessionChatRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeSession?.messages]);

  useEffect(() => {
    if (currentUser && currentUser.walletBalance > 0 && !currentUser.isFrozen) {
      const now = new Date();
      const lastHarvest = currentUser.lastInterestHarvest ? new Date(currentUser.lastInterestHarvest) : new Date(currentUser.createdAt);
      const diffHours = (now.getTime() - lastHarvest.getTime()) / (1000 * 60 * 60);
      if (diffHours >= 24) {
        const days = Math.floor(diffHours / 24);
        const rate = currentUser.isPremium ? 0.04 : config.dailyInterestRate;
        let totalBoost = 0; let tempBalance = currentUser.walletBalance;
        for (let i = 0; i < days; i++) { let dailyBoost = Math.min(tempBalance * rate, 20); totalBoost += dailyBoost; tempBalance += dailyBoost; }
        setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, walletBalance: u.walletBalance + totalBoost, lastInterestHarvest: now.toISOString() } : u));
        alert(`Daily Protocol Boost (${currentUser.isPremium ? 'Premium 4%' : '2%'}): $${totalBoost.toFixed(2)} added.`);
      }
    }
  }, [currentUser?.id, currentUser?.isFrozen, currentUser?.isPremium, config.dailyInterestRate]);

  const handleAuthAction = (e: React.FormEvent) => { e.preventDefault(); if (authStep === 'login') { const user = users.find(u => u.email === emailInput && u.password === passwordInput); if (user) { setCurrentUser(user); setView('user'); } else alert("Invalid."); } else if (authStep === 'signup') { setAuthStep('scan'); } };
  const handleLogout = () => { setCurrentUser(null); setView('auth'); setAuthStep('selection'); };
  
  const handleScreenshotUpload = (setter: (val: string | null) => void) => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.onchange = (e: any) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = (re) => { setter(re.target?.result as string); }; reader.readAsDataURL(file); } }; input.click(); };

  const handleUpdateProfile = () => { setUsers(prev => prev.map(u => u.id === currentUser?.id ? { ...u, name: editName, email: editEmail, password: editPassword, country: editCountry, phoneNumber: editPhone, profilePicture: editProfilePic || undefined } : u)); setIsEditingProfile(false); alert("Profile Updated."); };
  const handleCreatorRegSubmit = () => { setUsers(prev => prev.map(u => u.id === currentUser?.id ? { ...u, isCreator: true } : u)); setIsCreatorRegModalOpen(false); alert("Creator Node Activated."); };
  const handleCreateOffer = () => { 
      const totalCost = newTaskCount * newTaskReward;
      if (currentUser!.walletBalance < totalCost) return alert("Insufficient funds.");
      const newTask: TaskOffer = { id: 'T-' + Date.now(), title: newTaskTitle, description: newTaskDesc, reward: newTaskReward, link: newTaskLink, status: 'active', createdBy: currentUser!.id, maxParticipations: newTaskCount, currentParticipations: 0 };
      setUsers(prev => prev.map(u => u.id === currentUser!.id ? { ...u, walletBalance: u.walletBalance - totalCost } : u));
      setAllTasks(prev => [newTask, ...prev]); setIsCreateTaskModalOpen(false); alert("Mission Deployed."); 
  };
  const handleTaskAction = (taskId: string) => { if (registeredTaskIds.includes(taskId)) { setTaskSubmissionId(taskId); } else { setRegisteredTaskIds(prev => [...prev, taskId]); alert("Mission Node Engaged."); } };
  const handleTaskSubmitScreenshot = () => { const newSub: TaskSubmission = { id: 'SUB-' + Date.now(), taskId: taskSubmissionId!, userId: currentUser!.id, userEmail: currentUser!.email, screenshot: taskScreenshot!, status: 'pending', submittedAt: new Date().toISOString() }; setSubmissions(prev => [newSub, ...prev]); setTaskSubmissionId(null); setTaskScreenshot(null); alert("Proof Submitted."); };
  const handleApproveSubmission = (sub: TaskSubmission, approved: boolean) => { setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, status: approved ? 'approved' : 'rejected' } : s)); if (approved) { const task = allTasks.find(t => t.id === sub.taskId); if (task) setUsers(prev => prev.map(u => u.id === sub.userId ? { ...u, walletBalance: u.walletBalance + task.reward } : u)); } };

  const handleSendAiQuery = async () => { if (!aiQuery.trim()) return; setAiMessages(prev => [...prev, { role: 'user', text: aiQuery }]); setAiLoading(true); const response = await aiService.getSupportGuidance(aiQuery, { config, users, approvals, tasks: allTasks }); setAiMessages(prev => [...prev, { role: 'bot', text: response }]); setAiLoading(false); setAiQuery(''); };
  const handleSendAdminComplain = () => { const newTicket: SupportMessage = { id: 'TKT-' + Date.now(), userId: currentUser!.id, userName: currentUser!.name, subject: adminSubject, content: adminMessage, status: 'pending', timestamp: new Date().toISOString() }; setSupport(prev => [...prev, newTicket]); setAdminSubject(''); setAdminMessage(''); alert("Ticket Sent."); };
  
  const handleTopupSubmit = () => { 
      const amount = parseFloat(topupAmount);
      if (!amount || amount < 1) return alert("Min deposit is $1.");
      if (!topupTxId) return alert("Please enter Transaction ID.");

      const newReq: ApprovalRequest = { 
          id: 'TOP-' + Date.now(), 
          userId: currentUser!.id, 
          userName: currentUser!.name, 
          userEmail: currentUser!.email, 
          type: 'deposit', 
          amount: amount, 
          status: 'pending', 
          createdAt: new Date().toISOString(),
          messages: [{ senderId: 'system', senderName: 'System', text: `Deposit Check initiated. Ref: ${topupTxId}`, timestamp: new Date().toISOString() }]
      };
      
      setApprovals(prev => [newReq, ...prev]);
      setShowTopupModal(false);
      setTopupAmount('');
      setTopupTxId('');
      setTopupStep(1);
      alert("Deposit Submitted. Waiting for Approval."); 
  };

  const handleWithdrawalSubmit = () => {
    if (!currentUser) return;
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 5) return alert("Minimum withdrawal is $5.");
    if (amount > currentUser.walletBalance) return alert("Insufficient balance.");
    if (!withdrawAddress || !withdrawName) return alert("Payment details required.");

    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, walletBalance: u.walletBalance - amount } : u));
    const fee = currentUser.isPremium ? 0 : amount * 0.05;
    
    const newReq: ApprovalRequest = {
      id: 'WDR-' + Date.now(), userId: currentUser.id, userName: currentUser.name, userEmail: currentUser.email, type: 'withdrawal', amount: amount, status: 'pending', feeAmount: fee, withdrawalMethod: withdrawNetwork, withdrawalAddress: withdrawAddress, accountName: withdrawName, createdAt: new Date().toISOString(), messages: [{ senderId: 'system', senderName: 'System', text: `Withdrawal initiated. ${currentUser.isPremium ? 'PREMIUM: No Fees Applied.' : ''}`, timestamp: new Date().toISOString() }]
    };
    setApprovals(prev => [newReq, ...prev]); setShowWithdrawalModal(false); alert("Withdrawal Request Sent.");
  };

  const handleSendSessionMessage = () => { if (!sessionChatInput.trim() || !activeSession || !currentUser) return; const newMessage: P2PMessage = { senderId: currentUser.id, senderName: currentUser.name, text: sessionChatInput, timestamp: new Date().toISOString() }; setApprovals(prev => prev.map(a => a.id === activeSession.id ? { ...a, messages: [...(a.messages || []), newMessage] } : a)); setActiveSession(prev => prev ? { ...prev, messages: [...(prev.messages || []), newMessage] } : null); setSessionChatInput(''); };

  const handleVerifyPremium = () => {
      if (!currentUser || !selectedPremiumPlan || !premiumTxId) return alert("Please enter Transaction ID.");
      const newReq: ApprovalRequest = { id: 'PRM-' + Date.now(), userId: currentUser.id, userName: currentUser.name, userEmail: currentUser.email, type: 'premium', amount: selectedPremiumPlan, status: 'pending', createdAt: new Date().toISOString(), planTier: selectedPremiumPlan, messages: [{ senderId: 'system', senderName: 'System', text: `Premium Plan ($${selectedPremiumPlan}) activation requested. Transaction ID: ${premiumTxId}`, timestamp: new Date().toISOString() }] };
      setApprovals(prev => [newReq, ...prev]); setShowPremiumModal(false); setSelectedPremiumPlan(null); setPremiumTxId(''); alert("Verification Submitted.");
  };

  const canFreeSpin = useMemo(() => { if (!currentUser?.lastDailySpin) return true; const last = new Date(currentUser.lastDailySpin); const now = new Date(); return now.getDate() !== last.getDate() || now.getMonth() !== last.getMonth(); }, [currentUser?.lastDailySpin]);
  const spinPrizes = [0.05, 0.10, 0.20, 0.50, 1.00, 0.00, 0.10, 5.00, 0.05];
  const handleSpin = () => {
     if (!currentUser) return;
     if (!canFreeSpin && currentUser.walletBalance < 0.50) return alert("Insufficient balance ($0.50).");
     if (!canFreeSpin) setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, walletBalance: u.walletBalance - 0.50 } : u));
     setIsSpinning(true); setSpinResult(null);
     const randomIndex = Math.floor(Math.random() * spinPrizes.length); const prize = spinPrizes[randomIndex];
     setTimeout(() => { setIsSpinning(false); setSpinResult(prize); setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, walletBalance: u.walletBalance + prize, lastDailySpin: canFreeSpin ? new Date().toISOString() : u.lastDailySpin } : u)); }, 2000);
  };

  const handleSendMessage = () => {
      if (!currentUser || !chatInput.trim()) return;
      // Calculate rank
      const sortedUsers = [...users].sort((a, b) => b.walletBalance - a.walletBalance);
      const rank = sortedUsers.findIndex(u => u.id === currentUser.id) + 1;
      
      const newMessage: ChatMessage = {
          id: 'c' + Date.now(),
          userId: currentUser.id,
          userName: currentUser.name,
          profilePic: currentUser.profilePicture,
          userRank: rank,
          text: chatInput,
          timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, newMessage]);
      setChatInput('');
  };

  const depositGhs = useMemo(() => (parseFloat(topupAmount) || 0) * config.ghsDepositRate, [topupAmount, config.ghsDepositRate]);
  const withdrawalCalcs = useMemo(() => { const amount = parseFloat(withdrawAmount) || 0; const fee = currentUser?.isPremium ? 0 : amount * 0.05; const net = amount - fee; return { fee, net }; }, [withdrawAmount, currentUser?.isPremium]);
  const ongoingTx = useMemo(() => approvals.filter(a => a.userId === currentUser?.id && !['completed','rejected'].includes(a.status)), [approvals, currentUser]);
  const historyTx = useMemo(() => approvals.filter(a => a.userId === currentUser?.id), [approvals, currentUser]);
  const creatorSubmissions = useMemo(() => submissions.filter(s => allTasks.find(t => t.id === s.taskId)?.createdBy === currentUser?.id && s.status === 'pending'), [submissions, allTasks, currentUser]);
  const myCreatedTasks = useMemo(() => allTasks.filter(t => t.createdBy === currentUser?.id), [allTasks, currentUser]);
  const availableTasks = useMemo(() => allTasks.filter(t => t.status === 'active' && t.createdBy !== currentUser?.id), [allTasks, currentUser]);
  const featuredTasks = useMemo(() => availableTasks.filter(t => t.reward >= 0.10).slice(0, 3), [availableTasks]);
  const referralCount = useMemo(() => users.filter(u => u.referredBy === currentUser?.id).length, [users, currentUser]);

  const topUsers = useMemo(() => {
    return [...users]
        .filter(u => u.role !== 'admin')
        .sort((a, b) => b.walletBalance - a.walletBalance)
        .slice(0, 10);
  }, [users]);

  // Styles
  const glassPanel = "glass-panel";
  const textPrimary = "text-white";
  const textSecondary = "text-slate-400";

  if (view === 'onboarding') return <div className="fixed inset-0 flex flex-col items-center justify-center p-6 bg-slate-900 overflow-hidden"><div className="blob blob-1"></div><div className="blob blob-2"></div><div className="blob blob-3"></div><div className="relative z-10 w-full max-w-sm flex flex-col h-full justify-between py-12"><div className="flex-1 flex items-center justify-center"><div className="w-full flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>{slides.map((slide, index) => (<div key={index} className="w-full shrink-0 flex flex-col items-center justify-center text-center px-4"><div className={`w-32 h-32 rounded-3xl bg-gradient-to-br ${slide.color} flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.3)] mb-8 animate-in`}><i className={`fas ${slide.icon} text-5xl text-white`}></i></div><h2 className="text-3xl font-black text-white mb-4">{slide.title}</h2><p className="text-slate-400 text-sm leading-relaxed">{slide.desc}</p></div>))}</div></div><div className="flex flex-col gap-6"><div className="flex justify-center gap-2">{slides.map((_, idx) => (<div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-700'}`}></div>))}</div><button onClick={() => { if (currentSlide < slides.length - 1) setCurrentSlide(p => p + 1); else setView('auth'); }} className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-sm uppercase tracking-wide hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">{currentSlide === slides.length - 1 ? "Launch App" : "Continue"}</button></div></div></div>;

  if (view === 'auth') return <div className="fixed inset-0 flex items-center justify-center p-6 bg-slate-900 overflow-hidden"><div className="blob blob-1"></div><div className="blob blob-2"></div><div className={`relative z-10 w-full max-w-sm p-8 rounded-[2.5rem] ${glassPanel} animate-in`}><button onClick={() => setView('admin')} className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg active:scale-95 transition-transform"><i className="fas fa-leaf text-3xl text-white"></i></button>{authStep === 'selection' && <div className="animate-in"><h1 className="text-3xl font-black text-center text-white mb-2">EarnYard</h1><p className="text-center text-slate-400 text-xs mb-8 uppercase tracking-widest">Decentralized Micro-Tasks</p><div className="space-y-3"><button onClick={() => setAuthStep('login')} className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-transform">Access Account</button><button onClick={() => setAuthStep('signup')} className={`w-full py-4 rounded-2xl font-black text-xs uppercase text-white border border-white/20 hover:bg-white/10 active:scale-95 transition-transform`}>Create Node</button></div></div>}{(authStep === 'login' || authStep === 'signup') && <form onSubmit={handleAuthAction} className="space-y-4 animate-in"><h2 className="text-2xl font-black text-white mb-1">{authStep === 'login' ? 'Sign In' : 'Join Grid'}</h2><input type="email" placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-white outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} required /><input type="password" placeholder="Password" className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-white outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} required />{authStep === 'signup' && <input type="text" placeholder="Referral Code (Optional)" className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-white outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600" value={referralInput} onChange={(e) => setReferralInput(e.target.value)} />}<button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 rounded-xl font-black text-xs uppercase shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform">Continue</button><button type="button" onClick={() => setAuthStep(authStep === 'login' ? 'signup' : 'login')} className="w-full text-center text-slate-500 text-[10px] uppercase font-bold hover:text-white transition-colors mt-4">Switch Mode</button></form>}{authStep === 'scan' && <div className="space-y-6 animate-in text-center"><h2 className="text-xl font-black text-white uppercase tracking-widest">Biometric Sync</h2><div className="relative w-48 h-48 mx-auto rounded-full border-2 border-emerald-500/50 overflow-hidden bg-black shadow-[0_0_30px_rgba(16,185,129,0.2)]">{isScanning && <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />}<div className="absolute inset-0 scanner-line"></div></div><div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${scanProgress}%` }}></div></div><p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest animate-pulse">{scanStatus}</p></div>}</div></div>;

  if (view === 'admin') return <AdminPortal onExit={() => setView('user')} globalConfig={config} setGlobalConfig={setConfig} users={users} setUsers={setUsers} approvals={approvals} setApprovals={setApprovals} tasks={allTasks} setTasks={setAllTasks} support={support} setSupport={setSupport} chatMessages={chatMessages} setChatMessages={setChatMessages} />;
  
  return (
    <div className={`fixed inset-0 w-full h-full flex justify-center bg-slate-950 font-sans text-white`}>
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
            <div className="blob blob-3"></div>
        </div>

        {/* Mobile Container */}
        <div className={`w-full max-w-md h-full flex flex-col relative z-10 ${glassPanel} border-x border-white/5`}>
            
            {/* Header */}
            <header className="px-6 py-5 flex justify-between items-center z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 hover:border-emerald-500 transition-colors cursor-pointer" onClick={() => setActiveTab('profile')}>
                        {currentUser?.profilePicture ? <img src={currentUser.profilePicture} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center text-xs font-black">{currentUser?.name.charAt(0)}</div>}
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Welcome back</p>
                        <p className="text-sm font-black">{currentUser?.name}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowNotificationModal(true)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-all relative border border-white/10">
                        <i className="fas fa-bell text-xs text-slate-300"></i>
                        {currentUser?.targetedNotifications?.length ? <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-slate-900"></div> : null}
                    </button>
                    {/* Admin trigger hidden or subtle */}
                    <button onClick={() => setView('admin')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-all border border-white/10 text-slate-500 hover:text-white"><i className="fas fa-fingerprint"></i></button>
                </div>
            </header>
            
            {/* Frozen Banner */}
            {currentUser?.isFrozen && <div className="bg-red-500/90 text-white px-4 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 animate-pulse mx-4 rounded-xl mb-2 backdrop-blur-md"><i className="fas fa-lock"></i> Account Frozen</div>}

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-32 space-y-6">
                
                {activeTab === 'home' && (
                <div className="space-y-6 animate-in">
                    {/* Balance Card - Fintech Style */}
                    <div className="relative w-full h-56 rounded-[2rem] overflow-hidden shadow-2xl group cursor-pointer active:scale-95 transition-all duration-300">
                        {/* Card Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900"></div>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        
                        {/* Shine Effect */}
                        <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />

                        <div className="relative z-10 p-6 flex flex-col justify-between h-full">
                            <div className="flex justify-between items-start">
                                <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${currentUser?.isPremium ? 'bg-amber-400' : 'bg-slate-300'}`}></div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-white">{currentUser?.isPremium ? 'Yard+ Premium' : 'Basic Node'}</span>
                                </div>
                                <i className="fas fa-wifi text-white/50 rotate-90"></i>
                            </div>
                            <div>
                                <p className="text-slate-300 text-[10px] uppercase tracking-widest mb-1">Total Assets</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl text-emerald-300 font-bold">$</span>
                                    <span className="text-5xl font-black tracking-tighter text-white">{currentUser?.walletBalance?.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-end">
                                <p className="text-[10px] font-mono text-white/60 tracking-widest">**** **** 8291</p>
                                <div className="w-10 h-6 bg-white/20 rounded flex items-center justify-center"><div className="w-6 h-6 rounded-full bg-red-500/50 -mr-3"></div><div className="w-6 h-6 rounded-full bg-yellow-500/50"></div></div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-4 gap-3">
                        <ActionButton icon="fa-arrow-down" label="Deposit" color="bg-emerald-500" onClick={() => !currentUser?.isFrozen && setShowTopupModal(true)} />
                        <ActionButton icon="fa-arrow-up" label="Withdraw" color="bg-blue-500" onClick={() => !currentUser?.isFrozen && setShowWithdrawalModal(true)} />
                        <ActionButton icon="fa-crown" label="Premium" color="bg-amber-500" onClick={() => setShowPremiumModal(true)} />
                        <ActionButton icon="fa-dice" label="Spin" color="bg-purple-500" onClick={() => setShowSpinModal(true)} />
                    </div>

                    {/* Daily Earnings Streak */}
                    <div className="bg-white/5 rounded-3xl p-5 border border-white/5 relative overflow-hidden">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-black text-sm text-white">Daily Streak</h3>
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">Active</span>
                        </div>
                        <div className="flex justify-between gap-1">
                            {['M','T','W','T','F','S','S'].map((day, i) => (
                                <div key={i} className={`flex flex-col items-center gap-1 ${i === new Date().getDay() - 1 ? 'opacity-100' : 'opacity-40'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${i === new Date().getDay() - 1 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50' : 'bg-white/10 text-white'}`}>
                                        {i <= new Date().getDay() - 1 ? <i className="fas fa-check"></i> : day}
                                    </div>
                                    <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* More Opportunities Section */}
                    <div>
                        <h3 className="font-black text-sm text-white mb-3 px-2">Earn More</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-4 rounded-3xl relative overflow-hidden group cursor-pointer active:scale-95 transition-transform">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-white opacity-10 rounded-full -mr-5 -mt-5"></div>
                                <i className="fas fa-play-circle text-2xl text-white mb-2"></i>
                                <p className="font-black text-sm text-white leading-tight">Watch Clips</p>
                                <p className="text-[10px] text-indigo-200 mt-1">Get $0.05 / video</p>
                            </div>
                            <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-4 rounded-3xl relative overflow-hidden group cursor-pointer active:scale-95 transition-transform" onClick={() => setActiveTab('work')}>
                                <div className="absolute bottom-0 right-0 w-16 h-16 bg-black opacity-10 rounded-full -mr-5 -mb-5"></div>
                                <i className="fas fa-fire text-2xl text-white mb-2"></i>
                                <p className="font-black text-sm text-white leading-tight">High Ticket</p>
                                <p className="text-[10px] text-pink-200 mt-1">Tasks over $1.00</p>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Stream */}
                    <div>
                        <div className="flex justify-between items-center mb-4 px-2">
                            <h3 className="text-sm font-black text-white">Live Activity</h3>
                            <button onClick={() => setShowHistoryModal(true)} className="text-[10px] text-emerald-400 font-bold uppercase hover:text-emerald-300">View All</button>
                        </div>
                        <div className="space-y-3">
                            {ongoingTx.length === 0 && historyTx.length === 0 && <div className="text-center py-10 text-slate-500 text-xs">No recent activity</div>}
                            {[...ongoingTx, ...historyTx].slice(0, 4).map(tx => (
                                <div key={tx.id} onClick={() => setActiveSession(tx)} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex justify-between items-center active:scale-95 transition-transform cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${tx.type === 'deposit' ? 'bg-emerald-500/20 text-emerald-500' : tx.type === 'premium' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                            <i className={`fas ${tx.type === 'deposit' ? 'fa-arrow-down' : tx.type === 'premium' ? 'fa-crown' : 'fa-arrow-up'}`}></i>
                                        </div>
                                        <div>
                                            <p className="font-bold text-xs text-white capitalize">{tx.type === 'premium' ? 'Yard+ Upgrade' : tx.type}</p>
                                            <p className="text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-black text-sm ${tx.type === 'deposit' ? 'text-emerald-400' : 'text-white'}`}>${tx.amount.toFixed(2)}</p>
                                        <p className={`text-[8px] font-bold uppercase tracking-wide ${tx.status === 'pending' ? 'text-amber-500' : tx.status === 'completed' || tx.status === 'approved' ? 'text-emerald-500' : 'text-red-500'}`}>{tx.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                )}

                {activeTab === 'work' && (
                <div className="space-y-6 animate-in">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-white">Missions</h2>
                        <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-emerald-500/30">{availableTasks.length} Live</span>
                    </div>
                    <div className="space-y-4">
                        {availableTasks.length === 0 && (
                            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                                <i className="fas fa-rocket text-4xl text-slate-600 mb-4"></i>
                                <p className="text-slate-500 text-xs font-bold uppercase">No missions available</p>
                            </div>
                        )}
                        {availableTasks.map(task => (<TaskCard key={task.id} task={task} registered={registeredTaskIds.includes(task.id)} submitted={submissions.some(s => s.taskId === task.id && s.userId === currentUser?.id)} onClick={() => handleTaskAction(task.id)} isFrozen={currentUser?.isFrozen} darkMode={true} />))}
                    </div>
                </div>
                )}

                {activeTab === 'hub' && (
                <div className="space-y-6 animate-in">
                    {!currentUser?.isCreator ? (
                        <div className="bg-gradient-to-br from-orange-600 to-red-700 p-8 rounded-[2.5rem] text-center shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-20 -mt-20"></div>
                            <div className="relative z-10">
                                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/20"><i className="fas fa-bullhorn text-3xl text-white"></i></div>
                                <h2 className="text-2xl font-black text-white mb-2">Creator Hub</h2>
                                <p className="text-white/80 text-sm mb-8 leading-relaxed">Launch your own campaigns. Drive traffic. Crowdsource actions.</p>
                                <button onClick={() => setIsCreatorRegModalOpen(true)} className="w-full py-4 bg-white text-orange-600 rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 transition-transform">Get Started ($1.00)</button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <button onClick={() => setIsCreateTaskModalOpen(true)} className="w-full py-5 rounded-3xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-black text-xs uppercase shadow-lg shadow-orange-500/20 active:scale-95 transition-transform flex items-center justify-center gap-2">
                                <i className="fas fa-plus"></i> Deploy Mission
                            </button>
                            
                            {creatorSubmissions.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest pl-2">Approvals</h3>
                                    {creatorSubmissions.map(sub => (
                                        <div key={sub.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                                            <div className="h-32 rounded-xl bg-black/50 mb-3 overflow-hidden relative cursor-pointer" onClick={() => window.open(sub.screenshot)}>
                                                <img src={sub.screenshot} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                                                <div className="absolute inset-0 flex items-center justify-center"><i className="fas fa-eye text-white/50"></i></div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleApproveSubmission(sub, true)} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl text-[10px] font-black uppercase">Approve</button>
                                                <button onClick={() => handleApproveSubmission(sub, false)} className="flex-1 bg-white/10 text-white py-3 rounded-xl text-[10px] font-black uppercase">Reject</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Live Campaigns</h3>
                                {myCreatedTasks.length === 0 && <p className="text-center text-slate-500 text-xs">No active campaigns</p>}
                                <div className="space-y-3">
                                    {myCreatedTasks.map(task => (
                                        <div key={task.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <div>
                                                <p className="font-bold text-xs text-white">{task.title}</p>
                                                <p className="text-[10px] text-slate-400">{task.currentParticipations} / {task.maxParticipations} filled</p>
                                            </div>
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                )}
                
                {activeTab === 'community' && (
                  <div className="space-y-6 animate-in h-full flex flex-col">
                      {/* Leaderboard Header - The "Podium" */}
                      <div className="shrink-0 pt-4">
                          <h2 className="text-xl font-black text-white mb-4 text-center">Top Earners</h2>
                          <div className="flex justify-center items-end gap-4 mb-6 px-2">
                              {/* Rank 2 */}
                              {topUsers[1] && (
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-full border-2 border-slate-400 p-0.5 relative mb-2">
                                        <img src={topUsers[1].profilePicture || `https://ui-avatars.com/api/?name=${topUsers[1].name}&background=94a3b8&color=fff`} className="w-full h-full rounded-full object-cover" />
                                        <div className="absolute -bottom-2 inset-x-0 flex justify-center"><span className="bg-slate-400 text-slate-900 text-[10px] font-black px-2 rounded-full">#2</span></div>
                                    </div>
                                    <p className="text-[10px] font-bold text-white max-w-[60px] truncate">{topUsers[1].name}</p>
                                    <p className="text-[9px] font-bold text-slate-400">${topUsers[1].walletBalance.toFixed(0)}</p>
                                </div>
                              )}
                              
                              {/* Rank 1 */}
                              {topUsers[0] && (
                                <div className="flex flex-col items-center -mt-6">
                                    <div className="w-20 h-20 rounded-full border-4 border-yellow-400 p-0.5 relative mb-2 shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                                        <div className="absolute -top-6 inset-x-0 flex justify-center text-2xl text-yellow-400"><i className="fas fa-crown"></i></div>
                                        <img src={topUsers[0].profilePicture || `https://ui-avatars.com/api/?name=${topUsers[0].name}&background=facc15&color=fff`} className="w-full h-full rounded-full object-cover" />
                                        <div className="absolute -bottom-2 inset-x-0 flex justify-center"><span className="bg-yellow-400 text-yellow-900 text-xs font-black px-3 rounded-full">#1</span></div>
                                    </div>
                                    <p className="text-xs font-black text-white max-w-[80px] truncate">{topUsers[0].name}</p>
                                    <p className="text-[10px] font-bold text-yellow-500">${topUsers[0].walletBalance.toFixed(0)}</p>
                                </div>
                              )}

                              {/* Rank 3 */}
                              {topUsers[2] && (
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-full border-2 border-orange-700 p-0.5 relative mb-2">
                                        <img src={topUsers[2].profilePicture || `https://ui-avatars.com/api/?name=${topUsers[2].name}&background=c2410c&color=fff`} className="w-full h-full rounded-full object-cover" />
                                        <div className="absolute -bottom-2 inset-x-0 flex justify-center"><span className="bg-orange-700 text-white text-[10px] font-black px-2 rounded-full">#3</span></div>
                                    </div>
                                    <p className="text-[10px] font-bold text-white max-w-[60px] truncate">{topUsers[2].name}</p>
                                    <p className="text-[9px] font-bold text-slate-400">${topUsers[2].walletBalance.toFixed(0)}</p>
                                </div>
                              )}
                          </div>
                          
                          {/* Rank List 4-10 */}
                          {topUsers.length > 3 && (
                              <div className="bg-white/5 rounded-2xl p-4 space-y-3 mb-4">
                                  {topUsers.slice(3, 8).map((user, idx) => (
                                      <div key={user.id} className="flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                              <span className="text-slate-500 font-black text-xs w-4">{idx + 4}</span>
                                              <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden">
                                                  <img src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.name}`} className="w-full h-full object-cover" />
                                              </div>
                                              <p className="text-xs font-bold text-white">{user.name}</p>
                                          </div>
                                          <p className="text-xs font-black text-emerald-400">${user.walletBalance.toFixed(2)}</p>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>

                      {/* Chat Area */}
                      <div className="flex-1 flex flex-col bg-white/5 border border-white/5 rounded-t-[2rem] overflow-hidden -mx-4">
                          <div className="p-3 bg-white/5 border-b border-white/5 flex justify-between items-center">
                              <span className="text-xs font-black text-white uppercase tracking-wider pl-2">Global Chat</span>
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/20 rounded-full">
                                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                  <span className="text-[9px] font-bold text-emerald-400">{chatMessages.length} msgs</span>
                              </div>
                          </div>
                          <div className="flex-1 overflow-y-auto p-4 space-y-4">
                              {chatMessages.map(msg => (
                                  <div key={msg.id} className="flex gap-3">
                                      <div className={`w-8 h-8 rounded-full shrink-0 p-0.5 ${msg.isAdmin ? 'bg-blue-500' : msg.userRank && msg.userRank <= 3 ? 'bg-yellow-400' : msg.userRank && msg.userRank <= 10 ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                          <img src={msg.profilePic || `https://ui-avatars.com/api/?name=${msg.userName}`} className="w-full h-full rounded-full object-cover" />
                                      </div>
                                      <div>
                                          <div className="flex items-baseline gap-2 mb-0.5">
                                              <span className={`text-[10px] font-black ${msg.isAdmin ? 'text-blue-400' : 'text-white'}`}>{msg.userName}</span>
                                              {msg.isAdmin && <span className="bg-blue-500 text-white text-[8px] font-black px-1 rounded">ADMIN</span>}
                                              {msg.userRank && msg.userRank <= 10 && !msg.isAdmin && <span className="bg-yellow-500/20 text-yellow-500 text-[8px] font-black px-1 rounded">#{msg.userRank}</span>}
                                              <span className="text-[8px] text-slate-500">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                          </div>
                                          <p className="text-xs text-slate-300 leading-relaxed max-w-[240px]">{msg.text}</p>
                                      </div>
                                  </div>
                              ))}
                              <div ref={chatScrollRef} />
                          </div>
                          <div className="p-3 bg-slate-900 border-t border-white/10 flex gap-2">
                              <input 
                                value={chatInput} 
                                onChange={e => setChatInput(e.target.value)} 
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Say something..." 
                                className="flex-1 bg-white/5 rounded-xl px-4 text-xs text-white outline-none border border-white/5 focus:border-emerald-500 transition-colors" 
                              />
                              <button onClick={handleSendMessage} className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform"><i className="fas fa-paper-plane text-xs"></i></button>
                          </div>
                      </div>
                  </div>
                )}

                {activeTab === 'profile' && (
                <div className="space-y-6 animate-in pb-12">
                    <div className="text-center pt-4">
                        <div className="w-28 h-28 mx-auto rounded-full p-1 bg-gradient-to-br from-emerald-500 to-blue-500 mb-4">
                            <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 border-4 border-slate-900">
                                {currentUser?.profilePicture ? <img src={currentUser.profilePicture} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl font-black text-slate-700">{currentUser?.name.charAt(0)}</div>}
                            </div>
                        </div>
                        <h2 className="text-2xl font-black text-white">{currentUser?.name}</h2>
                        <p className="text-slate-400 text-xs uppercase tracking-widest">{currentUser?.email}</p>
                    </div>

                    {!currentUser?.isPremium && (
                        <div onClick={() => setShowPremiumModal(true)} className="mx-2 bg-gradient-to-r from-amber-400 to-yellow-600 p-1 rounded-2xl cursor-pointer active:scale-95 transition-transform">
                            <div className="bg-slate-900/40 backdrop-blur-sm p-4 rounded-xl flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-amber-500 text-xl"><i className="fas fa-crown"></i></div>
                                <div><p className="font-black text-sm text-white">Upgrade to Yard+</p><p className="text-[10px] text-white/80">Remove fees & double interest.</p></div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white/5 rounded-3xl p-4 border border-white/5 mb-4 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-colors"></div>
                        <div className="flex justify-between items-center mb-3 relative z-10">
                            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Referral Stats</p>
                            <div className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-[10px] font-black border border-emerald-500/20">{referralCount} Users</div>
                        </div>
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-2xl font-black text-white tracking-tight">${currentUser?.referralEarnings?.toFixed(2) || '0.00'}</p>
                                <p className="text-[10px] text-slate-500 font-bold">Total Earnings</p>
                            </div>
                            <button onClick={() => { navigator.clipboard.writeText(currentUser?.referralCode || ''); alert("Copied Referral Code"); }} className="bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl text-xs font-bold transition-all border border-white/10 active:scale-95">
                                Copy Code
                            </button>
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-3xl p-1 overflow-hidden">
                        <button onClick={() => !currentUser?.isFrozen && setIsEditingProfile(true)} className="w-full p-4 flex items-center justify-between text-white hover:bg-white/5 transition-colors border-b border-white/5"><div className="flex items-center gap-3"><i className="fas fa-user-pen w-6 text-center text-slate-400"></i> <span className="font-bold text-sm">Edit Profile</span></div><i className="fas fa-chevron-right text-xs text-slate-600"></i></button>
                        <button onClick={handleLogout} className="w-full p-4 flex items-center justify-between text-red-400 hover:bg-red-500/10 transition-colors"><div className="flex items-center gap-3"><i className="fas fa-sign-out-alt w-6 text-center"></i> <span className="font-bold text-sm">Disconnect</span></div></button>
                    </div>
                    <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest pt-4">EarnYard v3.0 • Secure</p>
                </div>
                )}
            </main>

            {/* Bottom Nav - Floating Dock */}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-2xl border border-white/10 rounded-full px-6 py-4 flex items-center gap-8 shadow-2xl z-50">
                <NavIcon icon="fa-house" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
                <NavIcon icon="fa-briefcase" active={activeTab === 'work'} onClick={() => setActiveTab('work')} />
                <div className="w-12 h-12 bg-emerald-500 rounded-full -mt-10 border-4 border-slate-900 flex items-center justify-center shadow-lg shadow-emerald-500/50 cursor-pointer active:scale-90 transition-transform" onClick={() => setIsSupportOpen(true)}>
                    <i className="fas fa-comment-dots text-white"></i>
                </div>
                <NavIcon icon="fa-rocket" active={activeTab === 'hub'} onClick={() => setActiveTab('hub')} />
                <NavIcon icon="fa-users" active={activeTab === 'community'} onClick={() => setActiveTab('community')} />
                <NavIcon icon="fa-user" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
            </nav>

            {/* --- MODALS (Bottom Sheets) --- */}
            
            {/* Top Up Modal with Restored Paystack Structure */}
            <BottomSheet isOpen={showTopupModal} onClose={() => { setShowTopupModal(false); setTopupStep(1); }} title="Add Funds">
                <div className="space-y-6">
                    {topupStep === 1 ? (
                        <>
                            <div className="bg-white/5 p-6 rounded-3xl text-center border border-white/5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Amount (USD)</label>
                                <div className="flex items-center justify-center gap-1">
                                    <span className="text-2xl text-emerald-500 font-bold">$</span>
                                    <input type="number" value={topupAmount} onChange={e => setTopupAmount(e.target.value)} className="bg-transparent text-5xl font-black text-white text-center w-32 outline-none placeholder:text-slate-700" placeholder="0" />
                                </div>
                                <p className="text-xs text-slate-500 mt-2 font-bold">≈ {depositGhs.toFixed(2)} GHS</p>
                            </div>
                            <button onClick={() => parseFloat(topupAmount) >= 1 ? setTopupStep(2) : alert("Min $1")} className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-transform">Proceed to Payment</button>
                        </>
                    ) : (
                        <div className="animate-in">
                            <button onClick={() => setTopupStep(1)} className="text-xs text-slate-400 font-bold mb-4 flex items-center gap-2 hover:text-white"><i className="fas fa-arrow-left"></i> Back to Amount</button>
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl mb-4">
                                <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mb-1">Payable Amount</p>
                                <p className="text-3xl font-black text-white">${parseFloat(topupAmount).toFixed(2)}</p>
                            </div>
                            <div className="space-y-4">
                                <a href={PAYSTACK_URL} target="_blank" className="block w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-xs uppercase text-center tracking-wider shadow-lg hover:bg-slate-200 transition-colors">
                                    Pay with Paystack <i className="fas fa-external-link-alt ml-1"></i>
                                </a>
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-white/10"></div></div>
                                    <div className="relative flex justify-center"><span className="bg-[#0f172a] px-2 text-[10px] text-slate-500 font-bold uppercase">Then</span></div>
                                </div>
                                <InputGroup label="Enter Transaction ID / Reference" value={topupTxId} onChange={setTopupTxId} placeholder="e.g. T12345678" />
                                <button onClick={handleTopupSubmit} className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-transform">Submit Verification</button>
                            </div>
                        </div>
                    )}
                </div>
            </BottomSheet>

            <BottomSheet isOpen={showWithdrawalModal} onClose={() => setShowWithdrawalModal(false)} title="Withdraw">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 mb-2">
                        <button onClick={() => setWithdrawNetwork('momo')} className={`p-4 rounded-2xl font-bold text-xs border ${withdrawNetwork === 'momo' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}>Mobile Money</button>
                        <button onClick={() => setWithdrawNetwork('usdt')} className={`p-4 rounded-2xl font-bold text-xs border ${withdrawNetwork === 'usdt' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}>USDT (TRC20)</button>
                    </div>
                    <InputGroup label="Amount ($)" value={withdrawAmount} onChange={setWithdrawAmount} type="number" />
                    <InputGroup label={withdrawNetwork === 'momo' ? 'Phone Number' : 'Wallet Address'} value={withdrawAddress} onChange={setWithdrawAddress} />
                    <InputGroup label="Account Name" value={withdrawName} onChange={setWithdrawName} />
                    <div className="bg-white/5 p-4 rounded-2xl flex justify-between items-center text-xs">
                        <span className="text-slate-400">Net Receive</span>
                        <span className="font-black text-white text-lg">${withdrawalCalcs.net.toFixed(2)}</span>
                    </div>
                    <button onClick={handleWithdrawalSubmit} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-transform">Request Payout</button>
                </div>
            </BottomSheet>

            <BottomSheet isOpen={showPremiumModal} onClose={() => { setShowPremiumModal(false); setSelectedPremiumPlan(null); }} title="Yard+ Premium">
                {!selectedPremiumPlan ? (
                    <div className="space-y-3">
                        <PlanCard tier={3} title="Basic+" desc="Essential perks" onClick={() => setSelectedPremiumPlan(3)} />
                        <PlanCard tier={6} title="Standard" desc="Most Popular" onClick={() => setSelectedPremiumPlan(6)} featured />
                        <PlanCard tier={9} title="Elite Pro" desc="Max priority" onClick={() => setSelectedPremiumPlan(9)} />
                    </div>
                ) : (
                    <div className="space-y-4 animate-in">
                        <button onClick={() => setSelectedPremiumPlan(null)} className="text-xs text-slate-400 font-bold mb-2 flex items-center gap-2"><i className="fas fa-arrow-left"></i> Back</button>
                        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-center">
                            <p className="text-amber-500 font-black text-2xl">${selectedPremiumPlan}</p>
                            <p className="text-amber-500/60 text-[10px] uppercase font-bold tracking-widest">Plan Cost</p>
                        </div>
                        <a href={PAYSTACK_URL} target="_blank" className="block w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-xs uppercase text-center tracking-wider shadow-lg">Pay Now</a>
                        <InputGroup label="Paste Transaction ID" value={premiumTxId} onChange={setPremiumTxId} placeholder="Tx Ref..." />
                        <button onClick={handleVerifyPremium} disabled={!premiumTxId} className="w-full bg-amber-500 text-slate-900 py-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg disabled:opacity-50">Activate Plan</button>
                    </div>
                )}
            </BottomSheet>

            <BottomSheet isOpen={showSpinModal} onClose={() => { setShowSpinModal(false); setSpinResult(null); }} title="Lucky Grid">
                <div className="text-center mb-6">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{canFreeSpin ? 'Free Daily Spin Available' : 'Cost: $0.50'}</p>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-6 relative">
                    <div className="absolute inset-0 bg-purple-500 blur-[60px] opacity-20 pointer-events-none"></div>
                    {spinPrizes.map((prize, idx) => (
                        <div key={idx} className={`aspect-square rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-300 border ${
                            isSpinning ? 'bg-white/5 border-white/5 text-slate-600 animate-pulse' :
                            spinResult === prize ? 'bg-emerald-500 border-emerald-400 text-white scale-110 shadow-[0_0_20px_#10b981] z-10' : 'bg-white/10 border-white/5 text-white'
                        }`}>
                            {prize === 0 ? ':(' : `$${prize.toFixed(2)}`}
                        </div>
                    ))}
                </div>
                {spinResult !== null ? (
                    <button onClick={() => { setShowSpinModal(false); setSpinResult(null); }} className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-xs uppercase shadow-lg">Claim Prize</button>
                ) : (
                    <button onClick={handleSpin} disabled={isSpinning} className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg shadow-purple-500/30 active:scale-95 transition-transform disabled:opacity-50">
                        {isSpinning ? 'Spinning...' : canFreeSpin ? 'Spin Free' : 'Pay & Spin'}
                    </button>
                )}
            </BottomSheet>

            {/* Session Chat - Full Screen Glass */}
            {activeSession && (
                <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col animate-slide-up">
                    <div className="p-4 flex items-center justify-between bg-white/5 border-b border-white/5 backdrop-blur-xl">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setActiveSession(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"><i className="fas fa-arrow-left text-xs"></i></button>
                            <div><p className="font-black text-white text-sm">Order #{activeSession.id.slice(-4)}</p><p className="text-[10px] text-slate-400">{activeSession.status}</p></div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {activeSession.messages?.map((msg, i) => (
                            <div key={i} className={`flex ${msg.senderId === 'system' ? 'justify-center' : msg.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                                {msg.senderId === 'system' ? (
                                    <span className="bg-white/10 text-slate-300 text-[10px] px-3 py-1 rounded-full">{msg.text}</span>
                                ) : (
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium ${msg.senderId === currentUser?.id ? 'bg-emerald-500 text-white rounded-tr-sm' : 'bg-white/10 text-white rounded-tl-sm'}`}>
                                        {msg.text}
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={sessionChatRef} />
                    </div>
                    <div className="p-4 bg-slate-900 border-t border-white/10">
                        <div className="flex gap-2">
                            <input value={sessionChatInput} onChange={e => setSessionChatInput(e.target.value)} className="flex-1 bg-white/5 rounded-xl px-4 text-white text-sm outline-none border border-white/5 focus:border-emerald-500 transition-colors" placeholder="Message..." />
                            <button onClick={handleSendSessionMessage} className="bg-emerald-500 text-white w-12 h-12 rounded-xl flex items-center justify-center"><i className="fas fa-paper-plane"></i></button>
                        </div>
                    </div>
                </div>
            )}

            {/* Support Full Screen */}
            {isSupportOpen && (
                <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-slide-up">
                    <header className="p-6 flex justify-between items-center border-b border-white/10">
                        <h2 className="text-xl font-black text-white">Support</h2>
                        <button onClick={() => setIsSupportOpen(false)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"><i className="fas fa-times"></i></button>
                    </header>
                    <div className="p-2 flex gap-2">
                        <button onClick={() => setSupportTab('ai')} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-all ${supportTab === 'ai' ? 'bg-white text-slate-900' : 'bg-white/5 text-slate-400'}`}>AI Agent</button>
                        <button onClick={() => setSupportTab('admin')} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-all ${supportTab === 'admin' ? 'bg-white text-slate-900' : 'bg-white/5 text-slate-400'}`}>Ticket</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {supportTab === 'ai' ? (
                            aiMessages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-4 rounded-2xl text-xs font-medium leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white/10 text-slate-200 rounded-bl-none'}`}>{m.text}</div>
                                </div>
                            ))
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-white/5 p-4 rounded-2xl text-center"><i className="fas fa-headset text-2xl text-slate-400 mb-2"></i><p className="text-xs text-slate-400">Submit a request to human staff.</p></div>
                                <input placeholder="Subject" value={adminSubject} onChange={e => setAdminSubject(e.target.value)} className="w-full bg-white/5 p-4 rounded-xl text-white outline-none border border-white/5" />
                                <textarea placeholder="Message" value={adminMessage} onChange={e => setAdminMessage(e.target.value)} className="w-full bg-white/5 p-4 rounded-xl text-white outline-none border border-white/5 h-32" />
                                <button onClick={() => { handleSendAdminComplain(); setIsSupportOpen(false); }} className="w-full bg-white text-slate-900 py-4 rounded-xl font-black text-xs uppercase">Send Ticket</button>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                    {supportTab === 'ai' && (
                        <div className="p-4 bg-slate-900 border-t border-white/10 flex gap-2">
                            <input value={aiQuery} onChange={e => setAiQuery(e.target.value)} className="flex-1 bg-white/5 rounded-xl px-4 py-3 text-white text-xs outline-none" placeholder="Ask AI..." onKeyDown={e => e.key === 'Enter' && handleSendAiQuery()} />
                            <button onClick={handleSendAiQuery} className="bg-blue-600 w-10 h-10 rounded-xl flex items-center justify-center text-white"><i className="fas fa-paper-plane"></i></button>
                        </div>
                    )}
                </div>
            )}

            {/* Editing Profile Modal (Full Screen) */}
            {isEditingProfile && (
                <div className="fixed inset-0 z-[100] bg-slate-950 p-6 overflow-y-auto animate-slide-up">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-black text-white">Edit Profile</h2>
                        <button onClick={() => setIsEditingProfile(false)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white"><i className="fas fa-times"></i></button>
                    </div>
                    <div className="flex flex-col items-center mb-8">
                        <div onClick={() => handleScreenshotUpload(setEditProfilePic)} className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border-2 border-dashed border-white/20 mb-2 relative">
                            {editProfilePic ? <img src={editProfilePic} className="w-full h-full object-cover" /> : <i className="fas fa-camera text-white/50 text-2xl"></i>}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tap to change</p>
                    </div>
                    <div className="space-y-4">
                        <InputGroup label="Name" value={editName} onChange={setEditName} />
                        <InputGroup label="Email" value={editEmail} onChange={setEditEmail} />
                        <InputGroup label="Phone" value={editPhone} onChange={setEditPhone} />
                        <InputGroup label="Country" value={editCountry} onChange={setEditCountry} />
                        <InputGroup label="Password" value={editPassword} onChange={setEditPassword} type="password" />
                        <button onClick={handleUpdateProfile} className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg mt-4">Save Changes</button>
                    </div>
                </div>
            )}

            {/* Notifications Modal (Bottom Sheet) */}
            <BottomSheet isOpen={showNotificationModal} onClose={() => setShowNotificationModal(false)} title="Alerts">
                <div className="space-y-3">
                    {[...(currentUser?.targetedNotifications || []), ...config.notifications].length === 0 && <p className="text-center text-slate-500 text-xs py-8">No alerts yet.</p>}
                    {[...(currentUser?.targetedNotifications || []), ...config.notifications].map((note, idx) => (
                        <div key={idx} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                            <p className="text-xs text-slate-300 leading-relaxed font-medium">{note}</p>
                        </div>
                    ))}
                </div>
            </BottomSheet>

            {/* History Modal (Full Screen) */}
            {showHistoryModal && (
                <div className="fixed inset-0 z-[100] bg-slate-950 p-6 overflow-y-auto animate-slide-up">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black text-white">History</h2>
                        <button onClick={() => setShowHistoryModal(false)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white"><i className="fas fa-times"></i></button>
                    </div>
                    <div className="space-y-3">
                        {historyTx.map(tx => (
                            <div key={tx.id} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <div className="flex justify-between mb-1">
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${tx.type === 'deposit' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-slate-300'}`}>{tx.type}</span>
                                    <span className="text-[10px] text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <p className="text-lg font-black text-white">${tx.amount.toFixed(2)}</p>
                                    <span className={`text-[10px] font-bold uppercase ${tx.status === 'pending' ? 'text-amber-500' : 'text-slate-400'}`}>{tx.status}</span>
                                </div>
                                <div className="mt-2 pt-2 border-t border-white/5 flex justify-between">
                                    <span className="text-[10px] font-mono text-slate-600 truncate w-32">{tx.id}</span>
                                    <button onClick={() => { navigator.clipboard.writeText(tx.id); alert("Copied"); }} className="text-slate-500"><i className="fas fa-copy text-xs"></i></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    </div>
  );
};

// --- Reusable UI Components ---

const ActionButton = ({ icon, label, color, onClick }: any) => (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group">
        <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg shadow-white/5 active:scale-90 transition-transform group-hover:brightness-110`}>
            <i className={`fas ${icon} text-lg`}></i>
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide group-hover:text-white transition-colors">{label}</span>
    </button>
);

const NavIcon = ({ icon, active, onClick }: any) => (
    <button onClick={onClick} className={`relative transition-all duration-300 ${active ? '-translate-y-2' : 'hover:-translate-y-1'}`}>
        <i className={`fas ${icon} text-lg ${active ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}></i>
        {active && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full shadow-[0_0_10px_#34d399]"></div>}
    </button>
);

const BottomSheet = ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-[#0f172a] w-full max-w-md rounded-t-[2.5rem] border-t border-white/10 p-6 relative animate-slide-up shadow-2xl">
                <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6"></div>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-white">{title}</h3>
                    <button onClick={onClose} className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-slate-400"><i className="fas fa-times"></i></button>
                </div>
                {children}
            </div>
        </div>
    );
};

const InputGroup = ({ label, value, onChange, type="text", placeholder }: any) => (
    <div>
        <label className="text-[10px] font-black uppercase text-slate-500 ml-1 mb-1 block tracking-wider">{label}</label>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white text-sm font-bold outline-none focus:border-emerald-500 transition-colors" />
    </div>
);

const PlanCard = ({ tier, title, desc, onClick, featured }: any) => (
    <button onClick={onClick} className={`w-full p-4 rounded-2xl flex justify-between items-center transition-transform active:scale-95 ${featured ? 'bg-gradient-to-r from-amber-500/20 to-yellow-600/20 border border-amber-500/50' : 'bg-white/5 border border-white/10'}`}>
        <div className="text-left">
            <p className={`font-black text-sm ${featured ? 'text-amber-400' : 'text-white'}`}>{title}</p>
            <p className="text-[10px] text-slate-400">{desc}</p>
        </div>
        <span className={`text-xl font-black ${featured ? 'text-amber-400' : 'text-white'}`}>${tier}</span>
    </button>
);

const TaskCard = ({ task, registered, submitted, onClick, isFrozen, darkMode }: any) => (
  <button onClick={onClick} disabled={isFrozen} className={`w-full p-4 rounded-2xl flex justify-between items-center active:scale-95 transition-all text-left group disabled:opacity-60 disabled:pointer-events-none bg-white/5 border border-white/5 hover:bg-white/10`}>
     <div className="flex items-center gap-4 overflow-hidden">
         <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg shadow-inner shrink-0 transition-colors ${submitted ? 'bg-emerald-500 text-white' : registered ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-400 group-hover:text-white'}`}>
             <i className={`fas ${submitted ? 'fa-check' : registered ? 'fa-spinner fa-spin' : 'fa-play'}`}></i>
         </div>
         <div className="flex-1 min-w-0">
             <p className={`font-black text-sm truncate text-white`}>{task.title}</p>
             <div className="flex items-center gap-2 mt-1">
                 <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-tight">${task.reward.toFixed(2)}</span>
                 <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{task.currentParticipations}/{task.maxParticipations}</span>
             </div>
         </div>
     </div>
     <i className="fas fa-chevron-right text-xs text-slate-600 group-hover:text-white transition-colors"></i>
  </button>
);

export default App;
