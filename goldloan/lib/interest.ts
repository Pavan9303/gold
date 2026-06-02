import { Loan } from '@/types';
import { differenceInDays, differenceInMonths, parseISO } from 'date-fns';

export function calculateInterest(loan: Loan, asOfDate: Date = new Date()) {
  const start = parseISO(loan.startDate);
  const monthsElapsed = Math.max(0, differenceInMonths(asOfDate, start));
  const daysElapsed = differenceInDays(asOfDate, start);

  // Monthly compound interest
  const monthlyRate = loan.interestRate / 100;
  const totalWithInterest = loan.principalAmount * Math.pow(1 + monthlyRate, monthsElapsed);
  const interestAccrued = totalWithInterest - loan.principalAmount;

  const totalDue = totalWithInterest;
  const outstandingBalance = Math.max(0, totalDue - loan.totalPaid);
  const interestDue = Math.max(0, interestAccrued - (loan.totalPaid > loan.principalAmount ? loan.totalPaid - loan.principalAmount : 0));

  return {
    principalAmount: loan.principalAmount,
    interestAccrued: Math.round(interestAccrued * 100) / 100,
    totalDue: Math.round(totalDue * 100) / 100,
    totalPaid: loan.totalPaid,
    outstandingBalance: Math.round(outstandingBalance * 100) / 100,
    monthsElapsed,
    daysElapsed,
    interestDue: Math.round(interestDue * 100) / 100,
    monthlyInterestAmount: Math.round(loan.principalAmount * monthlyRate * 100) / 100,
  };
}

export function isPaymentDueSoon(loan: Loan, daysThreshold = 3): boolean {
  const due = parseISO(loan.dueDate);
  const today = new Date();
  const daysUntilDue = differenceInDays(due, today);
  return daysUntilDue >= 0 && daysUntilDue <= daysThreshold;
}

export function isOverdue(loan: Loan): boolean {
  const due = parseISO(loan.dueDate);
  return new Date() > due && loan.status === 'active';
}

export function getMonthlyInterestDueDate(loan: Loan): Date {
  const start = parseISO(loan.startDate);
  const today = new Date();
  const monthsElapsed = differenceInMonths(today, start);
  const nextDue = new Date(start);
  nextDue.setMonth(nextDue.getMonth() + monthsElapsed + 1);
  return nextDue;
}
