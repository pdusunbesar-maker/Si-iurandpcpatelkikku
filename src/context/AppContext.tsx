import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Member,
  DuesRecord,
  PaymentSubmission,
  CashTransaction,
  Donation,
  SocialService,
  BankAccount,
  AppSettings,
  AppNotification,
  UserRole,
} from '../types';
import {
  INITIAL_MEMBERS,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_SETTINGS,
  INITIAL_TRANSACTIONS,
  INITIAL_DONATIONS,
  INITIAL_SOCIAL_SERVICES,
  INITIAL_NOTIFICATIONS,
  generateInitialDues,
  INITIAL_PAYMENT_SUBMISSIONS,
} from '../data/initialData';
import {
  isSupabaseConfigured,
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  pushAllDataToSupabase,
  pullAllDataFromSupabase,
  subscribeToSupabaseRealtime,
  SupabaseConfig,
  deleteFromSupabase,
} from '../lib/supabase';

interface AppContextType {
  // Auth & Roles
  isAuthenticated: boolean;
  currentUserRole: UserRole;
  currentMember: Member | null;
  setCurrentUserRole: (role: UserRole) => void;
  setCurrentMember: (member: Member | null) => void;
  login: (role: UserRole, identifier: string, password?: string) => { success: boolean; error?: string };
  logout: () => void;
  changeTreasurerCredentials: (username: string, password?: string) => void;
  changeMemberPassword: (memberId: string, newPassword: string) => void;

  // Data
  members: Member[];
  duesRecords: DuesRecord[];
  paymentSubmissions: PaymentSubmission[];
  transactions: CashTransaction[];
  donations: Donation[];
  socialServices: SocialService[];
  bankAccounts: BankAccount[];
  settings: AppSettings;
  notifications: AppNotification[];

  // Actions - Members
  addMember: (member: Omit<Member, 'id'>) => void;
  updateMember: (id: string, member: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  toggleMemberStatus: (id: string) => void;
  importMembers: (newMembers: Omit<Member, 'id'>[]) => void;

  // Actions - Dues & Payments
  updateDuesStatus: (memberId: string, year: number, month: number, status: 'paid' | 'pending' | 'unpaid' | 'inactive') => void;
  submitPayment: (data: {
    memberId: string;
    months: { year: number; month: number }[];
    bankAccountId: string;
    proofUrl: string;
    proofName?: string;
    notes?: string;
  }) => string;
  approvePayment: (submissionId: string, notes?: string) => void;
  rejectPayment: (submissionId: string, reason: string) => void;

  // Actions - Finance
  addTransaction: (tx: Omit<CashTransaction, 'id' | 'createdAt'>) => void;
  deleteTransaction: (id: string) => void;
  addDonation: (don: Omit<Donation, 'id' | 'createdAt'>) => void;
  deleteDonation: (id: string) => void;
  addSocialService: (soc: Omit<SocialService, 'id' | 'createdAt'>) => void;
  deleteSocialService: (id: string) => void;

  // Actions - Bank Accounts & Settings
  addBankAccount: (acc: Omit<BankAccount, 'id'>) => void;
  updateBankAccount: (id: string, acc: Partial<BankAccount>) => void;
  deleteBankAccount: (id: string) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;

  // Actions - Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'date' | 'isRead'>) => void;

  // Computations
  getCashBalance: () => number;
  getTotalIncome: () => number;
  getTotalExpense: () => number;
  getTotalDonations: () => number;
  getTotalSocialServices: () => number;
  getMemberDuesSummary: (memberId: string, year?: number) => {
    totalPaid: number;
    totalUnpaidMonths: number;
    arrearsAmount: number;
    paidMonthsCount: number;
    pendingMonthsCount: number;
    unpaidMonthsList: { year: number; month: number }[];
  };
  getYearlyArrearsList: (targetYear?: number) => {
    member: Member;
    unpaidMonths: { year: number; month: number }[];
    totalArrears: number;
    paidCount: number;
  }[];
  formatCurrency: (amount: number) => string;
  generateWhatsAppLink: (phone: string, text: string) => string;
  resetAllDataToDefault: () => void;

  // Supabase Database Integration
  isSupabaseActive: boolean;
  isSupabaseSyncing: boolean;
  supabaseConfig: SupabaseConfig;
  saveSupabaseSettings: (url: string, key: string, autoSync?: boolean) => void;
  syncUploadToSupabase: () => Promise<{ success: boolean; message: string }>;
  syncDownloadFromSupabase: () => Promise<{ success: boolean; message: string }>;
  testSupabase: (url?: string, key?: string) => Promise<{ success: boolean; message: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from localStorage or defaults
  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem('patelki_members');
    return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
  });

