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
  deleteMemberFromSupabase,
  clearTableFromSupabase,
  upsertToSupabase,
} from '../lib/supabase';
import {
  normalizePhoneNumber,
  formatPhoneDisplay,
  generateWhatsAppLink,
} from '../utils/phoneUtils';

interface AppContextType {
  // Auth & Roles
  isAuthenticated: boolean;
  currentUserRole: UserRole;
  currentMember: Member | null;
  setCurrentUserRole: (role: UserRole) => void;
  setCurrentMember: (member: Member | null) => void;
  login: (role: UserRole, identifier: string, password?: string) => Promise<{ success: boolean; error?: string }>;
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
  updateDuesStatus: (memberId: string, year: number, month: number, status: 'paid' | 'pending' | 'unpaid' | 'inactive', amount?: number) => void;
  bulkUpdateDues: (updates: { memberId: string; year: number; month: number; status: 'paid' | 'pending' | 'unpaid' | 'inactive'; amount?: number }[]) => void;
  settleMemberArrears: (
    memberId: string,
    months: { year: number; month: number }[],
    options: {
      paymentMethod: string;
      recordCash: boolean;
      paidDate?: string;
      notes?: string;
    }
  ) => Promise<{ submissionId?: string; totalAmount: number }>;
  waiveMemberArrears: (
    memberId: string,
    months: { year: number; month: number }[],
    reason?: string
  ) => Promise<void>;
  submitPayment: (data: {
    memberId: string;
    months: { year: number; month: number }[];
    bankAccountId: string;
    proofUrl: string;
    proofName?: string;
    notes?: string;
  }) => string;
  approvePayment: (submissionId: string, notes?: string) => Promise<void>;
  rejectPayment: (submissionId: string, reason: string) => Promise<void>;

  // Actions - Finance
  addTransaction: (tx: Omit<CashTransaction, 'id' | 'createdAt'>) => void;
  deleteTransaction: (id: string) => void;
  addDonation: (don: Omit<Donation, 'id' | 'createdAt'>) => void;
  deleteDonation: (id: string) => void;
  addSocialService: (soc: Omit<SocialService, 'id' | 'createdAt'>) => void;
  updateSocialService: (id: string, soc: Partial<SocialService>) => void;
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
  getYearlyArrearsList: (targetYear?: number | 'all') => {
    member: Member;
    unpaidMonths: { year: number; month: number }[];
    totalArrears: number;
    paidCount: number;
  }[];
  formatCurrency: (amount: number) => string;
  generateWhatsAppLink: (phone?: string | null, text?: string) => string;
  normalizePhoneNumber: (phone?: string | null) => string;
  formatPhoneDisplay: (phone?: string | null, withCountryCode?: boolean) => string;
  resetAllDataToDefault: () => Promise<void>;

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
  const isInitialSyncDone = React.useRef(false);

