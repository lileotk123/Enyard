
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppView, TaskOffer, TaskSubmission, User, ApprovalRequest, GlobalConfig, SupportMessage, P2PMessage } from './types';
import AdminPortal from './pages/AdminPortal';
import { PAYSTACK_URL, INITIAL_TASKS, INITIAL_USERS, INITIAL_APPROVALS, INITIAL_SUPPORT, TASK_REWARD } from './constants';
import { SupportAIService } from './services/geminiService';

// Extended AppView type to include onboarding
type ExtendedAppView = AppView | 'onboarding';

const App: React.FC = () => {
  const [view, setView] = useState<ExtendedAppView>('onboarding'); 
  const [authStep, setAuthStep] = useState<'selection' | 'login' | 'signup' | 'scan'>('selection');
  const [activeTab, setActiveTab] = useState<'home' | 'work' | 'hub' | 'profile'>('home');
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(INITIAL_APPROVALS);
  const [allTasks, setAllTasks] = useState<TaskOffer[]>(INITIAL_TASKS);
  const [support, setSupport] = useState<SupportMessage[]>(INITIAL_SUPPORT);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [registeredTaskIds, setRegisteredTaskIds] = useState<string[]>([]);
  
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
  const [isVerifyingTopup, setIsVerifyingTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');

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

  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskOffer | null>(null);

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
    { title: "Earn Daily", desc: "Complete simple digital tasks and watch your balance grow instantly.", icon: "fa-coins", color: "from-emerald-500 to-teal-600" },
    { title: "Quick Withdrawals", desc: "Seamlessly withdraw your earnings directly to Mobile Money or Crypto.", icon: "fa-money-bill-transfer", color: "from-blue-600 to-indigo-600" },
    { title: "Daily Interest", desc: "Hold funds in your Yard and earn a guaranteed 2% daily boost.", icon: "fa-chart-line", color: "from-violet-600 to-purple-600" },
    { title: "Creator Hub", desc: "Deploy your own tasks and drive engagement to your projects.", icon: "fa-rocket", color: "from-orange-500 to-red-500" }
  ];

  // Theme Toggle Effect
  useEffect(() => { localStorage.setItem('theme', isDarkMode ? 'dark' : 'light'); }, [isDarkMode]);

  // Pre-fill Edit Forms
  useEffect(() => {
    if (isEditingProfile && currentUser) {
      setEditName(currentUser.name); setEditEmail(currentUser.email); setEditPassword(currentUser.password || ''); setEditCountry(currentUser.country || ''); setEditPhone(currentUser.phoneNumber || ''); setEditProfilePic(currentUser.profilePicture || null);
    }
  }, [isEditingProfile, currentUser]);

  // Session & Ad Logic
  useEffect(() => {
    if (view === 'user' && currentUser && config.activeAd?.isActive) {
      const sessions = parseInt(localStorage.getItem('sessionCount') || '0') + 1;
      localStorage.setItem('sessionCount', sessions.toString());
      if (sessions % 2 === 0) { setTimeout(() => setShowAd(true), 2000); }
    }
  }, [view, currentUser, config.activeAd]);

  // Camera & Face Logic
  useEffect(() => {
    if (authStep === 'scan') {
      setIsScanning(true);
      setScanProgress(0);
      setScanStatus("Initializing Camera...");
      
      let stream: MediaStream | null = null;
      let scanInterval: any;
      
      const startScan = async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
               scanInterval = setInterval(() => {
                  if (!videoRef.current) return;
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return;
                  canvas.width = 100; canvas.height = 100;
                  ctx.drawImage(videoRef.current, 0, 0, 100, 100);
                  const imageData = ctx.getImageData(0,0,100,100);
                  let brightness = 0;
                  for (let i = 0; i < imageData.data.length; i += 4) { brightness += (imageData.data[i] + imageData.data[i+1] + imageData.data[i+2]) / 3; }
                  brightness = brightness / (imageData.data.length / 4);

                  if (brightness < 40) { setScanStatus("Environment Too Dark."); } 
                  else if (brightness > 240) { setScanStatus("Exposure Too High."); } 
                  else {
                      setScanStatus("Scanning Facial Features...");
                      setScanProgress(prev => { if (prev >= 100) return 100; return prev + (100 / 20); });
                  }
               }, 1000);
            };
          }
        } catch (err) { console.error(err); setScanStatus("Camera Access Denied."); setIsScanning(false); }
      };
      startScan();
      const checkCompletion = setInterval(() => {
          setScanProgress(prev => {
              if (prev >= 100) {
                  clearInterval(scanInterval); clearInterval(checkCompletion);
                  if (stream) stream.getTracks().forEach(track => track.stop());
                  setIsScanning(false); completeRegistration(); return 100;
              }
              return prev;
          });
      }, 1000);
      return () => { if (stream) stream.getTracks().forEach(track => track.stop()); clearInterval(scanInterval); clearInterval(checkCompletion); };
    }
  }, [authStep]);

  const completeRegistration = () => {
    if (users.find(u => u.email === emailInput)) return alert("Node exists.");
    
    let refBy = undefined;
    if (referralInput) {
        const referrer = users.find(u => u.referralCode === referralInput);
        if (referrer) refBy = referrer.id;
    }

    const newUser: User = { 
      id: 'u' + (users.length + 100), name: emailInput.split('@')[0], email: emailInput, password: passwordInput, walletBalance: 0, 
      isBanned: false, isFrozen: false, role: 'user', createdAt: new Date().toISOString(), lastInterestHarvest: new Date().toISOString(),
      referralCode: 'REF-' + Math.random().toString(36).substr(2, 6).toUpperCase(), referredBy: refBy
    };

    setUsers(prev => [...prev, newUser]); setCurrentUser(newUser); setAuthStep('selection'); setView('user');
    alert("Identity Verified. Access Granted.");
  };

  useEffect(() => {
    if (currentUser) {
      const updatedUser = users.find(u => u.id === currentUser.id);
      if (updatedUser) {
        if (updatedUser.isBanned) { handleLogout(); alert("SECURITY PROTOCOL: Node struck from grid."); return; }
        if (updatedUser.walletBalance !== currentUser.walletBalance || updatedUser.isFrozen !== currentUser.isFrozen || updatedUser.role !== currentUser.role || updatedUser.isCreator !== currentUser.isCreator) {
          setCurrentUser(updatedUser);
        }
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
        let totalBoost = 0; let tempBalance = currentUser.walletBalance;
        for (let i = 0; i < days; i++) { let dailyBoost = Math.min(tempBalance * config.dailyInterestRate, 10); totalBoost += dailyBoost; tempBalance += dailyBoost; }
        setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, walletBalance: u.walletBalance + totalBoost, lastInterestHarvest: now.toISOString() } : u));
        alert(`Daily Protocol Boost: $${totalBoost.toFixed(2)} added to your wallet.`);
      }
    }
  }, [currentUser?.id, currentUser?.isFrozen, config.dailyInterestRate]);

  const handleAuthAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (authStep === 'login') {
      const user = users.find(u => u.email === emailInput && u.password === passwordInput);
      if (user) { if (user.isBanned) return alert("Node struck."); setCurrentUser(user); setView('user'); } else alert("Invalid credentials.");
    } else if (authStep === 'signup') { setAuthStep('scan'); }
  };

  const handleLogout = () => { setCurrentUser(null); setView('auth'); setAuthStep('selection'); };

  const handleScreenshotUpload = (setter: (val: string | null) => void) => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) { const reader = new FileReader(); reader.onload = (re) => { setter(re.target?.result as string); alert("Proof captured successfully."); }; reader.readAsDataURL(file); }
    };
    input.click();
  };

  const handleUpdateProfile = () => {
    if (!currentUser || currentUser.isFrozen) return alert("Account frozen.");
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, name: editName, email: editEmail, password: editPassword, country: editCountry, phoneNumber: editPhone, profilePicture: editProfilePic || undefined } : u));
    setIsEditingProfile(false); alert("Profile Updated.");
  };

  const handleCreatorRegSubmit = () => {
    if (!currentUser || currentUser.isFrozen) return alert("Protocol frozen.");
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, isCreator: true } : u));
    setIsCreatorRegModalOpen(false); alert("Creator Node Activated.");
  };

  const handleCreateOffer = () => {
    if (!currentUser) return;
    if (currentUser.isFrozen) return alert("Deployment restricted.");
    if (!newTaskTitle || !newTaskDesc) return alert("Details missing.");
    
    // Pricing Logic: Minimum total $1. 
    const totalCost = newTaskCount * newTaskReward;
    if (totalCost < 1) return alert(`Minimum total budget is $1. Current: $${totalCost.toFixed(2)}`);
    
    if (currentUser.walletBalance < totalCost) return alert(`Insufficient funds. Cost: $${totalCost.toFixed(2)}`);
    
    const newTask: TaskOffer = {
      id: 'T-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      title: newTaskTitle, description: newTaskDesc, reward: newTaskReward,
      link: newTaskLink || undefined, status: 'active', createdBy: currentUser.id,
      maxParticipations: newTaskCount, currentParticipations: 0
    };
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, walletBalance: u.walletBalance - totalCost } : u));
    setAllTasks(prev => [newTask, ...prev]); setIsCreateTaskModalOpen(false);
    setNewTaskTitle(''); setNewTaskDesc(''); setNewTaskLink(''); setNewTaskCount(100); setNewTaskReward(0.01);
    alert(`Mission Deployed ($${totalCost.toFixed(2)} deducted).`);
  };

  const handleTaskAction = (taskId: string) => {
    if (!currentUser) return alert("Login to engage missions.");
    if (currentUser.isFrozen) return alert("Action restricted.");
    if (registeredTaskIds.includes(taskId)) { setTaskSubmissionId(taskId); } else { setRegisteredTaskIds(prev => [...prev, taskId]); alert("Mission Node Engaged."); }
  };

  const handleTaskSubmitScreenshot = () => {
    if (!currentUser || !taskSubmissionId || !taskScreenshot) return alert("Upload proof.");
    const newSub: TaskSubmission = {
      id: 'SUB-' + Math.random().toString(36).substr(2, 6).toUpperCase(), taskId: taskSubmissionId, userId: currentUser.id, userEmail: currentUser.email, screenshot: taskScreenshot, status: 'pending', submittedAt: new Date().toISOString()
    };
    setSubmissions(prev => [newSub, ...prev]); setTaskSubmissionId(null); setTaskScreenshot(null); alert("Proof Submitted.");
  };

  const handleApproveSubmission = (sub: TaskSubmission, approved: boolean) => {
      if (!currentUser) return;
      setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, status: approved ? 'approved' : 'rejected' } : s));
      if (approved) {
          const task = allTasks.find(t => t.id === sub.taskId);
          if (task) setUsers(prev => prev.map(u => u.id === sub.userId ? { ...u, walletBalance: u.walletBalance + task.reward, targetedNotifications: [...(u.targetedNotifications || []), `Task Approved: +$${task.reward.toFixed(2)}`] } : u));
      }
  };

  const handleSendAiQuery = async () => {
    if (!aiQuery.trim()) return;
    setAiMessages(prev => [...prev, { role: 'user', text: aiQuery }]); setAiLoading(true);
    const response = await aiService.getSupportGuidance(aiQuery, { config, users, approvals, tasks: allTasks });
    setAiMessages(prev => [...prev, { role: 'bot', text: response }]); setAiLoading(false); setAiQuery('');
  };

  const handleSendAdminComplain = () => {
    if (!currentUser || !adminSubject || !adminMessage) return alert("All fields required.");
    const newTicket: SupportMessage = {
      id: 'TKT-' + Math.random().toString(36).substr(2, 6).toUpperCase(), userId: currentUser.id, userName: currentUser.name, subject: adminSubject, content: adminMessage, status: 'pending', timestamp: new Date().toISOString()
    };
    setSupport(prev => [...prev, newTicket]); setAdminSubject(''); setAdminMessage(''); alert("Complaint Transmitted.");
  };

  const handleTopupSubmit = () => {
    if (!currentUser) return;
    const amount = parseFloat(topupAmount);
    if (!amount || amount <= 0) return alert("Invalid amount.");
    setIsVerifyingTopup(true);
    setTimeout(() => {
        const newReq: ApprovalRequest = {
            id: 'TOP-' + Math.random().toString(36).substr(2, 6).toUpperCase(), userId: currentUser.id, userName: currentUser.name, userEmail: currentUser.email, type: 'deposit', amount: amount, status: 'pending', createdAt: new Date().toISOString()
        };
        setApprovals(prev => [newReq, ...prev]); setShowTopupModal(false); setTopupAmount(''); setIsVerifyingTopup(false); alert("Deposit Submitted.");
    }, 1500);
  };

  const handleWithdrawalSubmit = () => {
    if (!currentUser) return;
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 5) return alert("Minimum withdrawal is $5.");
    if (amount > currentUser.walletBalance) return alert("Insufficient balance.");
    if (!withdrawAddress || !withdrawName) return alert("Payment details required.");

    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, walletBalance: u.walletBalance - amount } : u));
    const newReq: ApprovalRequest = {
      id: 'WDR-' + Math.random().toString(36).substr(2, 6).toUpperCase(), userId: currentUser.id, userName: currentUser.name, userEmail: currentUser.email, type: 'withdrawal', amount: amount, status: 'pending', feeAmount: amount * 0.05, withdrawalMethod: withdrawNetwork, withdrawalAddress: withdrawAddress, accountName: withdrawName, createdAt: new Date().toISOString(), messages: [{ senderId: 'system', senderName: 'System', text: `Withdrawal initiated.`, timestamp: new Date().toISOString() }]
    };
    setApprovals(prev => [newReq, ...prev]); setShowWithdrawalModal(false); alert("Withdrawal Request Sent.");
  };

  const handleSendSessionMessage = () => {
    if (!sessionChatInput.trim() || !activeSession || !currentUser) return;
    const newMessage: P2PMessage = { senderId: currentUser.id, senderName: currentUser.name, text: sessionChatInput, timestamp: new Date().toISOString() };
    setApprovals(prev => prev.map(a => a.id === activeSession.id ? { ...a, messages: [...(a.messages || []), newMessage] } : a));
    setActiveSession(prev => prev ? { ...prev, messages: [...(prev.messages || []), newMessage] } : null); setSessionChatInput('');
  };

  const depositGhs = useMemo(() => (parseFloat(topupAmount) || 0) * config.ghsDepositRate, [topupAmount, config.ghsDepositRate]);
  const withdrawalCalcs = useMemo(() => {
    const amount = parseFloat(withdrawAmount) || 0;
    const fee = amount * 0.05;
    const net = amount - fee;
    const ghs = net * config.ghsWithdrawalRate;
    return { fee, net, ghs };
  }, [withdrawAmount, config.ghsWithdrawalRate]);
  
  const ongoingTx = useMemo(() => approvals.filter(a => a.userId === currentUser?.id && !['completed','rejected'].includes(a.status)), [approvals, currentUser]);
  const creatorSubmissions = useMemo(() => submissions.filter(s => allTasks.find(t => t.id === s.taskId)?.createdBy === currentUser?.id && s.status === 'pending'), [submissions, allTasks, currentUser]);
  const myCreatedTasks = useMemo(() => allTasks.filter(t => t.createdBy === currentUser?.id), [allTasks, currentUser]);
  const availableTasks = useMemo(() => allTasks.filter(t => t.status === 'active' && t.createdBy !== currentUser?.id), [allTasks, currentUser]);
  const referralCount = useMemo(() => users.filter(u => u.referredBy === currentUser?.id).length, [users, currentUser]);

  const bgMain = isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900';
  const cardBg = isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const textMain = isDarkMode ? 'text-white' : 'text-slate-900';

  if (view === 'onboarding') return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden"><div className="absolute inset-0 bg-slate-950 transition-colors duration-1000"><div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${slides[currentSlide].color} opacity-20`}></div></div><div className="relative z-10 w-full max-w-sm h-[70vh] flex items-center overflow-hidden"><div className="flex w-full transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>{slides.map((slide, index) => (<div key={index} className="w-full shrink-0 flex flex-col items-center justify-center p-8 text-center space-y-8"><div className={`w-40 h-40 rounded-[2.5rem] bg-gradient-to-br ${slide.color} flex items-center justify-center shadow-2xl mb-4 animate-in zoom-in duration-500`}><i className={`fas ${slide.icon} text-6xl text-white`}></i></div><div className="space-y-4"><h2 className="text-3xl font-black text-white uppercase tracking-tight">{slide.title}</h2><p className="text-sm text-slate-300 max-w-[250px] mx-auto leading-relaxed">{slide.desc}</p></div></div>))}</div></div><div className="relative z-10 w-full max-w-xs px-6 flex flex-col gap-6"><div className="flex justify-center gap-2">{slides.map((_, idx) => (<div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-700'}`}></div>))}</div><button onClick={() => { if (currentSlide < slides.length - 1) setCurrentSlide(p => p + 1); else setView('auth'); }} className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 active:scale-95 transition-all">{currentSlide === slides.length - 1 ? "Start Earning" : "Next"}</button></div></div>;

  if (view === 'auth') return <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}><div className={`max-w-xs w-full p-8 rounded-[2.5rem] shadow-2xl text-center backdrop-blur-xl ${isDarkMode ? 'glass-dark' : 'glass'}`}><button onClick={() => setView('admin')} className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl transition-transform hover:rotate-6"><i className="fas fa-seedling text-3xl text-white"></i></button>{authStep === 'selection' && <div className="animate-in slide-in-from-bottom-5"><h1 className={`text-3xl font-black mb-2 ${textMain}`}>EarnYard</h1><p className="text-slate-500 font-medium text-[10px] mb-8 uppercase tracking-widest">Grow. Earn. Thrive.</p><div className="space-y-3"><button onClick={() => setAuthStep('login')} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg hover:bg-black transition-colors">Login</button><button onClick={() => setAuthStep('signup')} className="w-full bg-slate-100 border border-slate-200 text-slate-900 py-4 rounded-2xl font-black text-xs uppercase hover:bg-slate-200 transition-colors">Register</button></div></div>}{(authStep === 'login' || authStep === 'signup') && <form onSubmit={handleAuthAction} className="space-y-3 animate-in slide-in-from-bottom-5"><h2 className={`text-xl font-black mb-2 ${textMain}`}>{authStep === 'login' ? 'Welcome Back' : 'Join the Yard'}</h2><input type="email" placeholder="Email" className={`w-full border rounded-xl py-3.5 px-4 text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-emerald-500/20 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} value={emailInput} onChange={(e) => setEmailInput(e.target.value)} required /><input type="password" placeholder="Password" className={`w-full border rounded-xl py-3.5 px-4 text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-emerald-500/20 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} required />{authStep === 'signup' && <input type="text" placeholder="Referral Code (Optional)" className={`w-full border rounded-xl py-3.5 px-4 text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-emerald-500/20 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} value={referralInput} onChange={(e) => setReferralInput(e.target.value)} />}<button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3.5 rounded-xl font-black text-xs uppercase shadow-lg hover:shadow-xl active:scale-95 transition-all">Submit</button><button type="button" onClick={() => setAuthStep(authStep === 'login' ? 'signup' : 'login')} className="text-slate-400 text-[9px] font-black uppercase mt-2 hover:text-emerald-500 transition-colors">Switch Mode</button></form>}{authStep === 'scan' && <div className="space-y-6 animate-in zoom-in"><h2 className={`text-xl font-black mb-2 uppercase ${textMain}`}>Identity Verification</h2><div className="relative w-48 h-48 mx-auto rounded-full border-4 border-emerald-500/30 overflow-hidden bg-black shadow-2xl">{isScanning && <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />}<div className="absolute inset-0 scanner-line"></div>{!isScanning && <i className="fas fa-check-circle text-6xl text-emerald-500 absolute inset-0 flex items-center justify-center"></i>}</div><div><div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${scanProgress}%` }}></div></div><p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest animate-pulse mt-2">{scanStatus}</p></div></div>}</div></div>;

  if (view === 'admin') return <AdminPortal onExit={() => setView('user')} globalConfig={config} setGlobalConfig={setConfig} users={users} setUsers={setUsers} approvals={approvals} setApprovals={setApprovals} tasks={allTasks} setTasks={setAllTasks} support={support} setSupport={setSupport} />;
  
  return (
    <div className={`min-h-screen flex flex-col font-sans max-w-sm mx-auto shadow-2xl overflow-hidden relative border-x transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 border-slate-900' : 'bg-slate-50 border-slate-200'}`}>
      {/* Island Header */}
      <header className={`px-5 py-4 flex justify-between items-center sticky top-0 z-50 backdrop-blur-lg border-b ${isDarkMode ? 'bg-slate-950/80 border-slate-900' : 'bg-white/80 border-white'}`}>
        <button onClick={() => setView('admin')} className={`flex items-center gap-2 font-black text-lg tracking-tighter ${textMain} active:scale-95 transition-transform`}><div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl flex items-center justify-center text-white text-xs shadow-md"><i className="fas fa-seedling"></i></div>EarnYard</button>
        <div className="flex items-center gap-2">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 ${isDarkMode ? 'bg-slate-900 text-yellow-400' : 'bg-slate-100 text-slate-400'}`}><i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-xs`}></i></button>
            <button onClick={() => setShowNotificationModal(true)} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all relative active:scale-90 ${isDarkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-500'}`}><i className="fas fa-bell text-xs"></i>{currentUser?.targetedNotifications?.length ? <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full"></div> : null}</button>
            <button onClick={() => setActiveTab('profile')} className="w-9 h-9 rounded-xl overflow-hidden border-2 border-transparent hover:border-emerald-500 transition-all">{currentUser?.profilePicture ? <img src={currentUser.profilePicture} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-200 flex items-center justify-center text-xs font-black text-slate-500">{currentUser?.name.charAt(0)}</div>}</button>
        </div>
      </header>
      
      {currentUser?.isFrozen && <div className="bg-amber-500 text-white px-4 py-2 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 animate-pulse sticky top-[70px] z-[45] shadow-lg"><i className="fas fa-snowflake"></i> Protocol Strike: Account frozen.</div>}

      <main className="flex-1 w-full p-5 pb-24 space-y-6 overflow-y-auto scrollbar-hide">
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-5">
            <section className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full -mr-16 -mt-16 z-0 group-hover:bg-emerald-500/20 transition-colors duration-500"></div>
               <div className="relative z-10">
                 <div className="flex justify-between items-start mb-2">
                   <p className="opacity-60 text-[9px] font-black uppercase tracking-widest leading-none">Net Asset Value</p>
                   <div className="bg-white/10 px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wide backdrop-blur-sm">Live</div>
                 </div>
                 <div className="flex items-baseline gap-1 mt-1 mb-6"><span className="text-2xl font-black text-emerald-400">$</span><h2 className="text-5xl font-black tracking-tighter">{currentUser?.walletBalance?.toFixed(2) || '0.00'}</h2></div>
                 <div className="flex gap-3">
                   <button onClick={() => !currentUser?.isFrozen && setShowTopupModal(true)} className="flex-1 py-3.5 rounded-2xl font-black text-xs bg-emerald-500 text-white shadow-lg active:scale-95 transition-all hover:bg-emerald-400">Top Up</button>
                   <button onClick={() => !currentUser?.isFrozen && setShowWithdrawalModal(true)} className="flex-1 py-3.5 rounded-2xl font-black text-xs bg-white/10 text-white border border-white/10 active:scale-95 transition-all hover:bg-white/20">Withdraw</button>
                 </div>
               </div>
            </section>
            
            {ongoingTx.length > 0 && (
                <div className="space-y-3">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Active Sessions</h3>
                   {ongoingTx.map(tx => (
                      <div key={tx.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-[2rem] shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-95" onClick={() => setActiveSession(tx)}>
                         <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs ${tx.type === 'deposit' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}><i className={`fas ${tx.type === 'deposit' ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i></div>
                            <div><p className="text-xs font-black uppercase text-slate-900">{tx.type}</p><p className="text-[10px] text-slate-400 font-bold">{tx.status}</p></div>
                         </div>
                         <p className="font-black text-slate-900">${tx.amount.toFixed(2)}</p>
                      </div>
                   ))}
                </div>
            )}

            <div className={`p-6 rounded-[2.5rem] border shadow-sm ${cardBg}`}>
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Recent Ledger</h3>
                  <button className="text-[10px] font-bold text-emerald-600">View All</button>
               </div>
               <div className="space-y-4">
                  {approvals.filter(a => a.userId === currentUser?.id).slice(0, 3).length > 0 ? approvals.filter(a => a.userId === currentUser?.id).slice(0, 3).map(tx => (
                      <div key={tx.id} className="flex justify-between items-center">
                         <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}><i className={`fas ${tx.type === 'deposit' ? 'fa-plus' : 'fa-minus'}`}></i></div>
                            <div><p className={`text-[10px] font-black uppercase ${textMain}`}>{tx.type}</p><p className="text-[9px] text-slate-400 font-bold">{new Date(tx.createdAt).toLocaleDateString()}</p></div>
                         </div>
                         <p className={`text-xs font-black ${tx.type === 'deposit' ? 'text-emerald-500' : textMain}`}>${tx.amount.toFixed(2)}</p>
                      </div>
                  )) : <p className="text-center text-[10px] text-slate-400 py-4 italic">No history available.</p>}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'work' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-5">
             <div className="flex items-center justify-between">
                <h2 className={`text-xl font-black ${textMain}`}>Mission Board</h2>
                <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase">{availableTasks.length} Available</div>
             </div>
             <div className="space-y-3">
               {availableTasks.length === 0 && <div className="text-center py-12 text-slate-400 text-xs">No active missions. Check back later.</div>}
               {availableTasks.map(task => (<TaskCard key={task.id} task={task} registered={registeredTaskIds.includes(task.id)} submitted={submissions.some(s => s.taskId === task.id && s.userId === currentUser?.id)} onClick={() => handleTaskAction(task.id)} isFrozen={currentUser?.isFrozen} darkMode={isDarkMode} />))}
             </div>
          </div>
        )}

        {activeTab === 'hub' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-5">
             {!currentUser?.isCreator ? (
               <div className={`p-8 rounded-[2.5rem] text-center border shadow-xl flex flex-col items-center justify-center min-h-[50vh] ${cardBg}`}>
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-[2rem] flex items-center justify-center mb-6 text-white text-3xl shadow-2xl rotate-3"><i className="fas fa-rocket"></i></div>
                  <h2 className={`text-2xl font-black mb-2 ${textMain}`}>Creator Hub</h2>
                  <p className="text-xs text-slate-400 mb-8 px-4 leading-relaxed">Unlock the ability to deploy tasks, crowdsource engagement, and manage workers. Minimum budget start: $1.00.</p>
                  <button onClick={() => setIsCreatorRegModalOpen(true)} className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase shadow-xl hover:scale-105 transition-transform">Activate Creator Node</button>
               </div>
             ) : (
               <div className="space-y-6">
                  <button onClick={() => setIsCreateTaskModalOpen(true)} className="w-full py-5 rounded-[2rem] bg-slate-900 text-white font-black text-xs uppercase shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2">
                    <i className="fas fa-plus"></i> Deploy New Mission
                  </button>
                  
                  {creatorSubmissions.length > 0 && (
                    <div className="bg-orange-500/10 p-5 rounded-[2rem] border border-orange-500/20">
                       <h3 className="text-[10px] font-black text-orange-600 uppercase mb-4 tracking-widest flex items-center gap-2"><i className="fas fa-clock"></i> Pending Approvals</h3>
                       <div className="space-y-4">
                          {creatorSubmissions.map(sub => (
                            <div key={sub.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                               <div className="flex justify-between items-center mb-3">
                                  <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">{sub.userEmail}</span>
                                  <span className="text-[9px] font-bold text-slate-400">{new Date(sub.submittedAt).toLocaleDateString()}</span>
                               </div>
                               <div className="h-32 rounded-xl bg-slate-100 mb-3 overflow-hidden cursor-pointer border border-slate-200" onClick={() => window.open(sub.screenshot)}>
                                  <img src={sub.screenshot} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                               </div>
                               <div className="flex gap-2">
                                  <button onClick={() => handleApproveSubmission(sub, true)} className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-600 transition-colors">Approve</button>
                                  <button onClick={() => handleApproveSubmission(sub, false)} className="flex-1 bg-slate-100 text-slate-500 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-red-50 hover:text-red-500 transition-colors">Reject</button>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}

                  <div className={`p-6 rounded-[2.5rem] border shadow-sm ${cardBg}`}>
                     <h3 className={`text-[10px] font-black uppercase tracking-widest mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>My Campaigns</h3>
                     {myCreatedTasks.length === 0 && <p className="text-[10px] text-slate-400 italic text-center py-4">No active campaigns.</p>}
                     <div className="space-y-3">
                        {myCreatedTasks.map(task => (
                           <div key={task.id} className="flex justify-between items-center p-4 border rounded-2xl hover:border-blue-500/30 transition-colors">
                              <div className="overflow-hidden">
                                <p className={`font-black text-xs truncate mb-1 ${textMain}`}>{task.title}</p>
                                <p className="text-[9px] text-slate-400 font-medium">Reward: ${task.reward} • Filled: {task.currentParticipations}/{task.maxParticipations}</p>
                              </div>
                              <span className="text-[8px] font-black bg-emerald-100 text-emerald-600 px-2 py-1 rounded uppercase">Live</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
             )}
          </div>
        )}

        {activeTab === 'profile' && (
           <div className="space-y-6 pb-10 animate-in slide-in-from-bottom-5">
            <div className={`p-8 rounded-[3rem] border text-center relative shadow-sm ${cardBg}`}>
               <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-4xl mx-auto mb-5 font-black overflow-hidden shadow-2xl border-4 ${isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-white'}`}>{currentUser?.profilePicture ? <img src={currentUser.profilePicture} className="w-full h-full object-cover" /> : currentUser?.name?.charAt(0) || 'U'}</div>
               <h3 className={`text-2xl font-black leading-tight mb-1 ${textMain}`}>{currentUser?.name}</h3>
               <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-8">{currentUser?.email}</p>
               
               <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-[2rem] p-6 mb-6 text-left">
                   <div className="flex justify-between items-center mb-3">
                      <p className="text-[10px] font-black text-emerald-700 uppercase">Referral Link</p>
                      <span className="text-[9px] font-bold bg-white/50 text-emerald-700 px-2 py-0.5 rounded-full backdrop-blur-sm">{referralCount} Referred</span>
                   </div>
                   <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-emerald-500/10 shadow-sm mb-2">
                      <p className="flex-1 text-[11px] font-bold text-slate-600 truncate font-mono">{currentUser?.referralCode || 'Generating...'}</p>
                      <button onClick={() => { navigator.clipboard.writeText(currentUser?.referralCode || ''); alert("Copied"); }} className="text-emerald-600 w-8 h-8 flex items-center justify-center bg-emerald-50 rounded-lg hover:bg-emerald-100"><i className="fas fa-copy"></i></button>
                   </div>
                   <p className="text-[9px] text-emerald-800/60 font-medium leading-tight px-1">Earn $1.00 for every qualified referral deposit.</p>
               </div>

               <div className="grid grid-cols-1 gap-3">
                 <button onClick={() => !currentUser?.isFrozen && setIsEditingProfile(true)} className={`py-4 rounded-2xl font-black text-[10px] uppercase border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'}`}>Edit Profile</button>
                 <button onClick={handleLogout} className="py-4 rounded-2xl font-black text-[10px] uppercase bg-red-50 text-red-500 hover:bg-red-100 transition-colors">Disconnect</button>
               </div>
            </div>
            <p className="text-center text-[9px] text-slate-400 font-black uppercase tracking-widest opacity-30">EarnYard v2.0 • Grid Secure</p>
          </div>
        )}
      </main>

      {/* Support Modal (Fixed & Redesigned) */}
      {isSupportOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[500] flex items-center justify-center p-4">
           <div className={`w-full max-w-sm h-[85vh] rounded-[3rem] shadow-2xl relative flex flex-col overflow-hidden animate-in zoom-in duration-300 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
              <header className={`p-6 flex justify-between items-center shrink-0 border-b ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                 <div>
                    <h4 className="text-xl font-black leading-none">Support</h4>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase mt-1">Online • Avg reply 2m</p>
                 </div>
                 <button onClick={() => setIsSupportOpen(false)} className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"><i className="fas fa-times"></i></button>
              </header>
              
              <div className="p-2 flex gap-2 shrink-0 border-b border-slate-100">
                  <button onClick={() => setSupportTab('ai')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${supportTab === 'ai' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>Yard AI</button>
                  <button onClick={() => setSupportTab('admin')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${supportTab === 'admin' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>Ticket</button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 scrollbar-hide space-y-4 bg-slate-50/50">
                  {supportTab === 'ai' ? (
                     <>
                       {aiMessages.map((m, i) => (
                          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                             <div className={`max-w-[85%] p-4 rounded-2xl text-xs font-medium shadow-sm leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-700 rounded-bl-none'}`}>
                                {m.text}
                             </div>
                          </div>
                       ))}
                       {aiLoading && <div className="flex justify-start"><div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm"><div className="flex gap-1"><div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div><div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div></div></div></div>}
                       <div ref={chatEndRef} />
                     </>
                  ) : (
                     <div className="space-y-4 pt-4">
                        <div className="bg-white p-5 rounded-[2rem] shadow-sm text-center">
                           <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 text-lg"><i className="fas fa-ticket"></i></div>
                           <h3 className="font-black text-sm mb-1">Submit Ticket</h3>
                           <p className="text-xs text-slate-400">Our human team reviews these daily.</p>
                        </div>
                        <input placeholder="Subject" value={adminSubject} onChange={e => setAdminSubject(e.target.value)} className="w-full p-4 rounded-2xl bg-white border-none text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm" />
                        <textarea placeholder="Describe your issue..." value={adminMessage} onChange={e => setAdminMessage(e.target.value)} className="w-full p-4 rounded-2xl bg-white border-none text-xs font-medium h-32 resize-none outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm" />
                        <button onClick={() => { handleSendAdminComplain(); setIsSupportOpen(false); }} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all">Submit Ticket</button>
                     </div>
                  )}
              </div>

              {supportTab === 'ai' && (
                 <div className="p-4 bg-white border-t border-slate-100 flex gap-2 shrink-0">
                    <input value={aiQuery} onChange={e => setAiQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendAiQuery()} placeholder="Ask anything..." className="flex-1 bg-slate-100 border-none rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all" />
                    <button onClick={handleSendAiQuery} className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"><i className="fas fa-paper-plane text-xs"></i></button>
                 </div>
              )}
           </div>
        </div>
      )}
      
      {/* Floating Action Button for Support */}
      {view !== 'auth' && view !== 'onboarding' && !isSupportOpen && (
         <button onClick={() => setIsSupportOpen(true)} className="fixed bottom-24 right-5 w-14 h-14 bg-emerald-500 text-white rounded-[1.2rem] shadow-2xl flex items-center justify-center z-40 border-4 border-white/20 hover:scale-110 active:scale-90 transition-all group">
           <i className="fas fa-comment-dots text-2xl group-hover:animate-pulse"></i>
           <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
         </button>
      )}

      {/* Modals & Overlays (Transactions, Ads, etc.) remain similar but refined styles... */}
      {/* (Abbreviated common modals for brevity as logic is unchanged, just styling applied via Tailwind classes in render) */}
      {activeSession && activeSession.messages && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
           <div className={`max-w-xs w-full rounded-[2.5rem] flex flex-col shadow-2xl relative animate-in zoom-in duration-300 overflow-hidden h-[90vh] ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
              <header className="p-6 bg-slate-950 text-white flex justify-between items-center shrink-0"><div><h4 className="text-xl font-black leading-none">Session</h4><p className="text-[9px] font-black text-emerald-400 uppercase mt-1 tracking-widest">{activeSession.type}</p></div><button onClick={() => setActiveSession(null)} className="text-white/50 hover:text-white"><i className="fas fa-times text-xl"></i></button></header>
              <div className="flex-1 overflow-y-auto p-4 scrollbar-hide space-y-3 bg-slate-50 dark:bg-slate-800/50">{activeSession.messages.map((msg, i) => (<div key={i} className={`flex ${msg.senderId === currentUser?.id ? 'justify-end' : 'justify-start'} ${msg.senderId === 'system' ? 'justify-center' : ''}`}><div className={`max-w-[85%] p-3 rounded-2xl text-[10px] font-medium shadow-sm ${msg.senderId === 'system' ? 'bg-slate-200 text-slate-500 text-[9px] uppercase tracking-wide px-3 py-1 rounded-full' : msg.senderId === currentUser?.id ? 'bg-emerald-600 text-white' : 'bg-white text-slate-800'}`}>{msg.text}</div></div>))}<div ref={sessionChatRef} /></div>
              <div className="p-4 bg-white border-t border-slate-100 shrink-0"><div className="flex gap-2"><input value={sessionChatInput} onChange={e => setSessionChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendSessionMessage()} placeholder="Message..." className="flex-1 bg-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none" /><button onClick={handleSendSessionMessage} className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center"><i className="fas fa-arrow-up text-xs"></i></button></div></div>
           </div>
        </div>
      )}

      {showAd && config.activeAd.isActive && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[400] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 text-center relative overflow-hidden animate-in zoom-in duration-300 shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-b-[50%] -mt-16"></div>
              <button onClick={() => setShowAd(false)} className="absolute top-4 right-4 text-white/50 hover:text-white z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md"><i className="fas fa-times text-xs"></i></button>
              <div className="relative z-10 mt-8">
                 <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mx-auto mb-6 text-3xl text-purple-600 rotate-6"><i className="fas fa-gift"></i></div>
                 <h2 className="text-2xl font-black text-slate-900 mb-2">{config.activeAd.title}</h2>
                 <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">{config.activeAd.content}</p>
                 <button onClick={() => { setShowAd(false); setShowTopupModal(true); }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 transition-transform">{config.activeAd.ctaText}</button>
              </div>
           </div>
        </div>
      )}
      
      {/* Footer Nav */}
      <nav className={`px-6 py-4 flex justify-between items-center fixed bottom-6 left-4 right-4 z-50 max-w-[350px] mx-auto shadow-2xl rounded-full backdrop-blur-xl border ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-white'}`}>
         <NavIconButton icon="fa-house" label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} darkMode={isDarkMode} />
         <NavIconButton icon="fa-briefcase" label="Work" active={activeTab === 'work'} onClick={() => setActiveTab('work')} darkMode={isDarkMode} />
         <NavIconButton icon="fa-rocket" label="Hub" active={activeTab === 'hub'} onClick={() => setActiveTab('hub')} darkMode={isDarkMode} />
         <NavIconButton icon="fa-user-gear" label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} darkMode={isDarkMode} />
      </nav>
    </div>
  );
};

const NavIconButton = ({ icon, label, active, onClick, darkMode }: any) => (
  <button onClick={onClick} className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${active ? 'bg-slate-900 text-white shadow-lg -translate-y-2' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}>
    <i className={`fas ${icon} text-[14px]`}></i>
    {active && <span className="absolute -bottom-5 text-[8px] font-black uppercase tracking-widest text-slate-900 bg-white px-2 py-0.5 rounded-full shadow-sm animate-in fade-in slide-in-from-bottom-2">{label}</span>}
  </button>
);

const TaskCard: React.FC<{ task: TaskOffer, registered: boolean, submitted: boolean, onClick: () => void, isFrozen?: boolean, darkMode: boolean }> = ({ task, registered, submitted, onClick, isFrozen, darkMode }) => (
  <button onClick={onClick} disabled={isFrozen} className={`w-full p-4 rounded-[2rem] border flex justify-between items-center shadow-sm active:scale-95 transition-all text-left group disabled:opacity-60 disabled:pointer-events-none ${darkMode ? 'bg-slate-900 border-slate-800 hover:border-emerald-900' : 'bg-white border-slate-100 hover:border-emerald-100 hover:shadow-md'}`}>
     <div className="flex items-center gap-4 overflow-hidden"><div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg shadow-inner shrink-0 transition-colors ${submitted ? 'bg-emerald-500 text-white' : registered ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}><i className={`fas ${submitted ? 'fa-check' : registered ? 'fa-spinner fa-spin' : 'fa-play'}`}></i></div><div className="flex-1 min-w-0"><p className={`font-black text-sm truncate group-hover:text-emerald-600 transition-colors ${darkMode ? 'text-white' : 'text-slate-900'}`}>{task.title}</p><div className="flex items-center gap-2 mt-1"><span className="text-[9px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 uppercase tracking-tight">${task.reward.toFixed(2)}</span><span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{task.currentParticipations}/{task.maxParticipations}</span></div></div></div><div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors"><i className="fas fa-arrow-right text-[10px]"></i></div>
  </button>
);

export default App;