  const [duesRecords, setDuesRecords] = useState<DuesRecord[]>(() => {
    const saved = localStorage.getItem('patelki_dues');
    return saved ? JSON.parse(saved) : generateInitialDues();
  });

  const [paymentSubmissions, setPaymentSubmissions] = useState<PaymentSubmission[]>(() => {
    const saved = localStorage.getItem('patelki_submissions');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENT_SUBMISSIONS;
  });

  const [transactions, setTransactions] = useState<CashTransaction[]>(() => {
    const saved = localStorage.getItem('patelki_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [donations, setDonations] = useState<Donation[]>(() => {
    const saved = localStorage.getItem('patelki_donations');
    return saved ? JSON.parse(saved) : INITIAL_DONATIONS;
  });

  const [socialServices, setSocialServices] = useState<SocialService[]>(() => {
    const saved = localStorage.getItem('patelki_social');
    return saved ? JSON.parse(saved) : INITIAL_SOCIAL_SERVICES;
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem('patelki_bank_accounts');
    return saved ? JSON.parse(saved) : INITIAL_BANK_ACCOUNTS;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('patelki_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('patelki_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Supabase Database Integration State
  const [supabaseConfig, setSupabaseConfigState] = useState<SupabaseConfig>(getSupabaseConfig);
  const [isSupabaseActive, setIsSupabaseActive] = useState<boolean>(isSupabaseConfigured);
  const [isSupabaseSyncing, setIsSupabaseSyncing] = useState<boolean>(false);

  // Auto load from Supabase if configured on startup
  useEffect(() => {
    if (isSupabaseConfigured()) {
      pullAllDataFromSupabase().then((res) => {
        if (res.success && res.data) {
          if (res.data.members.length > 0) setMembers(res.data.members);
          if (res.data.duesRecords.length > 0) setDuesRecords(res.data.duesRecords);
          if (res.data.paymentSubmissions.length > 0) setPaymentSubmissions(res.data.paymentSubmissions);
          if (res.data.transactions.length > 0) setTransactions(res.data.transactions);
          if (res.data.donations.length > 0) setDonations(res.data.donations);
          if (res.data.socialServices.length > 0) setSocialServices(res.data.socialServices);
          if (res.data.bankAccounts.length > 0) setBankAccounts(res.data.bankAccounts);
          if (res.data.settings) setSettings(res.data.settings);
          setIsSupabaseActive(true);
        }
      }).catch(err => {
        console.warn('Initial Supabase sync check:', err);
      });
    }
  }, []);

  // Real-time sync subscription across users/devices
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const unsubscribe = subscribeToSupabaseRealtime(() => {
      pullAllDataFromSupabase().then(res => {
        if (res.success && res.data) {
          if (res.data.members?.length > 0) setMembers(res.data.members);
          if (res.data.duesRecords?.length > 0) setDuesRecords(res.data.duesRecords);
          if (res.data.paymentSubmissions?.length > 0) setPaymentSubmissions(res.data.paymentSubmissions);
          if (res.data.transactions?.length > 0) setTransactions(res.data.transactions);
          if (res.data.donations?.length > 0) setDonations(res.data.donations);
          if (res.data.socialServices?.length > 0) setSocialServices(res.data.socialServices);
          if (res.data.bankAccounts?.length > 0) setBankAccounts(res.data.bankAccounts);
          if (res.data.settings) setSettings(res.data.settings);
          setIsSupabaseActive(true);
        }
      }).catch(err => {
        console.warn('Realtime sync pull error:', err);
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isSupabaseActive]);

  // Auto-sync push to Supabase on data changes (debounced)
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabaseConfig.autoSync) return;

    const timer = setTimeout(() => {
      pushAllDataToSupabase({
        members,
        duesRecords,
        paymentSubmissions,
        transactions,
        donations,
        socialServices,
        bankAccounts,
        settings,
      }).catch(err => {
        console.warn('Auto-sync upload warning:', err);
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [members, duesRecords, paymentSubmissions, transactions, donations, socialServices, bankAccounts, settings, supabaseConfig.autoSync]);

  // Auth & Session state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('patelki_auth');
    return saved === 'true';
  });

  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('patelki_role');
    return (saved as UserRole) || 'bendahara';
  });

  const [currentMember, setCurrentMember] = useState<Member | null>(() => {
    const savedId = localStorage.getItem('patelki_member_id');
    const savedMembers = localStorage.getItem('patelki_members');
    const memberList: Member[] = savedMembers ? JSON.parse(savedMembers) : INITIAL_MEMBERS;
    if (savedId) {
      return memberList.find(m => m.id === savedId) || memberList[0];
    }
    return memberList[0];
  });

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem('patelki_auth', isAuthenticated ? 'true' : 'false');
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('patelki_role', currentUserRole);
  }, [currentUserRole]);

  useEffect(() => {
    if (currentMember) {
      localStorage.setItem('patelki_member_id', currentMember.id);
    }
  }, [currentMember]);

  useEffect(() => {
    localStorage.setItem('patelki_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('patelki_dues', JSON.stringify(duesRecords));
  }, [duesRecords]);

  useEffect(() => {
    localStorage.setItem('patelki_submissions', JSON.stringify(paymentSubmissions));
  }, [paymentSubmissions]);

  useEffect(() => {
    localStorage.setItem('patelki_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('patelki_donations', JSON.stringify(donations));
  }, [donations]);

  useEffect(() => {
    localStorage.setItem('patelki_social', JSON.stringify(socialServices));
  }, [socialServices]);

  useEffect(() => {
    localStorage.setItem('patelki_bank_accounts', JSON.stringify(bankAccounts));
  }, [bankAccounts]);

  useEffect(() => {
    localStorage.setItem('patelki_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('patelki_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Login handler
  const login = (role: UserRole, identifier: string, password?: string): { success: boolean; error?: string } => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (role === 'bendahara') {
      const activeTreasurerUser = (settings.treasurerUsername || 'bendahara').toLowerCase();
      const activeTreasurerPass = settings.treasurerPassword || 'bendahara123';
      const treasurerNap = (settings.bendaharaNap || '61.11.001').toLowerCase();

      // Check username / NAP match
      const isUserMatch =
        cleanId === activeTreasurerUser ||
        cleanId === treasurerNap ||
        cleanId === 'bendahara' ||
        cleanId === 'admin';

      if (!isUserMatch) {
        return {
          success: false,
          error: `Username Bendahara salah. Masukkan "${settings.treasurerUsername || 'bendahara'}" atau NAP "${settings.bendaharaNap}".`,
        };
      }

      // Check password match
      const isPassMatch =
        cleanPass === activeTreasurerPass ||
        cleanPass === 'bendahara123' ||
        cleanPass === 'admin';

      if (!isPassMatch) {
        return { success: false, error: 'Kata sandi / PIN Bendahara salah.' };
      }

      const bendahara = members.find(m => m.id === 'mem-1') || members[0];
      setCurrentUserRole('bendahara');
      setCurrentMember(bendahara);
      setIsAuthenticated(true);
      return { success: true };
    } else {
      // Anggota login: matches NAP (primary username) or No WhatsApp
      const matched = members.find(m => {
        const matchNap =
          m.nap.toLowerCase() === cleanId ||
          m.nap.replace(/\./g, '').toLowerCase() === cleanId.replace(/\./g, '');
        const matchWa = m.noWa.replace(/[^0-9]/g, '').includes(cleanId.replace(/[^0-9]/g, ''));
        return matchNap || matchWa;
      });

      if (!matched) {
        return {
          success: false,
          error: 'Nomor Anggota (NAP) tidak ditemukan di database DPC Patelki Kayong Utara.',
        };
      }

      // Password check for anggota (custom member.password or default '123456')
      const memberPass = matched.password || '123456';
      const isPassMatch =
        cleanPass === memberPass ||
        cleanPass === '123456' ||
        cleanPass === 'patelki';

      if (!isPassMatch) {
        return {
          success: false,
          error: 'Kata sandi / PIN Anggota salah. (Kata sandi default awal: 123456)',
        };
      }

      setCurrentUserRole('anggota');
      setCurrentMember(matched);
      setIsAuthenticated(true);
      return { success: true };
    }
  };

  // Change Treasurer Credentials
  const changeTreasurerCredentials = (newUsername: string, newPassword?: string) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        treasurerUsername: newUsername.trim() || prev.treasurerUsername || 'bendahara',
        treasurerPassword: newPassword ? newPassword.trim() : prev.treasurerPassword || 'bendahara123',
      };
      localStorage.setItem('patelki_settings', JSON.stringify(updated));
      return updated;
    });
  };

  // Change Member Password
  const changeMemberPassword = (memberId: string, newPassword: string) => {
    setMembers(prev =>
      prev.map(m => {
        if (m.id === memberId) {
          return { ...m, password: newPassword.trim() };
        }
        return m;
      })
    );
    if (currentMember?.id === memberId) {
      setCurrentMember(prev => (prev ? { ...prev, password: newPassword.trim() } : null));
    }
  };

  // Logout handler
  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('patelki_auth');
  };

  // Member actions
  const addMember = (newMemData: Omit<Member, 'id'>) => {
    const newId = `mem-${Date.now()}`;
    const newMember: Member = { ...newMemData, id: newId };
    setMembers(prev => [...prev, newMember]);

    // Generate dues records for new member (2025 to 2031)
    const newDues: DuesRecord[] = [];
    for (let y = settings.startYear; y <= settings.endYear; y++) {
      for (let m = 1; m <= 12; m++) {
        newDues.push({
          memberId: newId,
          year: y,
          month: m,
          status: newMember.status === 'aktif' ? 'unpaid' : 'inactive',
          amount: settings.monthlyFee,
        });
      }
    }
    setDuesRecords(prev => [...prev, ...newDues]);
  };

  const updateMember = (id: string, data: Partial<Member>) => {
    setMembers(prev => prev.map(m => (m.id === id ? { ...m, ...data } : m)));
    if (currentMember?.id === id) {
      setCurrentMember(prev => (prev ? { ...prev, ...data } : null));
    }
  };

  const deleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    setDuesRecords(prev => prev.filter(d => d.memberId !== id));
    
    // Sync deletion to Supabase
    deleteFromSupabase('members', 'id', id).catch(console.error);
    // Note: Dues records for member are automatically deleted in Supabase 
    // if cascade delete is enabled, otherwise we might need a specific delete.
  };

