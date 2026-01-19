
export type AppView = 'user' | 'admin' | 'auth' | 'onboarding';

export interface WithdrawalAccount {
  type: 'momo' | 'usdt';
  details: string; // Phone Number / Wallet Address
  accountName?: string;
}

export interface P2PMessage {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userRank?: number;
  profilePic?: string;
  text: string;
  timestamp: string;
  isAdmin?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  phoneCode?: string;
  country?: string;
  profilePicture?: string;
  walletBalance: number;
  isBanned: boolean;
  isFrozen: boolean;
  isCreator?: boolean;
  role: 'user' | 'admin';
  createdAt: string;
  lastInterestHarvest?: string;
  targetedNotifications?: string[];
  withdrawalAccount?: WithdrawalAccount;
  referralCode?: string;
  referredBy?: string;
  referralEarnings?: number;
  referralBonusPaid?: boolean; // Track if the referrer has received the first-deposit bonus
  
  // New Features
  isPremium?: boolean;
  premiumExpiry?: string;
  lastDailySpin?: string; // ISO Date string
}

export interface TaskOffer {
  id: string;
  title: string;
  description: string;
  reward: number;
  link?: string;
  status: 'active' | 'completed' | 'pending';
  createdBy: 'admin' | string;
  maxParticipations: number;
  currentParticipations: number;
  views?: number;
  reviews?: { user: string; comment: string; rating: number }[];
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  userId: string;
  userEmail: string;
  screenshot?: string;
  status: 'pending' | 'approved' | 'rejected' | 'reported';
  submittedAt: string;
}

export interface ApprovalRequest {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  type: 'deposit' | 'withdrawal' | 'premium';
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed'; 
  // pending: User requested
  // approved: Admin approved deposit (funds added)
  // completed: Admin finalized withdrawal (funds moved to admin, user deducted)
  
  proofScreenshot?: string;
  messages?: P2PMessage[];
  createdAt: string;
  
  // Withdrawal specific
  withdrawalMethod?: 'usdt' | 'momo';
  withdrawalAddress?: string;
  accountName?: string;
  feeAmount?: number;
  
  // Premium specific
  planTier?: number;
}

export interface SupportMessage {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  content: string;
  status: 'pending' | 'responded';
  response?: string;
  timestamp: string;
}

export interface AdCampaign {
  id: string;
  title: string;
  content: string;
  ctaText: string;
  rewardAmount: number; // 0 for no reward
  isActive: boolean;
}

export interface GlobalConfig {
  dollarRate: number; // For NGN or other local display
  ghsDepositRate: number; // $1 to GHS for deposits
  ghsWithdrawalRate: number; // $1 to GHS for Withdrawals
  dailyInterestRate: number; // Default 0.02 (2%)
  notifications: string[];
  autoAdminActive: boolean;
  maintenanceMode: boolean;
  activeAd: AdCampaign;
}
