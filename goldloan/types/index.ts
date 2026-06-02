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
  createdAt: string;
}

export interface LoanItem {
  description: string;
  weightGrams: number;
  purity: string; // 22K, 24K, 18K, etc.
  estimatedValue: number;
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