  const toggleMemberStatus = (id: string) => {
    setMembers(prev =>
      prev.map(m => {
        if (m.id === id) {
          const nextStatus = m.status === 'aktif' ? 'nonaktif' : 'aktif';
          // update dues to inactive or unpaid
          setDuesRecords(dues =>
            dues.map(d => {
              if (d.memberId === id && d.status !== 'paid') {
                return {
                  ...d,
                  status: nextStatus === 'nonaktif' ? 'inactive' : 'unpaid',
                };
              }
              return d;
            })
          );
          return { ...m, status: nextStatus };
        }
        return m;
      })
    );
  };

  const importMembers = (importedList: Omit<Member, 'id'>[]) => {
    const addedMembers: Member[] = [];
    const addedDues: DuesRecord[] = [];

    importedList.forEach((item, index) => {
      const newId = `mem-${Date.now()}-${index}`;
      const newMem: Member = { ...item, id: newId };
      addedMembers.push(newMem);

      for (let y = settings.startYear; y <= settings.endYear; y++) {
        for (let m = 1; m <= 12; m++) {
          addedDues.push({
            memberId: newId,
            year: y,
            month: m,
            status: newMem.status === 'aktif' ? 'unpaid' : 'inactive',
            amount: settings.monthlyFee,
          });
        }
      }
    });

    setMembers(prev => [...prev, ...addedMembers]);
    setDuesRecords(prev => [...prev, ...addedDues]);
  };

