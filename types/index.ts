export interface Shop {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  password: string;
  phone: string;
  whatsappEnabled: boolean;
  whatsappToken?: string;
  whatsappPhoneId?: string;
  address?: string;
  interestRate: number; // monthly % default
  createdAt: string;
}

export interface Customer {
  id: string;
  shopId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  aadharNumber?: string;
  profileImage?: string;
  createdAt: string;
}

export interface LoanItem {
  description: string;
  weightGrams: number;
  purity: string; // 22K, 24K, 18K, etc.
  purityPercentage?: number; // e.g. 91.6 for 22K
  estimatedValue: number;
  itemImage?: string;
}

export interface Loan {
  id: string;
  shopId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: LoanItem[];
  principalAmount: number;
  interestRate: number; // monthly %
  startDate: string;
  dueDate: string;
  durationPreset?: string; // '1d'|'3d'|'7d'|'1m'|'3m'|'6m'|'12m'|'custom'
  isCompoundInterest?: boolean; // undefined = compound (legacy), false = simple, true = compound
  status: 'active' | 'closed' | 'overdue';
  totalPaid: number;
  payments: Payment[];
  createdAt: string;
  notes?: string;
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  note?: string;
  type: 'interest' | 'principal' | 'both';
}

export interface ReminderLog {
  id: string;
  shopId: string;
  loanId: string;
  customerId: string;
  type: 'whatsapp' | 'system';
  message: string;
  sentAt: string;
  status: 'sent' | 'failed';
}