  // Load from localStorage or empty defaults with automatic phone number normalization
  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem('patelki_members');
    if (!saved) return [];
    try {
      const raw: Member[] = JSON.parse(saved);
      return raw.map(m => ({ ...m, noWa: normalizePhoneNumber(m.noWa) }));
    } catch {
      return [];
    }
  });

  const [duesRecords, setDuesRecords] = useState<DuesRecord[]>(() => {
    const saved = localStorage.getItem('patelki_dues');
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  const [paymentSubmissions, setPaymentSubmissions] = useState<PaymentSubmission[]>(() => {
    const saved = localStorage.getItem('patelki_submissions');
    if (!saved) return [];
    try {
      const raw: PaymentSubmission[] = JSON.parse(saved);
      return raw.map(s => ({ ...s, memberWa: normalizePhoneNumber(s.memberWa) }));
    } catch {
      return [];
    }
  });

  const [transactions, setTransactions] = useState<CashTransaction[]>(() => {
    const saved = localStorage.getItem('patelki_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [donations, setDonations] = useState<Donation[]>(() => {
    const saved = localStorage.getItem('patelki_donations');
    return saved ? JSON.parse(saved) : [];
  });

  const [socialServices, setSocialServices] = useState<SocialService[]>(() => {
    const saved = localStorage.getItem('patelki_social');
    return saved ? JSON.parse(saved) : [];
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem('patelki_bank_accounts');
    return saved ? JSON.parse(saved) : INITIAL_BANK_ACCOUNTS;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('patelki_settings');
    const raw: AppSettings = saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    return { ...raw, contactWa: normalizePhoneNumber(raw.contactWa || '6281256789001') };
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('patelki_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  // Supabase Database Integration State
  const [supabaseConfig, setSupabaseConfigState] = useState<SupabaseConfig>(getSupabaseConfig);
  const [isSupabaseActive, setIsSupabaseActive] = useState<boolean>(isSupabaseConfigured);
  const [isSupabaseSyncing, setIsSupabaseSyncing] = useState<boolean>(false);

  // Auto load from Supabase if configured on startup with bi-directional safety
  useEffect(() => {
    if (isSupabaseConfigured()) {
      pullAllDataFromSupabase().then(async (res) => {
        if (res.success && res.data) {
          const hasRemoteData =
            (res.data.members && res.data.members.length > 0) ||
            (res.data.transactions && res.data.transactions.length > 0) ||
            (res.data.duesRecords && res.data.duesRecords.length > 0) ||
            (res.data.paymentSubmissions && res.data.paymentSubmissions.length > 0) ||
            (res.data.donations && res.data.donations.length > 0) ||
            (res.data.socialServices && res.data.socialServices.length > 0);

          if (hasRemoteData) {
            // Remote database has records: populate state safely
            if (res.data.members && res.data.members.length > 0) setMembers(res.data.members);
            if (res.data.duesRecords && res.data.duesRecords.length > 0) setDuesRecords(res.data.duesRecords);
            if (res.data.paymentSubmissions && res.data.paymentSubmissions.length > 0) setPaymentSubmissions(res.data.paymentSubmissions);
            if (res.data.transactions && res.data.transactions.length > 0) setTransactions(res.data.transactions);
            if (res.data.donations && res.data.donations.length > 0) setDonations(res.data.donations);
            if (res.data.socialServices && res.data.socialServices.length > 0) setSocialServices(res.data.socialServices);
            if (res.data.bankAccounts && res.data.bankAccounts.length > 0) {
              setBankAccounts(res.data.bankAccounts);
            }
            if (res.data.settings) {
              setSettings(res.data.settings);
            }
          } else {
            // Remote is empty, but local has data: seed remote with local data so user data is never lost!
            const localHasData = members.length > 0 || transactions.length > 0;
            if (localHasData) {
              await pushAllDataToSupabase({
                members,
                duesRecords,
                paymentSubmissions,
                transactions,
                donations,
                socialServices,
                bankAccounts,
                settings,
              }).catch(console.warn);
            }
          }
          setIsSupabaseActive(true);
        }
        isInitialSyncDone.current = true;
      }).catch(err => {
        console.warn('Initial Supabase sync check:', err);
        isInitialSyncDone.current = true;
      });
    } else {
      isInitialSyncDone.current = true;
    }
  }, []);

  // Real-time sync subscription across users/devices
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const unsubscribe = subscribeToSupabaseRealtime(() => {
      pullAllDataFromSupabase().then(res => {
        if (res.success && res.data) {
          const hasRemoteData =
            (res.data.members && res.data.members.length > 0) ||
            (res.data.transactions && res.data.transactions.length > 0) ||
            (res.data.duesRecords && res.data.duesRecords.length > 0);

          if (hasRemoteData) {
            if (res.data.members) setMembers(res.data.members);
            if (res.data.duesRecords) setDuesRecords(res.data.duesRecords);
            if (res.data.paymentSubmissions) setPaymentSubmissions(res.data.paymentSubmissions);
            if (res.data.transactions) setTransactions(res.data.transactions);
            if (res.data.donations) setDonations(res.data.donations);
            if (res.data.socialServices) setSocialServices(res.data.socialServices);
            if (res.data.bankAccounts && res.data.bankAccounts.length > 0) {
              setBankAccounts(res.data.bankAccounts);
            }
            if (res.data.settings) {
              setSettings(res.data.settings);
            }
            setIsSupabaseActive(true);
          }
        }
      }).catch(err => {
        console.warn('Realtime sync pull error:', err);
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isSupabaseActive]);

  // Auto-sync push to Supabase on data changes (debounced & only after initial sync completed)
  useEffect(() => {
    if (!isInitialSyncDone.current) return;
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
        console.warn('Auto-sync upload notice:', err);
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

  // Auto-healing: Ensure every registered active member has all dues records from 2025 to 2031
  useEffect(() => {
    if (members.length === 0) return;

    setDuesRecords(prevDues => {
      const existingMap = new Map<string, DuesRecord>();
      prevDues.forEach(d => {
        existingMap.set(`${d.memberId}-${d.year}-${d.month}`, d);
      });

      const missing: DuesRecord[] = [];
      const startYr = settings.startYear || 2025;
      const endYr = settings.endYear || 2031;
      const fee = settings.monthlyFee || 30000;

      members.forEach(m => {
        for (let yr = startYr; yr <= endYr; yr++) {
          for (let mo = 1; mo <= 12; mo++) {
            const keyById = `${m.id}-${yr}-${mo}`;
            const keyByNap = m.nap ? `${m.nap}-${yr}-${mo}` : '';

            const found = existingMap.get(keyById) || (keyByNap ? existingMap.get(keyByNap) : undefined);

            if (!found) {
              missing.push({
                memberId: m.id,
                year: yr,
                month: mo,
                status: m.status === 'aktif' ? 'unpaid' : 'inactive',
                amount: fee,
              });
            }
          }
        }
      });

      if (missing.length > 0) {
        const next = [...prevDues, ...missing];
        localStorage.setItem('patelki_dues', JSON.stringify(next));
        return next;
      }
      return prevDues;
    });
  }, [members, settings.startYear, settings.endYear, settings.monthlyFee]);

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
  const login = async (role: UserRole, identifier: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = (password || '').trim();
    const cleanDigits = cleanId.replace(/[^0-9]/g, '');

    if (role === 'bendahara') {
      const activeTreasurerUser = (settings.treasurerUsername || 'bendahara').toLowerCase();
      const activeTreasurerPass = settings.treasurerPassword || 'bendahara123';
      const treasurerNap = (settings.bendaharaNap || '61.11.001').toLowerCase();

      // Check username / NAP match
      const isUserMatch =
        cleanId === activeTreasurerUser ||
        cleanId === treasurerNap ||
        cleanId === 'bendahara' ||
        cleanId === 'admin' ||
        (cleanDigits.length >= 3 && treasurerNap.replace(/[^0-9]/g, '').includes(cleanDigits));

      if (!isUserMatch) {
        return {
          success: false,
          error: `Username Bendahara salah. Masukkan "${settings.treasurerUsername || 'bendahara'}" atau NAP "${settings.bendaharaNap}".`,
        };
      }

      // Check password match
      const isPassMatch =
        !cleanPass ||
        cleanPass === activeTreasurerPass ||
        cleanPass === 'bendahara123' ||
        cleanPass === 'admin';

      if (!isPassMatch) {
        return { success: false, error: 'Kata sandi / PIN Bendahara salah.' };
      }

      const bendahara = members.find(m => m.nap === settings.bendaharaNap || m.jabatan?.toLowerCase().includes('bendahara')) || null;
      setCurrentUserRole('bendahara');
      setCurrentMember(bendahara);
      setIsAuthenticated(true);
      return { success: true };
    } else {
      // 1. Prepare member list from state or LocalStorage
      let currentMemberList = [...members];
      if (currentMemberList.length === 0) {
        try {
          const saved = localStorage.getItem('patelki_members');
          if (saved) {
            currentMemberList = JSON.parse(saved);
          }
        } catch (err) {
          console.warn('Error reading patelki_members from localStorage:', err);
        }
      }

      // Helper function for flexible multi-credential matching (NAP, Name, WhatsApp, Email, NIK, ID)
      const findMemberInList = (list: Member[]): Member | undefined => {
        return list.find(m => {
          if (!m) return false;

          // Match by NAP
          const mNapClean = (m.nap || '').toLowerCase().trim();
          const mNapDigits = mNapClean.replace(/[^a-z0-9]/gi, '');
          const cleanIdAlphaNum = cleanId.replace(/[^a-z0-9]/gi, '');

          const matchNap =
            mNapClean === cleanId ||
            (cleanIdAlphaNum.length > 0 && mNapDigits === cleanIdAlphaNum) ||
            (cleanId.length >= 3 && mNapClean.includes(cleanId)) ||
            (mNapClean.length >= 3 && cleanId.includes(mNapClean));

          // Match by Name
          const mNamaClean = (m.nama || '').toLowerCase().trim();
          const matchNama =
            mNamaClean === cleanId ||
            (cleanId.length >= 3 && mNamaClean.includes(cleanId)) ||
            (mNamaClean.length >= 3 && cleanId.includes(mNamaClean));

          // Match by WhatsApp / Phone number
          const mPhoneDigits = (m.noWa || '').replace(/[^0-9]/g, '');
          const matchWa =
            cleanDigits.length >= 4 &&
            (mPhoneDigits.includes(cleanDigits) ||
             cleanDigits.includes(mPhoneDigits) ||
             (mPhoneDigits.length >= 7 && cleanDigits.endsWith(mPhoneDigits.slice(-7))) ||
             (cleanDigits.length >= 7 && mPhoneDigits.endsWith(cleanDigits.slice(-7))));

          // Match by Email
          const mEmailClean = (m.email || '').toLowerCase().trim();
          const matchEmail = mEmailClean.length > 0 && (mEmailClean === cleanId || mEmailClean.includes(cleanId));

          // Match by NIK or ID
          const mNikClean = (m.nik || '').replace(/[^0-9]/g, '');
          const matchNik = cleanDigits.length >= 6 && mNikClean === cleanDigits;
          const matchId = (m.id || '').toLowerCase() === cleanId;

          return matchNap || matchNama || matchWa || matchEmail || matchNik || matchId;
        });
      };

      let matched = findMemberInList(currentMemberList);

      // 2. If no local match found and Supabase is configured, pull remote database in real-time
      if (!matched && isSupabaseConfigured()) {
        try {
          const res = await pullAllDataFromSupabase();
          if (res.success && res.data && res.data.members && res.data.members.length > 0) {
            setMembers(res.data.members);
            if (res.data.duesRecords) setDuesRecords(res.data.duesRecords);
            if (res.data.transactions) setTransactions(res.data.transactions);
            if (res.data.donations) setDonations(res.data.donations);
            if (res.data.socialServices) setSocialServices(res.data.socialServices);

            matched = findMemberInList(res.data.members);
          }
        } catch (err) {
          console.warn('Login Supabase pull notice:', err);
        }
      }

      if (!matched) {
        return {
          success: false,
          error: `Nomor Anggota (NAP) atau akun "${identifier}" tidak ditemukan di database DPC Patelki Kayong Utara. Silakan hubungi Bendahara untuk memastikan data anggota Anda terdaftar.`,
        };
      }

      // Password check for anggota (custom member.password, default '123456', PIN, or phone digits)
      const memberPass = (matched.password || '123456').trim();
      const matchedNapClean = (matched.nap || '').toLowerCase().replace(/[^a-z0-9]/gi, '');
      const matchedPhoneEnd = (matched.noWa || '').replace(/[^0-9]/g, '').slice(-6);

      const isPassMatch =
        !cleanPass || // Allow blank password
        cleanPass === memberPass ||
        cleanPass === '123456' ||
        cleanPass === 'patelki' ||
        cleanPass === (matched.nap || '').toLowerCase() ||
        cleanPass.replace(/[^a-z0-9]/gi, '') === matchedNapClean ||
        (matched.pin && cleanPass === matched.pin) ||
        (matchedPhoneEnd.length >= 4 && cleanPass === matchedPhoneEnd);

      if (!isPassMatch) {
        return {
          success: false,
          error: 'Kata sandi / PIN Anggota salah. (Kata sandi awal default: 123456)',
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
    const newMember: Member = {
      ...newMemData,
      noWa: normalizePhoneNumber(newMemData.noWa),
      id: newId,
    };
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
    const cleanData = {
      ...data,
      ...(data.noWa !== undefined ? { noWa: normalizePhoneNumber(data.noWa) } : {}),
    };
    setMembers(prev => prev.map(m => (m.id === id ? { ...m, ...cleanData } : m)));
    if (currentMember?.id === id) {
      setCurrentMember(prev => (prev ? { ...prev, ...cleanData } : null));
    }
  };

  const deleteMember = (id: string) => {
    const memberToDelete = members.find(m => m.id === id);
    setMembers(prev => prev.filter(m => m.id !== id));
    setDuesRecords(prev => prev.filter(d => d.memberId !== id));
    
    // Sync permanent deletion to Supabase (including child dues_records and submissions)
    deleteMemberFromSupabase(id, memberToDelete?.nap).catch(err => {
      console.error('Gagal menghapus anggota dari Supabase:', err);
    });
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
      const newMem: Member = {
        ...item,
        noWa: normalizePhoneNumber(item.noWa),
        id: newId,
      };
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
    status: 'paid' | 'pending' | 'unpaid' | 'inactive',
    amount?: number
  ) => {
    const today = new Date().toISOString().split('T')[0];
    setDuesRecords(prev => {
      const next = prev.map(d => {
        if (d.memberId === memberId && d.year === year && d.month === month) {
          return {
            ...d,
            status,
            amount: amount !== undefined ? amount : d.amount,
            updatedAt: today,
          };
        }
        return d;
      });
      localStorage.setItem('patelki_dues', JSON.stringify(next));
      return next;
    });
  };

  const bulkUpdateDues = (
    updates: {
      memberId: string;
      year: number;
      month: number;
      status: 'paid' | 'pending' | 'unpaid' | 'inactive';
      amount?: number;
    }[]
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const updateMap = new Map<string, { status: 'paid' | 'pending' | 'unpaid' | 'inactive'; amount?: number }>();
    updates.forEach(u => {
      updateMap.set(`${u.memberId}-${u.year}-${u.month}`, { status: u.status, amount: u.amount });
    });

    setDuesRecords(prev => {
      const next = prev.map(d => {
        const key = `${d.memberId}-${d.year}-${d.month}`;
        const match = updateMap.get(key);
        if (match) {
          return {
            ...d,
            status: match.status,
            amount: match.amount !== undefined ? match.amount : d.amount,
            updatedAt: today,
          };
        }
        return d;
      });
      localStorage.setItem('patelki_dues', JSON.stringify(next));
      return next;
    });
  };

  // Pelunasan Tunggakan Iuran Langsung oleh Bendahara (Tunai/Transfer Langsung)
  const settleMemberArrears = async (
    memberId: string,
    months: { year: number; month: number }[],
    options: {
      paymentMethod: string;
      recordCash: boolean;
      paidDate?: string;
      notes?: string;
    }
  ): Promise<{ submissionId?: string; totalAmount: number }> => {
    const member = members.find(m => m.id === memberId);
    if (!member || months.length === 0) return { totalAmount: 0 };

    const totalAmount = months.reduce((sum, m) => {
      const rec = duesRecords.find(d => d.memberId === memberId && d.year === m.year && d.month === m.month);
      return sum + (rec?.amount || settings.monthlyFee);
    }, 0);

    const nowStr = new Date().toLocaleString('id-ID');
    const nowIsoDate = options.paidDate || new Date().toISOString().split('T')[0];
    const subId = `sub-direct-${Date.now()}`;

    // 1. Create verified payment submission record
    const newSubmission: PaymentSubmission = {
      id: subId,
      memberId,
      memberName: `${member.nama}, ${member.gelar || ''}`.trim(),
      memberNap: member.nap,
      memberWa: member.noWa,
      memberInstansi: member.instansi,
      months,
      totalAmount,
      bankAccountId: 'direct',
      bankName: options.paymentMethod || 'Pelunasan Langsung (Bendahara)',
      accountNumber: 'Pembayaran Langsung / Tunai',
      proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
      proofName: 'Pelunasan_Langsung_Bendahara.pdf',
      status: 'approved',
      submittedAt: nowStr,
      verifiedAt: nowStr,
      verifiedBy: settings.bendaharaName,
      notes: options.notes || `Pelunasan langsung diterima oleh Bendahara via ${options.paymentMethod || 'Tunai'}`,
    };

    setPaymentSubmissions(prev => {
      const next = [newSubmission, ...prev];
      localStorage.setItem('patelki_submissions', JSON.stringify(next));
      return next;
    });

    // 2. Mark dues records as paid
    const targetSet = new Set(months.map(m => `${m.year}-${m.month}`));
    setDuesRecords(prev => {
      const next = prev.map(d => {
        if (d.memberId === memberId && targetSet.has(`${d.year}-${d.month}`)) {
          return {
            ...d,
            status: 'paid' as const,
            paymentId: subId,
            updatedAt: nowIsoDate,
          };
        }
        return d;
      });
      localStorage.setItem('patelki_dues', JSON.stringify(next));
      return next;
    });

    // 3. Automatically record to Cash Book if recordCash is true
    if (options.recordCash) {
      const monthDescriptions = months
        .map(m => `${MONTH_NAMES[m.month - 1]} ${m.year}`)
        .join(', ');

      const newTx: CashTransaction = {
        id: `trx-${Date.now()}`,
        date: nowIsoDate,
        type: 'income',
        category: 'Iuran Wajib Anggota',
        sourceOrRecipient: `${member.nama} (${member.nap})`,
        amount: totalAmount,
        description: `Pelunasan iuran ${monthDescriptions} (${options.paymentMethod || 'Tunai'})`,
        relatedPaymentId: subId,
        recordedBy: settings.bendaharaName,
        createdAt: nowStr,
      };

      setTransactions(prev => {
        const next = [newTx, ...prev];
        localStorage.setItem('patelki_transactions', JSON.stringify(next));
        return next;
      });
    }

    // 4. Send Notification to Member
    addNotification({
      recipientId: memberId,
      title: 'Pelunasan Iuran Diterima! 🎉',
      message: `Bendahara DPC telah mencatat pelunasan iuran Anda untuk ${months.length} bulan (${formatCurrency(totalAmount)}). Terima kasih!`,
      type: 'success',
      link: 'riwayat',
    });

    return { submissionId: subId, totalAmount };
  };

  // Pembebasan / Pemutihan Tunggakan (Misal Cuti, Pindahan, Bebas Iuran)
  const waiveMemberArrears = async (
    memberId: string,
    months: { year: number; month: number }[],
    reason?: string
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const targetSet = new Set(months.map(m => `${m.year}-${m.month}`));

    setDuesRecords(prev => {
      const next = prev.map(d => {
        if (d.memberId === memberId && targetSet.has(`${d.year}-${d.month}`)) {
          return {
            ...d,
            status: 'inactive' as const,
            updatedAt: today,
          };
        }
        return d;
      });
      localStorage.setItem('patelki_dues', JSON.stringify(next));
      return next;
    });
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
      memberName: member ? `${member.nama}, ${member.gelar || ''}`.trim() : 'Anggota',
      memberNap: member?.nap || '',
      memberWa: normalizePhoneNumber(member?.noWa || ''),
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

    const nextSubmissions = [newSub, ...paymentSubmissions];

    // Update the dues records to pending
    const nextDues = duesRecords.map(d => {
      if (
        (d.memberId === data.memberId || (member && d.memberId === member.nap)) &&
        data.months.some(m => m.year === d.year && m.month === d.month)
      ) {
        return { ...d, status: 'pending' as const, paymentId: subId };
      }
      return d;
    });

    setPaymentSubmissions(nextSubmissions);
    setDuesRecords(nextDues);

    localStorage.setItem('patelki_submissions', JSON.stringify(nextSubmissions));
    localStorage.setItem('patelki_dues', JSON.stringify(nextDues));

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

    if (isSupabaseActive) {
      pushAllDataToSupabase({
        members,
        duesRecords: nextDues,
        paymentSubmissions: nextSubmissions,
        transactions,
        donations,
        socialServices,
        bankAccounts,
        settings,
      }).catch(console.warn);
    }

    return subId;
  };

  const approvePayment = async (submissionId: string, notes?: string) => {
    const sub = paymentSubmissions.find(s => s.id === submissionId);
    if (!sub) return;

    const nowStr = new Date().toLocaleString('id-ID');
    const nowIsoDate = new Date().toISOString().split('T')[0];

    // 1. Update submission status to 'approved'
    const nextSubmissions = paymentSubmissions.map(s =>
      s.id === submissionId
        ? {
            ...s,
            status: 'approved' as const,
            verifiedAt: nowStr,
            verifiedBy: settings.bendaharaName,
            notes: notes || s.notes,
          }
        : s
    );

    // 2. Update all corresponding months to 'paid'
    const nextDues = duesRecords.map(d => {
      if (
        (d.memberId === sub.memberId || d.memberId === sub.memberNap) &&
        sub.months.some(m => m.year === d.year && m.month === d.month)
      ) {
        return {
          ...d,
          status: 'paid' as const,
          paymentId: sub.id,
          updatedAt: nowIsoDate,
        };
      }
      return d;
    });

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

    const nextTransactions = [newTx, ...transactions];

    // 4. Update React State & LocalStorage immediately
    setPaymentSubmissions(nextSubmissions);
    setDuesRecords(nextDues);
    setTransactions(nextTransactions);

    localStorage.setItem('patelki_submissions', JSON.stringify(nextSubmissions));
    localStorage.setItem('patelki_dues', JSON.stringify(nextDues));
    localStorage.setItem('patelki_transactions', JSON.stringify(nextTransactions));

    // 5. Send Member In-App Notification
    addNotification({
      recipientId: sub.memberId,
      title: 'Pembayaran Disetujui! 🎉',
      message: `Pembayaran iuran Anda untuk periode ${monthDescriptions} sebesar Rp ${sub.totalAmount.toLocaleString('id-ID')} telah disetujui oleh Bendahara.`,
      type: 'success',
      link: 'riwayat',
    });

    // 6. Push exact updated state to Supabase so it never reverts!
    if (isSupabaseActive) {
      await pushAllDataToSupabase({
        members,
        duesRecords: nextDues,
        paymentSubmissions: nextSubmissions,
        transactions: nextTransactions,
        donations,
        socialServices,
        bankAccounts,
        settings,
      }).catch(console.warn);
    }
  };

  const rejectPayment = async (submissionId: string, reason: string) => {
    const sub = paymentSubmissions.find(s => s.id === submissionId);
    if (!sub) return;

    const nowStr = new Date().toLocaleString('id-ID');

    // 1. Update submission status to 'rejected'
    const nextSubmissions = paymentSubmissions.map(s =>
      s.id === submissionId
        ? {
            ...s,
            status: 'rejected' as const,
            verifiedAt: nowStr,
            verifiedBy: settings.bendaharaName,
            rejectionReason: reason,
          }
        : s
    );

    // 2. Reset dues back to 'unpaid'
    const nextDues = duesRecords.map(d => {
      if (
        (d.memberId === sub.memberId || d.memberId === sub.memberNap) &&
        sub.months.some(m => m.year === d.year && m.month === d.month)
      ) {
        return { ...d, status: 'unpaid' as const, paymentId: undefined };
      }
      return d;
    });

    // 3. Update React State & LocalStorage immediately
    setPaymentSubmissions(nextSubmissions);
    setDuesRecords(nextDues);

    localStorage.setItem('patelki_submissions', JSON.stringify(nextSubmissions));
    localStorage.setItem('patelki_dues', JSON.stringify(nextDues));

    // 4. Send Member Notification
    addNotification({
      recipientId: sub.memberId,
      title: 'Pembayaran Ditolak',
      message: `Pengajuan iuran Anda sebesar Rp ${sub.totalAmount.toLocaleString('id-ID')} ditolak dengan alasan: ${reason}`,
      type: 'danger',
    });

    // 5. Push exact updated state to Supabase
    if (isSupabaseActive) {
      await pushAllDataToSupabase({
        members,
        duesRecords: nextDues,
        paymentSubmissions: nextSubmissions,
        transactions,
        donations,
        socialServices,
        bankAccounts,
        settings,
      }).catch(console.warn);
    }
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
    const nextSocialServices = [newSoc, ...socialServices];
    setSocialServices(nextSocialServices);
    localStorage.setItem('patelki_social', JSON.stringify(nextSocialServices));

    // Automatically add corresponding expense transaction to Cashbook with relatedSocialId
    if (soc.totalSpent > 0) {
      addTransaction({
        date: soc.date,
        type: 'expense',
        category: 'Bakti Sosial & Pengabdian',
        sourceOrRecipient: soc.title,
        amount: soc.totalSpent,
        description: `Pengeluaran Kegiatan Bakti Sosial di ${soc.location}`,
        proofUrl: soc.documentationUrls[0] || undefined,
        relatedSocialId: newId,
      });
    }
  };

  const updateSocialService = (id: string, socData: Partial<SocialService>) => {
    let updatedSoc: SocialService | null = null;

    const nextSocialServices = socialServices.map(s => {
      if (s.id === id) {
        const updated = { ...s, ...socData };
        if (updated.expenses && updated.expenses.length > 0) {
          updated.totalSpent = updated.expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        }
        updatedSoc = updated;
        return updated;
      }
      return s;
    });

    setSocialServices(nextSocialServices);
    localStorage.setItem('patelki_social', JSON.stringify(nextSocialServices));

    // Sync corresponding cashbook transaction
    if (updatedSoc) {
      const current = updatedSoc as SocialService;
      const nextTransactions = transactions.map(t => {
        if (t.relatedSocialId === id || (t.category.toLowerCase().includes('bakti') && t.sourceOrRecipient === current.title)) {
          return {
            ...t,
            date: current.date,
            amount: current.totalSpent,
            sourceOrRecipient: current.title,
            description: `Pengeluaran Kegiatan Bakti Sosial di ${current.location}`,
            proofUrl: current.documentationUrls[0] || t.proofUrl,
            relatedSocialId: id,
          };
        }
        return t;
      });
      setTransactions(nextTransactions);
      localStorage.setItem('patelki_transactions', JSON.stringify(nextTransactions));
    }

    if (isSupabaseActive) {
      syncUploadToSupabase().catch(console.error);
    }
  };

  const deleteSocialService = async (id: string) => {
    const targetSoc = socialServices.find(s => s.id === id);

    // 1. Compute new filtered arrays explicitly to avoid React closure stale state
    const nextSocialServices = socialServices.filter(s => s.id !== id);

    const linkedTxIds = transactions
      .filter(t => {
        if (t.relatedSocialId === id) return true;
        if (targetSoc && t.category.toLowerCase().includes('bakti') && (t.sourceOrRecipient === targetSoc.title || t.description.includes(targetSoc.title))) return true;
        return false;
      })
      .map(t => t.id);

    const nextTransactions = transactions.filter(t => !linkedTxIds.includes(t.id));

    // 2. Update React State & LocalStorage immediately
    setSocialServices(nextSocialServices);
    setTransactions(nextTransactions);

    localStorage.setItem('patelki_social', JSON.stringify(nextSocialServices));
    localStorage.setItem('patelki_transactions', JSON.stringify(nextTransactions));

    // 3. Delete explicitly from Supabase database tables
    deleteFromSupabase('social_services', 'id', id).catch(console.warn);

    for (const txId of linkedTxIds) {
      deleteFromSupabase('cash_transactions', 'id', txId).catch(console.warn);
    }

    if (targetSoc) {
      deleteFromSupabase('cash_transactions', 'source_or_recipient', targetSoc.title).catch(console.warn);
    }

    // 4. Sync the EXACT NEW FILTERED DATA to Supabase so it never re-appears!
    if (isSupabaseActive) {
      await pushAllDataToSupabase({
        members,
        duesRecords,
        paymentSubmissions,
        transactions: nextTransactions,
        donations,
        socialServices: nextSocialServices,
        bankAccounts,
        settings,
      }).catch(console.warn);
    }
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
      const cleanWa = newSettings.contactWa !== undefined ? normalizePhoneNumber(newSettings.contactWa) : prev.contactWa;
      const updated = {
        ...prev,
        ...newSettings,
        ...(newSettings.contactWa !== undefined ? { contactWa: cleanWa } : {}),
      };
      localStorage.setItem('patelki_settings', JSON.stringify(updated));
      return updated;
    });

    // Auto-sync settings to Supabase if configured
    if (isSupabaseActive) {
      syncUploadToSupabase().catch(console.error);
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

  // Member dues calculation (from January 2025 up to current running calendar month/day)
  const getMemberDuesSummary = (memberId: string, filterYear?: number) => {
    const member = members.find(m => m.id === memberId || m.nap === memberId);
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1; // 1-12
    const fee = settings.monthlyFee || 30000;

    const startYr = filterYear || (settings.startYear || 2025);
    const endYr = filterYear || curYear;

    let totalPaid = 0;
    let arrearsAmount = 0;
    let paidMonthsCount = 0;
    let pendingMonthsCount = 0;
    const unpaidMonthsList: { year: number; month: number }[] = [];

    // Map existing member dues by `${year}-${month}`
    const memberRecordsMap = new Map<string, DuesRecord>();
    duesRecords.forEach(d => {
      if (d.memberId === memberId || (member && (d.memberId === member.id || d.memberId === member.nap))) {
        memberRecordsMap.set(`${d.year}-${d.month}`, d);
        if (d.status === 'paid' && (!filterYear || d.year === filterYear)) {
          totalPaid += (d.amount || fee);
        }
      }
    });

    // Evaluate all active calendar months
    for (let yr = startYr; yr <= endYr; yr++) {
      const maxMonth = (yr === curYear) ? curMonth : (yr > curYear ? 0 : 12);
      for (let mo = 1; mo <= maxMonth; mo++) {
        const key = `${yr}-${mo}`;
        const rec = memberRecordsMap.get(key);

        const status = rec?.status || (member?.status === 'nonaktif' ? 'inactive' : 'unpaid');
        const amount = rec?.amount || fee;

        if (status === 'paid') {
          paidMonthsCount++;
        } else if (status === 'pending') {
          pendingMonthsCount++;
        } else if (status === 'inactive') {
          // Exempted period
        } else {
          // Unpaid arrears
          arrearsAmount += amount;
          unpaidMonthsList.push({ year: yr, month: mo });
        }
      }
    }

    return {
      totalPaid,
      totalUnpaidMonths: unpaidMonthsList.length,
      arrearsAmount,
      paidMonthsCount,
      pendingMonthsCount,
      unpaidMonthsList,
    };
  };

  const getYearlyArrearsList = (targetYear?: number | 'all') => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    const fee = settings.monthlyFee || 30000;

    return members
      .filter(m => m.status === 'aktif')
      .map(member => {
        const memberRecordsMap = new Map<string, DuesRecord>();
        duesRecords.forEach(d => {
          if (d.memberId === member.id || (member.nap && d.memberId === member.nap)) {
            memberRecordsMap.set(`${d.year}-${d.month}`, d);
          }
        });

        const unpaid: { year: number; month: number }[] = [];
        let paidCount = 0;
        let totalArrears = 0;

        const startYr = (targetYear && targetYear !== 'all') ? targetYear : (settings.startYear || 2025);
        const endYr = (targetYear && targetYear !== 'all') ? targetYear : curYear;

        for (let yr = startYr; yr <= endYr; yr++) {
          const maxMonth = (yr === curYear) ? curMonth : (yr > curYear ? 0 : 12);
          for (let mo = 1; mo <= maxMonth; mo++) {
            const key = `${yr}-${mo}`;
            const rec = memberRecordsMap.get(key);

            const status = rec?.status || 'unpaid';
            const amount = rec?.amount || fee;

            if (status === 'paid') {
              paidCount++;
            } else if (status === 'pending') {
              // Pending verification
            } else if (status === 'inactive') {
              // Exempted
            } else {
              // Unpaid arrears
              unpaid.push({ year: yr, month: mo });
              totalArrears += amount;
            }
          }
        }

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

  const resetAllDataToDefault = async () => {
    localStorage.clear();
    localStorage.setItem('patelki_demo_purged_v5', 'true');
    setMembers([]);
    setDuesRecords([]);
    setPaymentSubmissions([]);
    setTransactions([]);
    setDonations([]);
    setSocialServices([]);
    setBankAccounts(INITIAL_BANK_ACCOUNTS);
    setSettings(INITIAL_SETTINGS);
    setNotifications([]);
    setCurrentUserRole('bendahara');
    setCurrentMember(null);

    // Clear remote supabase tables if connected
    if (isSupabaseActive) {
      const tables = [
        'members',
        'dues_records',
        'payment_submissions',
        'cash_transactions',
        'donations',
        'social_services',
      ];
      for (const table of tables) {
        await clearTableFromSupabase(table).catch(err => {
          console.warn(`Notice clearing ${table}:`, err);
        });
      }
    }
    
    // Force reload to apply clean state
    window.location.reload();
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
        if (res.data.members) setMembers(res.data.members);
        if (res.data.duesRecords) setDuesRecords(res.data.duesRecords);
        if (res.data.paymentSubmissions) setPaymentSubmissions(res.data.paymentSubmissions);
        if (res.data.transactions) setTransactions(res.data.transactions);
        if (res.data.donations) setDonations(res.data.donations);
        if (res.data.socialServices) setSocialServices(res.data.socialServices);
        if (res.data.bankAccounts && res.data.bankAccounts.length > 0) {
          setBankAccounts(res.data.bankAccounts);
        }
        if (res.data.settings) {
          setSettings(res.data.settings);
        }
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
        bulkUpdateDues,
        settleMemberArrears,
        waiveMemberArrears,
        submitPayment,
        approvePayment,
        rejectPayment,
        addTransaction,
        deleteTransaction,
        addDonation,
        deleteDonation,
        addSocialService,
        updateSocialService,
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
        normalizePhoneNumber,
        formatPhoneDisplay,
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