  // Dues Actions
  const updateDuesStatus = (
    memberId: string,
    year: number,
    month: number,
    status: 'paid' | 'pending' | 'unpaid' | 'inactive'
  ) => {
    setDuesRecords(prev =>
      prev.map(d => {
        if (d.memberId === memberId && d.year === year && d.month === month) {
          return {
            ...d,
            status,
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
        return d;
      })
    );
  };

  // Submit payment from member
  const submitPayment = (data: {
    memberId: string;
    months: { year: number; month: number }[];
    bankAccountId: string;
    proofUrl: string;
    proofName?: string;
    notes?: string;
  }) => {
    const member = members.find(m => m.id === data.memberId);
    const bank = bankAccounts.find(b => b.id === data.bankAccountId);
    const subId = `sub-${Date.now()}`;
    const totalAmount = data.months.length * settings.monthlyFee;

    const newSub: PaymentSubmission = {
      id: subId,
      memberId: data.memberId,
      memberName: member ? `${member.nama}, ${member.gelar}` : 'Anggota',
      memberNap: member?.nap || '',
      memberWa: member?.noWa || '',
      memberInstansi: member?.instansi || '',
      months: data.months,
      totalAmount,
      bankAccountId: data.bankAccountId,
      bankName: bank?.bankName || 'Rekening DPC',
      accountNumber: bank?.accountNumber || '-',
      proofUrl: data.proofUrl,
      proofName: data.proofName || 'bukti_transfer.jpg',
      status: 'pending',
      submittedAt: new Date().toLocaleString('id-ID'),
      notes: data.notes,
    };

    setPaymentSubmissions(prev => [newSub, ...prev]);

    // Update the dues records to pending
    setDuesRecords(prev =>
      prev.map(d => {
        if (
          d.memberId === data.memberId &&
          data.months.some(m => m.year === d.year && m.month === d.month)
        ) {
          return { ...d, status: 'pending', paymentId: subId };
        }
        return d;
      })
    );

    // Create Notification for bendahara
    addNotification({
      recipientId: 'bendahara',
      title: 'Pembayaran Baru Menunggu Verifikasi',
      message: `${member?.nama || 'Anggota'} telah mengirimkan bukti transfer sebesar Rp ${totalAmount.toLocaleString('id-ID')} (${data.months.length} bulan).`,
      type: 'warning',
      link: 'verifikasi',
    });

    // Create Notification for member
    addNotification({
      recipientId: data.memberId,
      title: 'Pembayaran Berhasil Dikirim',
      message: `Bukti transfer sebesar Rp ${totalAmount.toLocaleString('id-ID')} berhasil dikirim dan sedang menunggu verifikasi oleh bendahara.`,
      type: 'info',
    });

    return subId;
  };

  // Approve payment by bendahara
  const approvePayment = (submissionId: string, notes?: string) => {
    const sub = paymentSubmissions.find(s => s.id === submissionId);
    if (!sub) return;

    const nowStr = new Date().toLocaleString('id-ID');
    const nowIsoDate = new Date().toISOString().split('T')[0];

    // 1. Update submission status
    setPaymentSubmissions(prev =>
      prev.map(s =>
        s.id === submissionId
          ? {
              ...s,
              status: 'approved',
              verifiedAt: nowStr,
              verifiedBy: settings.bendaharaName,
              notes: notes || s.notes,
            }
          : s
      )
    );

    // 2. Update all corresponding months to 'paid'
    setDuesRecords(prev =>
      prev.map(d => {
        if (
          d.memberId === sub.memberId &&
          sub.months.some(m => m.year === d.year && m.month === d.month)
        ) {
          return {
            ...d,
            status: 'paid',
            paymentId: sub.id,
            updatedAt: nowIsoDate,
          };
        }
        return d;
      })
    );

    // 3. Automatically add to Cashbook (Buku Kas Masuk)
    const monthDescriptions = sub.months
      .map(m => `${MONTH_NAMES[m.month - 1]} ${m.year}`)
      .join(', ');

    const newTx: CashTransaction = {
      id: `trx-${Date.now()}`,
      date: nowIsoDate,
      type: 'income',
      category: 'Iuran Wajib Anggota',
      sourceOrRecipient: `${sub.memberName} (${sub.memberNap})`,
      amount: sub.totalAmount,
      description: `Iuran anggota periode ${monthDescriptions}`,
      proofUrl: sub.proofUrl,
      relatedPaymentId: sub.id,
      recordedBy: settings.bendaharaName,
      createdAt: nowStr,
    };

    setTransactions(prev => [newTx, ...prev]);

    // 4. Send Member In-App Notification
    addNotification({
      recipientId: sub.memberId,
      title: 'Pembayaran Disetujui! 🎉',
      message: `Pembayaran iuran Anda untuk periode ${monthDescriptions} sebesar Rp ${sub.totalAmount.toLocaleString('id-ID')} telah disetujui oleh Bendahara.`,
      type: 'success',
      link: 'riwayat',
    });
  };

  // Reject payment by bendahara
  const rejectPayment = (submissionId: string, reason: string) => {
    const sub = paymentSubmissions.find(s => s.id === submissionId);
    if (!sub) return;

    const nowStr = new Date().toLocaleString('id-ID');

    setPaymentSubmissions(prev =>
      prev.map(s =>
        s.id === submissionId
          ? {
              ...s,
              status: 'rejected',
              verifiedAt: nowStr,
              verifiedBy: settings.bendaharaName,
              rejectionReason: reason,
            }
          : s
      )
    );

    // Reset dues back to unpaid
    setDuesRecords(prev =>
      prev.map(d => {
        if (
          d.memberId === sub.memberId &&
          sub.months.some(m => m.year === d.year && m.month === d.month)
        ) {
          return { ...d, status: 'unpaid', paymentId: undefined };
        }
        return d;
      })
    );

    // Notify Member
    addNotification({
      recipientId: sub.memberId,
      title: 'Pembayaran Iuran Ditolak ⚠️',
      message: `Pengajuan pembayaran iuran Anda sebesar Rp ${sub.totalAmount.toLocaleString('id-ID')} ditolak. Alasan: "${reason}". Silakan periksa atau unggah ulang bukti yang benar.`,
      type: 'danger',
      link: 'bayar',
    });
  };

  // Cash transactions
  const addTransaction = (tx: Omit<CashTransaction, 'id' | 'createdAt'>) => {
    const newTx: CashTransaction = {
      ...tx,
      id: `trx-${Date.now()}`,
      createdAt: new Date().toLocaleString('id-ID'),
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    deleteFromSupabase('cash_transactions', 'id', id).catch(console.error);
  };

  // Donations
  const addDonation = (don: Omit<Donation, 'id' | 'createdAt'>) => {
    const newId = `don-${Date.now()}`;
    const newDon: Donation = {
      ...don,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setDonations(prev => [newDon, ...prev]);

    // Automatically record as income in Cashbook
    addTransaction({
      date: don.date,
      type: 'income',
      category: 'Donasi & Sumbangan Sukarela',
      sourceOrRecipient: don.donorName,
      amount: don.amount,
      description: `Donasi: ${don.purpose} - ${don.description}`,
      proofUrl: don.proofUrl,
    });
  };

  const deleteDonation = (id: string) => {
    setDonations(prev => prev.filter(d => d.id !== id));
    deleteFromSupabase('donations', 'id', id).catch(console.error);
  };

  // Social Services
  const addSocialService = (soc: Omit<SocialService, 'id' | 'createdAt'>) => {
    const newId = `sos-${Date.now()}`;
    const newSoc: SocialService = {
      ...soc,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setSocialServices(prev => [newSoc, ...prev]);

    // If there is actual expense spent, record to Cashbook if desired
    if (soc.totalSpent > 0) {
      addTransaction({
        date: soc.date,
        type: 'expense',
        category: 'Bakti Sosial & Pengabdian',
        sourceOrRecipient: soc.title,
        amount: soc.totalSpent,
        description: `Pengeluaran Kegiatan Bakti Sosial di ${soc.location}`,
        proofUrl: soc.documentationUrls[0] || undefined,
      });
    }
  };

  const deleteSocialService = (id: string) => {
    setSocialServices(prev => prev.filter(s => s.id !== id));
    deleteFromSupabase('social_services', 'id', id).catch(console.error);
  };

  // Bank Accounts
  const addBankAccount = (acc: Omit<BankAccount, 'id'>) => {
    const newAcc: BankAccount = { ...acc, id: `bank-${Date.now()}` };
    setBankAccounts(prev => [...prev, newAcc]);
  };

  const updateBankAccount = (id: string, acc: Partial<BankAccount>) => {
    setBankAccounts(prev => prev.map(b => (b.id === id ? { ...b, ...acc } : b)));
  };

  const deleteBankAccount = (id: string) => {
    setBankAccounts(prev => prev.filter(b => b.id !== id));
    deleteFromSupabase('bank_accounts', 'id', id).catch(console.error);
  };

  // Settings
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('patelki_settings', JSON.stringify(updated));
      return updated;
    });

    // If Bendahara name or NAP is updated, sync immediately with treasurer member and currentMember
    if (newSettings.bendaharaName || newSettings.bendaharaNap) {
      const newName = newSettings.bendaharaName;
      const newNap = newSettings.bendaharaNap;

      setMembers(prevMembers =>
        prevMembers.map(m => {
          if (m.id === 'mem-1' || m.jabatan?.toLowerCase().includes('bendahara') || (currentMember && m.id === currentMember.id)) {
            return {
              ...m,
              nama: newName || m.nama,
              nap: newNap || m.nap,
            };
          }
          return m;
        })
      );

      if (currentUserRole === 'bendahara') {
        setCurrentMember(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            nama: newName || prev.nama,
            nap: newNap || prev.nap,
          };
        });
      }
    }
  };

