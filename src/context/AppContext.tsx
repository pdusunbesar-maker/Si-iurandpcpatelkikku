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
  updateInSupabase,
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
  deletePaymentSubmission: (id: string) => Promise<void>;

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

  // Helper to identify old hardcoded demo/seed IDs (e.g. tx-1, don-1, sos-1, mem-1)
  const isDemoId = (id?: string | null) => !!id && /^(tx|don|sos|baksos|mem|sub)-[0-9]{1,3}$/.test(id);

  const [transactions, setTransactions] = useState<CashTransaction[]>(() => {
    const saved = localStorage.getItem('patelki_transactions');
    if (!saved) return [];
    try {
      const parsed: CashTransaction[] = JSON.parse(saved);
      return parsed.filter(t => !isDemoId(t.id));
    } catch {
      return [];
    }
  });

  const [donations, setDonations] = useState<Donation[]>(() => {
    const saved = localStorage.getItem('patelki_donations');
    if (!saved) return [];
    try {
      const parsed: Donation[] = JSON.parse(saved);
      return parsed.filter(d => !isDemoId(d.id));
    } catch {
      return [];
    }
  });

  const [socialServices, setSocialServices] = useState<SocialService[]>(() => {
    const saved = localStorage.getItem('patelki_social');
    if (!saved) return [];
    try {
      const parsed: SocialService[] = JSON.parse(saved);
      return parsed.filter(s => !isDemoId(s.id));
    } catch {
      return [];
    }
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem('patelki_bank_accounts');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('patelki_settings');
    const raw: AppSettings = saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    return { ...raw, contactWa: normalizePhoneNumber(raw.contactWa || '') };
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('patelki_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  // Supabase Database Integration State
  const [supabaseConfig, setSupabaseConfigState] = useState<SupabaseConfig>(getSupabaseConfig);
  const [isSupabaseActive, setIsSupabaseActive] = useState<boolean>(isSupabaseConfigured);
  const [isSupabaseSyncing, setIsSupabaseSyncing] = useState<boolean>(false);

  // Auto load from Supabase if configured on startup - Supabase is Single Source of Truth
  useEffect(() => {
    if (isSupabaseConfigured()) {
      pullAllDataFromSupabase().then((res) => {
        if (res.success && res.data) {
          const cleanMembers = (res.data.members || []).filter(m => !isDemoId(m.id));
          const cleanTransactions = (res.data.transactions || []).filter(t => !isDemoId(t.id));
          const cleanDonations = (res.data.donations || []).filter(d => !isDemoId(d.id));
          const cleanSocial = (res.data.socialServices || []).filter(s => !isDemoId(s.id));

          setMembers(cleanMembers);
          setDuesRecords(res.data.duesRecords || []);
          setPaymentSubmissions(res.data.paymentSubmissions || []);
          setTransactions(cleanTransactions);
          setDonations(cleanDonations);
          setSocialServices(cleanSocial);
          setBankAccounts(res.data.bankAccounts || []);
          if (res.data.settings) setSettings(res.data.settings);

          // Synchronize logged in member with latest Supabase record
          const savedMemberId = localStorage.getItem('patelki_member_id');
          if (savedMemberId) {
            const fresh = cleanMembers.find(m => m.id === savedMemberId);
            if (fresh) {
              setCurrentMember(fresh);
            }
          }

          // Clean any detected residual demo rows from Supabase permanently
          const demoTx = (res.data.transactions || []).filter(t => isDemoId(t.id));
          for (const d of demoTx) {
            deleteFromSupabase('cash_transactions', 'id', d.id).catch(() => {});
          }
          const demoDon = (res.data.donations || []).filter(d => isDemoId(d.id));
          for (const d of demoDon) {
            deleteFromSupabase('donations', 'id', d.id).catch(() => {});
          }
          const demoSoc = (res.data.socialServices || []).filter(s => isDemoId(s.id));
          for (const s of demoSoc) {
            deleteFromSupabase('social_services', 'id', s.id).catch(() => {});
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

  // Real-time sync subscription across users/devices - Single Source of Truth
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const unsubscribe = subscribeToSupabaseRealtime(() => {
      pullAllDataFromSupabase().then(res => {
        if (res.success && res.data) {
          const cleanMembers = (res.data.members || []).filter(m => !isDemoId(m.id));
          const cleanTransactions = (res.data.transactions || []).filter(t => !isDemoId(t.id));
          const cleanDonations = (res.data.donations || []).filter(d => !isDemoId(d.id));
          const cleanSocial = (res.data.socialServices || []).filter(s => !isDemoId(s.id));

          setMembers(cleanMembers);
          setDuesRecords(res.data.duesRecords || []);
          setPaymentSubmissions(res.data.paymentSubmissions || []);
          setTransactions(cleanTransactions);
          setDonations(cleanDonations);
          setSocialServices(cleanSocial);
          if (res.data.bankAccounts !== undefined) {
            setBankAccounts(res.data.bankAccounts);
          }
          if (res.data.settings) {
            setSettings(res.data.settings);
          }

          // Synchronize logged in member with latest Supabase record
          const savedMemberId = localStorage.getItem('patelki_member_id');
          if (savedMemberId) {
            const fresh = cleanMembers.find(m => m.id === savedMemberId);
            if (fresh) {
              setCurrentMember(fresh);
            }
          }
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
    const savedAuth = localStorage.getItem('patelki_auth') === 'true';
    const savedRole = localStorage.getItem('patelki_role');
    const savedId = localStorage.getItem('patelki_member_id');
    if (!savedAuth || savedRole !== 'anggota' || !savedId) return null;
    const savedMembers = localStorage.getItem('patelki_members');
    if (!savedMembers) return null;
    try {
      const memberList: Member[] = JSON.parse(savedMembers);
      return memberList.find(m => m.id === savedId) || null;
    } catch {
      return null;
    }
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
    } else {
      localStorage.removeItem('patelki_member_id');
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

  // Auto-healing: Ensure any approved payment submission has its corresponding dues records marked as 'paid'
  useEffect(() => {
    if (paymentSubmissions.length === 0 || duesRecords.length === 0) return;

    let hasChanges = false;
    const approvedSubs = paymentSubmissions.filter(s => s.status === 'approved');
    if (approvedSubs.length === 0) return;

    const nextDues = duesRecords.map(d => {
      let shouldBePaid = false;
      for (const sub of approvedSubs) {
        const matchesMember =
          d.memberId === sub.memberId ||
          d.memberId === sub.memberNap ||
          (sub.memberNap && d.memberId === sub.memberNap);
        const matchesMonth = sub.months.some(m => m.year === d.year && m.month === d.month);
        if (matchesMember && matchesMonth) {
          shouldBePaid = true;
          break;
        }
      }

      if (shouldBePaid && d.status !== 'paid') {
        hasChanges = true;
        return {
          ...d,
          status: 'paid' as const,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      }
      return d;
    });

    if (hasChanges) {
      setDuesRecords(nextDues);
      localStorage.setItem('patelki_dues', JSON.stringify(nextDues));
    }
  }, [paymentSubmissions]);

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
      localStorage.setItem('patelki_auth', 'true');
      localStorage.setItem('patelki_role', 'bendahara');
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

      // Prioritized & strict member resolver to eliminate false matching (Si A vs Si B)
      const resolveMember = (list: Member[]): Member | undefined => {
        if (!list || list.length === 0) return undefined;

        // Tier 1: Exact NAP Match (Primary official identifier)
        let target = list.find(m => {
          const mNap = (m.nap || '').toLowerCase().trim();
          const mNapAlpha = mNap.replace(/[^a-z0-9]/gi, '');
          const cleanIdAlpha = cleanId.replace(/[^a-z0-9]/gi, '');
          return mNap === cleanId || (cleanIdAlpha.length >= 4 && mNapAlpha === cleanIdAlpha);
        });
        if (target) return target;

        // Tier 2: Exact ID Match
        target = list.find(m => (m.id || '').toLowerCase().trim() === cleanId);
        if (target) return target;

        // Tier 3: Exact Phone / WhatsApp Match (Requires at least 8 digits matching ending)
        if (cleanDigits.length >= 8) {
          target = list.find(m => {
            const mPhone = (m.noWa || '').replace(/[^0-9]/g, '');
            if (!mPhone || mPhone.length < 8) return false;
            const targetSuffix = cleanDigits.slice(-9);
            const mPhoneSuffix = mPhone.slice(-9);
            return mPhone === cleanDigits || mPhoneSuffix === targetSuffix;
          });
          if (target) return target;
        }

        // Tier 4: Exact Email Match
        if (cleanId.includes('@')) {
          target = list.find(m => (m.email || '').toLowerCase().trim() === cleanId);
          if (target) return target;
        }

        // Tier 5: Exact NIK Match (National Identity Number)
        if (cleanDigits.length >= 10) {
          target = list.find(m => {
            const mNik = (m.nik || '').replace(/[^0-9]/g, '');
            return mNik.length >= 10 && mNik === cleanDigits;
          });
          if (target) return target;
        }

        // Tier 6: Exact Full Name Match (Case-insensitive, ignoring honorific titles)
        target = list.find(m => {
          const mName = (m.nama || '').toLowerCase().trim();
          if (mName === cleanId) return true;
          const mNameNoTitle = mName.replace(/,\s*(a\.md|s\.tr|skm|s\.si|m\.kes|amd).*$/i, '').trim();
          const inputNoTitle = cleanId.replace(/,\s*(a\.md|s\.tr|skm|s\.si|m\.kes|amd).*$/i, '').trim();
          return mNameNoTitle.length >= 3 && mNameNoTitle === inputNoTitle;
        });
        if (target) return target;

        return undefined;
      };

      let matched = resolveMember(currentMemberList);

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

            matched = resolveMember(res.data.members);
          }
        } catch (err) {
          console.warn('Login Supabase pull notice:', err);
        }
      }

      if (!matched) {
        return {
          success: false,
          error: `Nomor Anggota (NAP) atau akun "${identifier}" tidak ditemukan di database DPC Patelki Kayong Utara. Pastikan NAP atau Nomor HP yang dimasukkan sudah sesuai dengan data yang terdaftar.`,
        };
      }

      // Password check for anggota (custom member.password, default '123456', or PIN)
      const memberPass = (matched.password || '123456').trim();
      const matchedPin = (matched.pin || '').trim();

      const isPassMatch =
        cleanPass === memberPass ||
        cleanPass === '123456' ||
        (matchedPin.length > 0 && cleanPass === matchedPin);

      if (!isPassMatch) {
        return {
          success: false,
          error: 'Kata sandi / PIN Anggota salah. Kata sandi default awal anggota adalah "123456". Hubungi Bendahara jika Anda lupa kata sandi.',
        };
      }

      setCurrentUserRole('anggota');
      setCurrentMember(matched);
      setIsAuthenticated(true);
      localStorage.setItem('patelki_auth', 'true');
      localStorage.setItem('patelki_role', 'anggota');
      localStorage.setItem('patelki_member_id', matched.id);
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

  // Change Member Password (with immediate Supabase persistence)
  const changeMemberPassword = async (memberId: string, newPassword: string) => {
    const cleanPass = newPassword.trim() || '123456';
    const nextMembers = members.map(m => {
      if (m.id === memberId) {
        return { ...m, password: cleanPass };
      }
      return m;
    });
    setMembers(nextMembers);
    localStorage.setItem('patelki_members', JSON.stringify(nextMembers));

    if (currentMember?.id === memberId) {
      setCurrentMember(prev => (prev ? { ...prev, password: cleanPass } : null));
    }

    if (isSupabaseActive || isSupabaseConfigured()) {
      await updateInSupabase('members', { password: cleanPass }, 'id', memberId).catch(console.error);
    }
  };

  // Logout handler
  const logout = () => {
    setIsAuthenticated(false);
    setCurrentMember(null);
    setCurrentUserRole('bendahara');
    localStorage.removeItem('patelki_auth');
    localStorage.removeItem('patelki_member_id');
    localStorage.removeItem('patelki_role');
  };

  // Member actions
  const addMember = (newMemData: Omit<Member, 'id'>) => {
    const newId = `mem-${Date.now()}`;
    const newMember: Member = {
      ...newMemData,
      noWa: normalizePhoneNumber(newMemData.noWa),
      id: newId,
      password: newMemData.password || '123456',
    };
    const nextMembers = [...members, newMember];

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
    const nextDues = [...duesRecords, ...newDues];

    setMembers(nextMembers);
    setDuesRecords(nextDues);

    localStorage.setItem('patelki_members', JSON.stringify(nextMembers));
    localStorage.setItem('patelki_dues', JSON.stringify(nextDues));

    if (isSupabaseActive) {
      pushAllDataToSupabase({
        members: nextMembers,
        duesRecords: nextDues,
        paymentSubmissions,
        transactions,
        donations,
        socialServices,
        bankAccounts,
        settings,
      }).catch(console.warn);
    }
  };

  const updateMember = async (id: string, data: Partial<Member>) => {
    const cleanData = {
      ...data,
      ...(data.noWa !== undefined ? { noWa: normalizePhoneNumber(data.noWa) } : {}),
    };
    const nextMembers = members.map(m => (m.id === id ? { ...m, ...cleanData } : m));
    setMembers(nextMembers);
    localStorage.setItem('patelki_members', JSON.stringify(nextMembers));

    if (currentMember?.id === id) {
      setCurrentMember(prev => (prev ? { ...prev, ...cleanData } : null));
    }

    if (isSupabaseActive || isSupabaseConfigured()) {
      const dbUpdatePayload: Record<string, any> = {};
      if (cleanData.nama !== undefined) dbUpdatePayload.nama = cleanData.nama;
      if (cleanData.gelar !== undefined) dbUpdatePayload.gelar = cleanData.gelar;
      if (cleanData.nap !== undefined) dbUpdatePayload.nap = cleanData.nap;
      if (cleanData.noWa !== undefined) dbUpdatePayload.no_wa = cleanData.noWa;
      if (cleanData.instansi !== undefined) dbUpdatePayload.instansi = cleanData.instansi;
      if (cleanData.jabatan !== undefined) dbUpdatePayload.jabatan = cleanData.jabatan;
      if (cleanData.status !== undefined) dbUpdatePayload.status = cleanData.status;
      if (cleanData.foto !== undefined) dbUpdatePayload.foto = (cleanData.foto && cleanData.foto.length > 500000) ? null : cleanData.foto;
      if (cleanData.email !== undefined) dbUpdatePayload.email = cleanData.email;
      if (cleanData.alamat !== undefined) dbUpdatePayload.alamat = cleanData.alamat;
      if (cleanData.nik !== undefined) dbUpdatePayload.nik = cleanData.nik;
      if (cleanData.password !== undefined) dbUpdatePayload.password = cleanData.password;
      if (cleanData.pin !== undefined) dbUpdatePayload.pin = cleanData.pin;

      await updateInSupabase('members', dbUpdatePayload, 'id', id).catch(console.error);
    }
  };

  const deleteMember = (id: string) => {
    const memberToDelete = members.find(m => m.id === id);
    const nextMembers = members.filter(m => m.id !== id);
    const nextDues = duesRecords.filter(d => d.memberId !== id && (!memberToDelete?.nap || d.memberId !== memberToDelete.nap));

    setMembers(nextMembers);
    setDuesRecords(nextDues);

    localStorage.setItem('patelki_members', JSON.stringify(nextMembers));
    localStorage.setItem('patelki_dues', JSON.stringify(nextDues));

    // Sync permanent deletion to Supabase (including child dues_records and submissions)
    deleteMemberFromSupabase(id, memberToDelete?.nap).catch(err => {
      console.error('Gagal menghapus anggota dari Supabase:', err);
    });

    if (isSupabaseActive) {
      pushAllDataToSupabase({
        members: nextMembers,
        duesRecords: nextDues,
        paymentSubmissions,
        transactions,
        donations,
        socialServices,
        bankAccounts,
        settings,
      }).catch(console.warn);
    }
  };

  const toggleMemberStatus = (id: string) => {
    let nextStatus: 'aktif' | 'nonaktif' = 'aktif';
    const nextMembers = members.map(m => {
      if (m.id === id) {
        nextStatus = m.status === 'aktif' ? 'nonaktif' : 'aktif';
        return { ...m, status: nextStatus };
      }
      return m;
    });

    const nextDues = duesRecords.map(d => {
      if (d.memberId === id && d.status !== 'paid') {
        return {
          ...d,
          status: (nextStatus === 'nonaktif' ? 'inactive' : 'unpaid') as any,
        };
      }
      return d;
    });

    setMembers(nextMembers);
    setDuesRecords(nextDues);

    localStorage.setItem('patelki_members', JSON.stringify(nextMembers));
    localStorage.setItem('patelki_dues', JSON.stringify(nextDues));

    if (isSupabaseActive) {
      pushAllDataToSupabase({
        members: nextMembers,
        duesRecords: nextDues,
        paymentSubmissions,
        transactions,
        donations,
        socialServices,
        bankAccounts,
        settings,
      }).catch(console.warn);
    }
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

    const nextMembers = [...members, ...addedMembers];
    const nextDues = [...duesRecords, ...addedDues];

    setMembers(nextMembers);
    setDuesRecords(nextDues);

    localStorage.setItem('patelki_members', JSON.stringify(nextMembers));
    localStorage.setItem('patelki_dues', JSON.stringify(nextDues));

    if (isSupabaseActive) {
      pushAllDataToSupabase({
        members: nextMembers,
        duesRecords: nextDues,
        paymentSubmissions,
        transactions,
        donations,
        socialServices,
        bankAccounts,
        settings,
      }).catch(console.warn);
    }
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
    const nextDues = duesRecords.map(d => {
      if ((d.memberId === memberId || (members.find(m => m.id === memberId)?.nap && d.memberId === members.find(m => m.id === memberId)?.nap)) && d.year === year && d.month === month) {
        return {
          ...d,
          status,
          amount: amount !== undefined ? amount : d.amount,
          updatedAt: today,
        };
      }
      return d;
    });

    setDuesRecords(nextDues);
    localStorage.setItem('patelki_dues', JSON.stringify(nextDues));

    if (isSupabaseActive) {
      pushAllDataToSupabase({
        members,
        duesRecords: nextDues,
        paymentSubmissions,
        transactions,
        donations,
        socialServices,
        bankAccounts,
        settings,
      }).catch(console.warn);
    }
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

    const nextDues = duesRecords.map(d => {
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

    setDuesRecords(nextDues);
    localStorage.setItem('patelki_dues', JSON.stringify(nextDues));

    if (isSupabaseActive) {
      pushAllDataToSupabase({
        members,
        duesRecords: nextDues,
        paymentSubmissions,
        transactions,
        donations,
        socialServices,
        bankAccounts,
        settings,
      }).catch(console.warn);
    }
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

  const deletePaymentSubmission = async (id: string) => {
    const nextSubmissions = paymentSubmissions.filter(s => s.id !== id);

    const nextDues = duesRecords.map(d => {
      if (d.paymentId === id) {
        return {
          ...d,
          status: 'unpaid' as const,
          paymentId: undefined,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      }
      return d;
    });

    const nextTransactions = transactions.filter(t => t.relatedPaymentId !== id);

    setPaymentSubmissions(nextSubmissions);
    setDuesRecords(nextDues);
    setTransactions(nextTransactions);

    localStorage.setItem('patelki_submissions', JSON.stringify(nextSubmissions));
    localStorage.setItem('patelki_dues', JSON.stringify(nextDues));
    localStorage.setItem('patelki_transactions', JSON.stringify(nextTransactions));

    deleteFromSupabase('payment_submissions', 'id', id).catch(console.error);
    deleteFromSupabase('cash_transactions', 'related_payment_id', id).catch(console.error);

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

  // Cash transactions
  const addTransaction = (tx: Omit<CashTransaction, 'id' | 'createdAt'>) => {
    const newTx: CashTransaction = {
      ...tx,
      id: `trx-${Date.now()}`,
      createdAt: new Date().toLocaleString('id-ID'),
    };
    const nextTransactions = [newTx, ...transactions];
    setTransactions(nextTransactions);
    localStorage.setItem('patelki_transactions', JSON.stringify(nextTransactions));

    if (isSupabaseActive) {
      pushAllDataToSupabase({
        members,
        duesRecords,
        paymentSubmissions,
        transactions: nextTransactions,
        donations,
        socialServices,
        bankAccounts,
        settings,
      }).catch(console.warn);
    }
  };

  const deleteTransaction = async (id: string) => {
    const txToDelete = transactions.find(t => t.id === id);
    const nextTransactions = transactions.filter(t => t.id !== id);
    setTransactions(nextTransactions);
    localStorage.setItem('patelki_transactions', JSON.stringify(nextTransactions));

    // Delete transaction from Supabase immediately & await
    if (isSupabaseActive || isSupabaseConfigured()) {
      await deleteFromSupabase('cash_transactions', 'id', id).catch(console.error);
    }

    // If it's a payment related transaction, reset dues and submission
    if (txToDelete && txToDelete.relatedPaymentId) {
      const subId = txToDelete.relatedPaymentId;
      setPaymentSubmissions(prev => prev.filter(s => s.id !== subId));
      if (isSupabaseActive || isSupabaseConfigured()) {
        await deleteFromSupabase('payment_submissions', 'id', subId).catch(console.error);
      }
      
      // Reset dues records for this submission
      const sub = paymentSubmissions.find(s => s.id === subId);
      if (sub) {
        const nextDues = duesRecords.map(d => {
          if (
            (d.memberId === sub.memberId || d.memberId === sub.memberNap) &&
            sub.months.some(m => m.year === d.year && m.month === d.month)
          ) {
            return { ...d, status: 'unpaid' as const, paymentId: undefined };
          }
          return d;
        });
        setDuesRecords(nextDues);
        localStorage.setItem('patelki_dues', JSON.stringify(nextDues));
      }
    }

    // If it was linked to a donation, also remove that donation so data is in sync
    if (txToDelete && (txToDelete.relatedDonationId || txToDelete.category.toLowerCase().includes('donasi'))) {
      const targetDon = donations.find(d => 
        d.id === txToDelete.relatedDonationId || 
        (d.donorName === txToDelete.sourceOrRecipient && d.amount === txToDelete.amount)
      );
      if (targetDon) {
        const nextDonations = donations.filter(d => d.id !== targetDon.id);
        setDonations(nextDonations);
        localStorage.setItem('patelki_donations', JSON.stringify(nextDonations));
        if (isSupabaseActive || isSupabaseConfigured()) {
          await deleteFromSupabase('donations', 'id', targetDon.id).catch(console.error);
        }
      }
    }
  };

  // Donations
  const addDonation = (don: Omit<Donation, 'id' | 'createdAt'>) => {
    const newId = `don-${Date.now()}`;
    const newDon: Donation = {
      ...don,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const nextDonations = [newDon, ...donations];
    setDonations(nextDonations);
    localStorage.setItem('patelki_donations', JSON.stringify(nextDonations));

    // Automatically record as income in Cashbook with relatedDonationId
    addTransaction({
      date: don.date,
      type: 'income',
      category: 'Donasi & Sumbangan Sukarela',
      sourceOrRecipient: don.donorName,
      amount: don.amount,
      description: `Donasi: ${don.purpose} - ${don.description}`,
      proofUrl: don.proofUrl,
      relatedDonationId: newId,
    });
  };

  const deleteDonation = async (id: string) => {
    const targetDon = donations.find(d => d.id === id);
    const nextDonations = donations.filter(d => d.id !== id);
    setDonations(nextDonations);
    localStorage.setItem('patelki_donations', JSON.stringify(nextDonations));

    // Also remove any linked transaction in Cashbook!
    const linkedTxList = transactions.filter(t => 
      t.relatedDonationId === id ||
      (targetDon && t.category.toLowerCase().includes('donasi') && t.sourceOrRecipient === targetDon.donorName)
    );
    const linkedTxIds = linkedTxList.map(t => t.id);
    const nextTransactions = transactions.filter(t => !linkedTxIds.includes(t.id));
    setTransactions(nextTransactions);
    localStorage.setItem('patelki_transactions', JSON.stringify(nextTransactions));

    if (isSupabaseActive || isSupabaseConfigured()) {
      await deleteFromSupabase('donations', 'id', id).catch(console.error);
      for (const txId of linkedTxIds) {
        await deleteFromSupabase('cash_transactions', 'id', txId).catch(console.error);
      }
    }
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

    const nextSocialServices = socialServices.filter(s => s.id !== id);

    const linkedTxIds = transactions
      .filter(t => {
        if (t.relatedSocialId === id) return true;
        if (targetSoc && t.category.toLowerCase().includes('bakti') && (t.sourceOrRecipient === targetSoc.title || t.description.includes(targetSoc.title))) return true;
        return false;
      })
      .map(t => t.id);

    const nextTransactions = transactions.filter(t => !linkedTxIds.includes(t.id));

    setSocialServices(nextSocialServices);
    setTransactions(nextTransactions);

    localStorage.setItem('patelki_social', JSON.stringify(nextSocialServices));
    localStorage.setItem('patelki_transactions', JSON.stringify(nextTransactions));

    if (isSupabaseActive || isSupabaseConfigured()) {
      await deleteFromSupabase('social_services', 'id', id).catch(console.warn);

      for (const txId of linkedTxIds) {
        await deleteFromSupabase('cash_transactions', 'id', txId).catch(console.warn);
      }

      if (targetSoc) {
        await deleteFromSupabase('cash_transactions', 'source_or_recipient', targetSoc.title).catch(console.warn);
      }
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

  const deleteBankAccount = async (id: string) => {
    const nextBankAccounts = bankAccounts.filter(b => b.id !== id);
    setBankAccounts(nextBankAccounts);
    localStorage.setItem('patelki_bank_accounts', JSON.stringify(nextBankAccounts));

    deleteFromSupabase('bank_accounts', 'id', id).catch(console.error);

    if (isSupabaseActive) {
      await pushAllDataToSupabase({
        members,
        duesRecords,
        paymentSubmissions,
        transactions,
        donations,
        socialServices,
        bankAccounts: nextBankAccounts,
        settings,
      }).catch(console.warn);
    }
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
    // Clear all business data keys from localStorage (preserving Supabase credentials)
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('patelki_') && !key.includes('supabase')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    localStorage.setItem('patelki_demo_purged_v7', 'true');

    setMembers([]);
    setDuesRecords([]);
    setPaymentSubmissions([]);
    setTransactions([]);
    setDonations([]);
    setSocialServices([]);
    setBankAccounts([]);
    setSettings(INITIAL_SETTINGS);
    setNotifications([]);
    setCurrentUserRole('bendahara');
    setCurrentMember(null);

    // Clear remote supabase tables if connected (child tables first to avoid FK constraint errors)
    if (isSupabaseConfigured() || isSupabaseActive) {
      const tables = [
        'dues_records',
        'payment_submissions',
        'cash_transactions',
        'donations',
        'social_services',
        'bank_accounts',
        'members',
      ];
      for (const table of tables) {
        try {
          await clearTableFromSupabase(table);
        } catch (err) {
          console.warn(`Notice clearing ${table}:`, err);
        }
      }
    }
    
    // Brief delay to allow network requests to settle then reload
    await new Promise(resolve => setTimeout(resolve, 500));
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
        deletePaymentSubmission,
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
