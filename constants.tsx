
import { User, TaskOffer, ApprovalRequest, SupportMessage } from './types';

export const ADMIN_PASSWORD = '@Eotkzip881';
export const PAYSTACK_URL = 'https://paystack.shop/pay/g87siviqtf';
export const TASK_REWARD = 0.20;

// Production Ready: Only Admin/System Accounts
export const INITIAL_USERS: User[] = [
  { id: 'admin_user', name: 'EarnYard Admin', email: 'admin@earnyard.com', password: 'admin', walletBalance: 50000.00, isBanned: false, isFrozen: false, role: 'admin', createdAt: '2023-01-01', phoneNumber: '+000000000', country: 'Global' },
];

export const INITIAL_TASKS: TaskOffer[] = []; // Empty for production
export const INITIAL_APPROVALS: ApprovalRequest[] = []; // Empty for production
export const INITIAL_SUPPORT: SupportMessage[] = []; // Empty for production
