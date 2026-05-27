export interface BankAccount {
  id: string;
  bankName: string;
  accountName?: string;
  accountType: string;
  interestRate: number;
  compounding: 'Daily' | 'Monthly' | 'Quarterly' | 'Annually';
  minBalance: number;
  debitCardFees: number;
  benefits: string[];
  otherCharges: string;
  tag?: string | string[];
}

export interface CreditCard {
  id: string;
  cardName: string;
  bankName: string;
  category?: string[];
  network?: string | string[];
  rewardType: 'Cashback' | 'Points' | 'Miles' | string;
  fees?: {
    joiningFee: number;
    annualFee: number;
    renewalWaiver?: {
      threshold: number;
      description: string;
    };
  };
  forexCharges?: {
    markupPercentage: number;
    description: string;
  };
  totalSavings?: {
    category: string;
    value: number;
    unit: string;
    capLimit?: number;
  }[];
  eligibility?: {
    minCibil: number;
    minIncome: number;
    age?: {
      min: number;
      max: number;
    };
    employment?: string[];
  };
  rewards?: {
    type: string;
    rate?: {
      base: string;
      accelerated: string;
    };
    benefits?: {
      base: string;
      accelerated: string;
    };
    capping?: {
      earning: string;
      redemption: string;
    };
    welcomeBenefit?: string;
  };
  cardTip?: string;

  // Legacy fields for backward compatibility
  annualFee?: number;
  benefits?: string[];
  bestFor?: string;
  joiningFee?: number;
}

export interface FixedDeposit {
  id: string;
  bankName: string;
  tenureRange: string;
  interestRate: number;
  seniorCitizenRate: number;
  minAmount: number;
}