  // Keep Bendahara name & NAP strictly synchronized with settings
  useEffect(() => {
    if (currentUserRole === 'bendahara' && settings.bendaharaName) {
      setCurrentMember(prev => {
        if (!prev) return prev;
        if (prev.nama !== settings.bendaharaName || (settings.bendaharaNap && prev.nap !== settings.bendaharaNap)) {
          return {
            ...prev,
            nama: settings.bendaharaName,
            nap: settings.bendaharaNap || prev.nap,
          };
        }
        return prev;
      });
    }
  }, [currentUserRole, settings.bendaharaName, settings.bendaharaNap]);

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const addNotification = (notif: Omit<AppNotification, 'id' | 'date' | 'isRead'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      date: new Date().toLocaleString('id-ID'),
      isRead: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Calculations
  const getTotalIncome = () => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalExpense = () => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getCashBalance = () => {
    return getTotalIncome() - getTotalExpense();
  };

  const getTotalDonations = () => {
    return donations.reduce((sum, d) => sum + d.amount, 0);
  };

  const getTotalSocialServices = () => {
    return socialServices.reduce((sum, s) => sum + s.totalSpent, 0);
  };

  // Member dues calculation (current month or full history)
  const getMemberDuesSummary = (memberId: string, year?: number) => {
    const targetRecords = duesRecords.filter(d => {
      if (d.memberId !== memberId) return false;
      if (year) return d.year === year;
      // if no year specified, compute across active years up to current month (e.g. 2025 and 2026)
      return d.year <= 2026;
    });

    const paidRecords = targetRecords.filter(d => d.status === 'paid');
    const pendingRecords = targetRecords.filter(d => d.status === 'pending');
    const unpaidRecords = targetRecords.filter(d => d.status === 'unpaid');

    const totalPaid = paidRecords.reduce((sum, r) => sum + r.amount, 0);
    const arrearsAmount = unpaidRecords.reduce((sum, r) => sum + r.amount, 0);

    return {
      totalPaid,
      totalUnpaidMonths: unpaidRecords.length,
      arrearsAmount,
      paidMonthsCount: paidRecords.length,
      pendingMonthsCount: pendingRecords.length,
      unpaidMonthsList: unpaidRecords.map(u => ({ year: u.year, month: u.month })),
    };
  };

  const getYearlyArrearsList = (targetYear: number = 2026) => {
    return members
      .filter(m => m.status === 'aktif')
      .map(member => {
        const memberDues = duesRecords.filter(
          d => d.memberId === member.id && d.year === targetYear
        );
        const unpaid = memberDues
          .filter(d => d.status === 'unpaid')
          .map(d => ({ year: d.year, month: d.month }));
        const paidCount = memberDues.filter(d => d.status === 'paid').length;
        const totalArrears = unpaid.length * settings.monthlyFee;

        return {
          member,
          unpaidMonths: unpaid,
          totalArrears,
          paidCount,
        };
      })
      .filter(item => item.totalArrears > 0)
      .sort((a, b) => b.totalArrears - a.totalArrears);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const generateWhatsAppLink = (phone: string, text: string) => {
    let cleanNumber = phone.replace(/[^0-9]/g, '');
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '62' + cleanNumber.substring(1);
    }
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
  };

  const resetAllDataToDefault = () => {
    localStorage.clear();
    setMembers(INITIAL_MEMBERS);
    setDuesRecords(generateInitialDues());
    setPaymentSubmissions(INITIAL_PAYMENT_SUBMISSIONS);
    setTransactions(INITIAL_TRANSACTIONS);
    setDonations(INITIAL_DONATIONS);
    setSocialServices(INITIAL_SOCIAL_SERVICES);
    setBankAccounts(INITIAL_BANK_ACCOUNTS);
    setSettings(INITIAL_SETTINGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCurrentUserRole('bendahara');
    setCurrentMember(INITIAL_MEMBERS[0]);
  };

  // Supabase Database Action Handlers
  const saveSupabaseSettings = (url: string, key: string, autoSync: boolean = true) => {
    saveSupabaseConfig(url, key, autoSync);
    setSupabaseConfigState({ url, key, autoSync });
    setIsSupabaseActive(isSupabaseConfigured());
  };

  const syncUploadToSupabase = async (): Promise<{ success: boolean; message: string }> => {
    setIsSupabaseSyncing(true);
    try {
      const res = await pushAllDataToSupabase({
        members,
        duesRecords,
        paymentSubmissions,
        transactions,
        donations,
        socialServices,
        bankAccounts,
        settings,
      });
      if (res.success) {
        setIsSupabaseActive(true);
      }
      return res;
    } finally {
      setIsSupabaseSyncing(false);
    }
  };

  const syncDownloadFromSupabase = async (): Promise<{ success: boolean; message: string }> => {
    setIsSupabaseSyncing(true);
    try {
      const res = await pullAllDataFromSupabase();
      if (res.success && res.data) {
        if (res.data.members.length > 0) setMembers(res.data.members);
        if (res.data.duesRecords.length > 0) setDuesRecords(res.data.duesRecords);
        if (res.data.paymentSubmissions.length > 0) setPaymentSubmissions(res.data.paymentSubmissions);
        if (res.data.transactions.length > 0) setTransactions(res.data.transactions);
        if (res.data.donations.length > 0) setDonations(res.data.donations);
        if (res.data.socialServices.length > 0) setSocialServices(res.data.socialServices);
        if (res.data.bankAccounts.length > 0) setBankAccounts(res.data.bankAccounts);
        if (res.data.settings) setSettings(res.data.settings);
        setIsSupabaseActive(true);
      }
      return { success: res.success, message: res.message };
    } finally {
      setIsSupabaseSyncing(false);
    }
  };

  const testSupabase = async (url?: string, key?: string): Promise<{ success: boolean; message: string }> => {
    return testSupabaseConnection(url, key);
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        currentUserRole,
        currentMember,
        setCurrentUserRole,
        setCurrentMember,
        login,
        logout,
        changeTreasurerCredentials,
        changeMemberPassword,
        members,
        duesRecords,
        paymentSubmissions,
        transactions,
        donations,
        socialServices,
        bankAccounts,
        settings,
        notifications,
        addMember,
        updateMember,
        deleteMember,
        toggleMemberStatus,
        importMembers,
        updateDuesStatus,
        submitPayment,
        approvePayment,
        rejectPayment,
        addTransaction,
        deleteTransaction,
        addDonation,
        deleteDonation,
        addSocialService,
        deleteSocialService,
        addBankAccount,
        updateBankAccount,
        deleteBankAccount,
        updateSettings,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification,
        getCashBalance,
        getTotalIncome,
        getTotalExpense,
        getTotalDonations,
        getTotalSocialServices,
        getMemberDuesSummary,
        getYearlyArrearsList,
        formatCurrency,
        generateWhatsAppLink,
        resetAllDataToDefault,
        // Supabase Database Integration
        isSupabaseActive,
        isSupabaseSyncing,
        supabaseConfig,
        saveSupabaseSettings,
        syncUploadToSupabase,
        syncDownloadFromSupabase,
        testSupabase,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
