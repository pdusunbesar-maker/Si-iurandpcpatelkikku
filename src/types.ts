export type UserRole = 'bendahara' | 'anggota';

export interface Member {
  id: string;
  nama: string;
  gelar: string;
  nap: string; // Nomor Anggota Patelki
  noWa: string;
  instansi: string;
  jabatan?: string;
  status: 'aktif' | 'nonaktif';
  foto?: string;
  tanggalBergabung: string;
  email?: string;
  alamat?: string;
  nik?: string;
  password?: string;
  pin?: string;
}

export interface DuesRecord {
  memberId: string;
  year: number;
  month: number; // 1 - 12
  status: 'paid' | 'pending' | 'unpaid' | 'inactive';
  paymentId?: string;
  amount: number;
  updatedAt?: string;
}

export interface PaymentSubmission {
  id: string;
  memberId: string;
  memberName: string;
  memberNap: string;
  memberWa: string;
  memberInstansi: string;
  months: { year: number; month: number }[];
  totalAmount: number;
  bankAccountId: string;
  bankName: string;
  accountNumber: string;
  proofUrl: string;
  proofName?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  notes?: string;
}

export type TransactionType = 'income' | 'expense';

export interface CashTransaction {
  id: string;
  date: string;
  type: TransactionType;
  category: string;
  subCategory?: string;
  sourceOrRecipient: string;
  amount: number;
  description: string;
  proofUrl?: string;
  relatedPaymentId?: string;
  recordedBy?: string;
  createdAt: string;
}

export interface Donation {
  id: string;
  date: string;
  donorName: string;
  donorContact?: string;
  amount: number;
  type: 'uang' | 'barang' | 'lainnya';
  purpose: string;
  description: string;
  proofUrl?: string;
  createdAt: string;
}

export interface SocialServiceExpense {
  id: string;
  item: string;
  amount: number;
  notes?: string;
}

export interface SocialService {
  id: string;
  title: string;
  date: string;
  location: string;
  fundSource: string;
  totalBudget: number;
  totalSpent: number;
  beneficiaries: string; // e.g., "150 Warga Desa Sukadana"
  description: string;
  documentationUrls: string[];
  expenses: SocialServiceExpense[];
  createdAt: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  qrisUrl?: string;
  isActive: boolean;
  isPrimary: boolean;
  notes?: string;
}

export interface AppNotification {
  id: string;
  recipientId: string; // 'all' | 'bendahara' | memberId
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'danger';
  date: string;
  isRead: boolean;
  link?: string;
}

export interface AppSettings {
  organizationName: string;
  branchName: string;
  monthlyFee: number;
  startYear: number;
  endYear: number;
  address: string;
  contactWa: string;
  contactEmail: string;
  ketuaName: string;
  ketuaNap: string;
  bendaharaName: string;
  bendaharaNap: string;
  treasurerUsername?: string;
  treasurerPassword?: string;
  categoriesExpense: string[];
  categoriesIncome: string[];
  waTemplateApproved: string;
  waTemplateReminder: string;
  waTemplateRejected: string;
}
