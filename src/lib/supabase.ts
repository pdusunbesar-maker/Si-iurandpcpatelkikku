import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Member,
  DuesRecord,
  PaymentSubmission,
  CashTransaction,
  Donation,
  SocialService,
  BankAccount,
  AppSettings,
} from '../types';

const STORAGE_KEY_URL = 'patelki_supabase_url';
const STORAGE_KEY_KEY = 'patelki_supabase_key';
const STORAGE_KEY_AUTO_SYNC = 'patelki_supabase_auto_sync';

export interface SupabaseConfig {
  url: string;
  key: string;
  autoSync: boolean;
}

/**
 * Membersihkan dan menormalisasi URL Supabase.
 * Menangani kasus jika pengguna menyalin:
 * - URL dashboard: https://supabase.com/dashboard/project/abcdefgh -> dikonversi ke https://abcdefgh.supabase.co
 * - URL dengan subpath: https://abcdefgh.supabase.co/rest/v1 -> dihapus subpathnya menjadi https://abcdefgh.supabase.co
 * - URL dengan spasi, tanda petik, atau trailing slash
 */
export function normalizeSupabaseUrl(input: string): string {
  if (!input) return '';
  let url = input.trim().replace(/^["']|["']$/g, '').trim();

  // Jika pengguna menyalin URL browser dashboard Supabase
  const dashboardMatch = url.match(/supabase\.com\/dashboard\/project\/([a-zA-Z0-9_-]+)/);
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }

  // Jika tanpa protokol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);
    // Kembalikan origin saja (contoh: https://xyz.supabase.co) tanpa /rest/v1 atau /auth/v1
    return parsed.origin;
  } catch {
    return url
      .replace(/\/rest\/v1\/?.*$/, '')
      .replace(/\/auth\/v1\/?.*$/, '')
      .replace(/\/+$/, '');
  }
}

export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = localStorage.getItem(STORAGE_KEY_URL);
  const storedKey = localStorage.getItem(STORAGE_KEY_KEY);
  const storedAutoSync = localStorage.getItem(STORAGE_KEY_AUTO_SYNC);

  const rawUrl = storedUrl !== null ? storedUrl : envUrl;
  const rawKey = storedKey !== null ? storedKey : envKey;

  return {
    url: normalizeSupabaseUrl(rawUrl),
    key: rawKey.trim(),
    autoSync: storedAutoSync !== null ? storedAutoSync === 'true' : true,
  };
}

export function saveSupabaseConfig(url: string, key: string, autoSync: boolean = true): void {
  const cleanUrl = normalizeSupabaseUrl(url);
  const cleanKey = key.trim();
  localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
  localStorage.setItem(STORAGE_KEY_KEY, cleanKey);
  localStorage.setItem(STORAGE_KEY_AUTO_SYNC, autoSync ? 'true' : 'false');
  cachedClient = null; // Reset cached client on config change
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: false,
      },
    });
    return cachedClient;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key && url.startsWith('http') && key.length > 10);
}

export async function testSupabaseConnection(url?: string, key?: string): Promise<{ success: boolean; message: string; correctedUrl?: string }> {
  try {
    const config = getSupabaseConfig();
    const rawUrl = (url ?? config.url).trim();
    const rawKey = (key ?? config.key).trim();

    if (!rawUrl || !rawKey) {
      return { success: false, message: 'URL Supabase dan Anon API Key wajib diisi!' };
    }

    const testUrl = normalizeSupabaseUrl(rawUrl);
    const testKey = rawKey;

    if (!testUrl.startsWith('https://') && !testUrl.startsWith('http://')) {
      return { success: false, message: 'URL Supabase harus diawali https:// (contoh: https://xyz.supabase.co)' };
    }

    const client = createClient(testUrl, testKey, {
      auth: { persistSession: false },
    });

    // Test query to check if we can reach Supabase
    const { error } = await client.from('members').select('id').limit(1);

    if (error) {
      if (error.code === 'PGRST125' || error.message?.includes('Invalid path')) {
        return {
          success: false,
          message: `Koneksi gagal: Invalid path (Kode: PGRST125). URL telah otomatis dinormalisasi menjadi "${testUrl}". Silakan klik "Simpan Konfigurasi Supabase" lalu tes ulang.`,
          correctedUrl: testUrl,
        };
      }
      if (error.code === 'PGRST205' || error.message?.includes('relation "public.members" does not exist')) {
        return {
          success: true,
          message: 'Berhasil terhubung ke Supabase! Namun tabel belum dibuat. Silakan klik tombol "Skrip SQL Schema", lalu tempel dan jalankan di menu SQL Editor pada Dashboard Supabase Anda.',
          correctedUrl: testUrl,
        };
      }
      if (
        error.code === 'PGRST301' ||
        error.message?.includes('JWT') ||
        error.message?.includes('apikey') ||
        error.message?.includes('Invalid API key') ||
        error.message?.includes('Unauthorized') ||
        (error as any).status === 401
      ) {
        return {
          success: false,
          message: `Koneksi ditolak: API Key (anon key) atau URL Supabase tidak valid. Pastikan menyalin kunci "anon / public" yang benar dari Project Settings > API pada Supabase.`,
          correctedUrl: testUrl,
        };
      }
      return {
        success: false,
        message: `Koneksi gagal: ${error.message} (Kode: ${error.code || 'UNKNOWN'}). Pastikan URL Project dan Anon API Key Supabase Anda sudah benar.`,
        correctedUrl: testUrl,
      };
    }

    return {
      success: true,
      message: 'Koneksi ke Supabase berhasil & tabel terverifikasi!',
      correctedUrl: testUrl,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal terhubung ke server Supabase: ${err.message || 'Periksa kembali URL Project Supabase atau koneksi internet Anda.'}`,
    };
  }
}

function safeImagePayload(url?: string | null): string | null {
  if (!url) return null;
  if (typeof url === 'string' && url.startsWith('data:') && url.length > 500000) {
    return null;
  }
  return url;
}

function toIsoTimestamp(val: any): string {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string' && (val.includes('T') || val.includes('-')) && !val.includes(',')) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  try {
    const cleaned = String(val).replace(/\./g, ':');
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  } catch {}
  return new Date().toISOString();
}

async function upsertInChunks(
  client: SupabaseClient,
  table: string,
  data: any[],
  onConflict: string,
  chunkSize: number = 100,
  maxRetries: number = 3
) {
  if (!data || data.length === 0) return;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    let attempt = 0;
    let success = false;
    let lastError: any = null;

    while (attempt < maxRetries && !success) {
      try {
        const { error } = await client.from(table).upsert(chunk as any, { onConflict });
        if (error) {
          throw new Error(`Tabel ${table}: ${error.message}`);
        }
        success = true;
      } catch (err: any) {
        attempt++;
        lastError = err;
        console.warn(`Upsert attempt ${attempt}/${maxRetries} on ${table} failed:`, err);
        if (attempt >= maxRetries) {
          throw new Error(`Tabel ${table}: ${err.message || 'Koneksi terputus saat mengunggah'}`);
        }
        // Exponential backoff delay (400ms, 800ms, 1600ms)
        await new Promise(resolve => setTimeout(resolve, 400 * Math.pow(2, attempt - 1)));
      }
    }
    // Small breathing room between chunks
    await new Promise(resolve => setTimeout(resolve, 120));
  }
}

export async function upsertToSupabase(
  table: string,
  data: any,
  onConflict: string
): Promise<{ success: boolean; message: string }> {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    return { success: false, message: 'Supabase belum dikonfigurasi!' };
  }

  const client = createClient(url, key, { auth: { persistSession: false } });

  try {
    const { error } = await client.from(table).upsert(data, { onConflict });
    if (error) {
      throw new Error(`Tabel ${table}: ${error.message}`);
    }
    return { success: true, message: 'Data berhasil disimpan ke Supabase' };
  } catch (error: any) {
    console.error('Error upserting to Supabase:', error);
    return { success: false, message: `Gagal menyimpan data: ${error.message}` };
  }
}

/**
 * Menghapus record dari Supabase berdasarkan ID atau field tertentu.
 */
export async function deleteFromSupabase(
  table: string,
  field: string,
  value: any
): Promise<{ success: boolean; message: string }> {
  // Always get a fresh configuration and client to ensure connectivity
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    return { success: false, message: 'Supabase belum dikonfigurasi!' };
  }

  const client = createClient(url, key, { auth: { persistSession: false } });

  try {
    const { error } = await client.from(table).delete().eq(field, value);
    if (error) {
      throw new Error(`Tabel ${table}: ${error.message}`);
    }
    return { success: true, message: 'Data berhasil dihapus dari Supabase' };
  } catch (error: any) {
    console.error('Error deleting from Supabase:', error);
    return { success: false, message: `Gagal menghapus data: ${error.message}` };
  }
}

export async function clearTableFromSupabase(table: string): Promise<{ success: boolean; message: string }> {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    return { success: false, message: 'Supabase belum dikonfigurasi!' };
  }

  const client = createClient(url, key, { auth: { persistSession: false } });

  try {
    // Delete all records in the table
    const { error } = await client.from(table).delete().neq('id', 'non-existent-id-1234567890');
    if (error) {
      throw new Error(`Tabel ${table}: ${error.message}`);
    }
    return { success: true, message: `Tabel ${table} berhasil dibersihkan.` };
  } catch (error: any) {
    console.error(`Error clearing table ${table} in Supabase:`, error);
    return { success: false, message: `Gagal membersihkan tabel ${table}: ${error.message}` };
  }
}

// ==========================================
// PUSH / UPLOAD SEMUA DATA LOKAL KE SUPABASE
// ==========================================
export async function pushAllDataToSupabase(data: {
  members: Member[];
  duesRecords: DuesRecord[];
  paymentSubmissions: PaymentSubmission[];
  transactions: CashTransaction[];
  donations: Donation[];
  socialServices: SocialService[];
  bankAccounts: BankAccount[];
  settings: AppSettings;
}): Promise<{ success: boolean; message: string; details?: any }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase belum dikonfigurasi!' };
  }

  try {
    // 1. Members
    const membersPayload = data.members.map(m => ({
      id: m.id,
      nama: m.nama,
      gelar: m.gelar || '',
      nap: m.nap,
      no_wa: m.noWa,
      instansi: m.instansi,
      jabatan: m.jabatan || '',
      status: m.status,
      foto: safeImagePayload(m.foto),
      tanggal_bergabung: m.tanggalBergabung,
      email: m.email || null,
      alamat: m.alamat || null,
      nik: m.nik || null,
      password: m.password || '123456',
      pin: m.pin || null,
    }));
    await upsertInChunks(client, 'members', membersPayload, 'nap', 50);

    // Retrieve active members from Supabase to resolve foreign key ID mappings
    const { data: dbMembers } = await client.from('members').select('id, nap');
    const memberIdMap = new Map<string, string>();
    if (dbMembers && dbMembers.length > 0) {
      data.members.forEach(localM => {
        const found = dbMembers.find((dbM: any) => dbM.nap === localM.nap || dbM.id === localM.id);
        if (found) {
          memberIdMap.set(localM.id, found.id);
        }
      });
    }

    // 2. Dues records (batch 100 for fast, stable uploads with retry)
    const duesPayload = data.duesRecords
      .map(d => {
        const actualMemberId = memberIdMap.get(d.memberId) || d.memberId;
        return {
          member_id: actualMemberId,
          year: d.year,
          month: d.month,
          status: d.status,
          payment_id: d.paymentId || null,
          amount: d.amount,
          updated_at: toIsoTimestamp(d.updatedAt),
        };
      })
      .filter(d => {
        if (dbMembers && dbMembers.length > 0) {
          return dbMembers.some((dbM: any) => dbM.id === d.member_id);
        }
        return true;
      });

    await upsertInChunks(client, 'dues_records', duesPayload, 'member_id,year,month', 100);

    // 3. Payment submissions
    const submissionsPayload = data.paymentSubmissions
      .map(s => {
        const actualMemberId = memberIdMap.get(s.memberId) || s.memberId;
        return {
          id: s.id,
          member_id: actualMemberId,
          member_name: s.memberName,
          member_nap: s.memberNap,
          member_wa: s.memberWa,
          member_instansi: s.memberInstansi,
          months: s.months,
          total_amount: s.totalAmount,
          bank_account_id: s.bankAccountId,
          bank_name: s.bankName,
          account_number: s.accountNumber,
          proof_url: safeImagePayload(s.proofUrl) || s.proofUrl,
          proof_name: s.proofName || null,
          status: s.status,
          submitted_at: toIsoTimestamp(s.submittedAt),
          verified_at: s.verifiedAt ? toIsoTimestamp(s.verifiedAt) : null,
          verified_by: s.verifiedBy || null,
          rejection_reason: s.rejectionReason || null,
          notes: s.notes || null,
        };
      })
      .filter(s => {
        if (dbMembers && dbMembers.length > 0) {
          return dbMembers.some((dbM: any) => dbM.id === s.member_id);
        }
        return true;
      });

    await upsertInChunks(client, 'payment_submissions', submissionsPayload, 'id', 50);

    // 4. Cash Transactions
    const txPayload = data.transactions.map(t => ({
      id: t.id,
      date: t.date,
      type: t.type,
      category: t.category,
      sub_category: t.subCategory || null,
      source_or_recipient: t.sourceOrRecipient,
      amount: t.amount,
      description: t.description,
      proof_url: safeImagePayload(t.proofUrl) || t.proofUrl || null,
      related_payment_id: t.relatedPaymentId || null,
      recorded_by: t.recordedBy || null,
      created_at: toIsoTimestamp(t.createdAt),
    }));
    await upsertInChunks(client, 'cash_transactions', txPayload, 'id', 100);

    // 5. Donations
    const donPayload = data.donations.map(dn => ({
      id: dn.id,
      date: dn.date,
      donor_name: dn.donorName,
      donor_contact: dn.donorContact || null,
      amount: dn.amount,
      type: dn.type,
      purpose: dn.purpose,
      description: dn.description,
      proof_url: safeImagePayload(dn.proofUrl) || dn.proofUrl || null,
      created_at: toIsoTimestamp(dn.createdAt),
    }));
    await upsertInChunks(client, 'donations', donPayload, 'id', 100);

    // 6. Social Services
    const socPayload = data.socialServices.map(sc => ({
      id: sc.id,
      title: sc.title,
      date: sc.date,
      location: sc.location,
      fund_source: sc.fundSource,
      total_budget: sc.totalBudget,
      total_spent: sc.totalSpent,
      beneficiaries: sc.beneficiaries,
      description: sc.description,
      documentation_urls: sc.documentationUrls || [],
      expenses: sc.expenses || [],
      created_at: toIsoTimestamp(sc.createdAt),
    }));
    await upsertInChunks(client, 'social_services', socPayload, 'id', 50);

    // 7. Bank Accounts
    const bankPayload = data.bankAccounts.map(b => ({
      id: b.id,
      bank_name: b.bankName,
      account_number: b.accountNumber,
      account_holder: b.accountHolder,
      is_active: b.isActive,
      is_primary: b.isPrimary,
      notes: b.notes || null,
      qris_url: b.qrisUrl || null,
    }));
    await upsertInChunks(client, 'bank_accounts', bankPayload, 'id', 50);

    // 8. Settings
    const settingsPayload = {
      id: 'current_settings',
      organization_name: data.settings.organizationName,
      branch_name: data.settings.branchName,
      monthly_fee: data.settings.monthlyFee,
      start_year: data.settings.startYear,
      end_year: data.settings.endYear,
      address: data.settings.address,
      contact_wa: data.settings.contactWa,
      contact_email: data.settings.contactEmail,
      ketua_name: data.settings.ketuaName,
      ketua_nap: data.settings.ketuaNap,
      bendahara_name: data.settings.bendaharaName,
      bendahara_nap: data.settings.bendaharaNap,
      treasurer_username: data.settings.treasurerUsername || 'bendahara',
      treasurer_password: data.settings.treasurerPassword || 'bendahara123',
      categories_expense: data.settings.categoriesExpense || [],
      categories_income: data.settings.categoriesIncome || [],
      wa_template_approved: data.settings.waTemplateApproved,
      wa_template_reminder: data.settings.waTemplateReminder,
      wa_template_rejected: data.settings.waTemplateRejected,
      updated_at: new Date().toISOString(),
    };
    await upsertInChunks(client, 'app_settings', [settingsPayload], 'id', 1);

    return {
      success: true,
      message: `Semua data (${data.members.length} anggota, ${data.transactions.length} transaksi kas, ${data.duesRecords.length} iuran) berhasil diunggah ke Supabase!`,
    };
  } catch (error: any) {
    console.error('Error uploading to Supabase:', error);
    const msg = error.message?.includes('Failed to fetch') || error?.name === 'TypeError'
      ? 'Gagal terhubung ke server Supabase. Periksa koneksi internet atau ketersediaan URL & API Key Supabase Anda.'
      : error.message || 'Terjadi kesalahan saat upload';
    return { success: false, message: `Gagal mengunggah data: ${msg}` };
  }
}

// ==========================================
// TARIK / PULL SEMUA DATA DARI SUPABASE
// ==========================================
export async function pullAllDataFromSupabase(): Promise<{
  success: boolean;
  message: string;
  data?: {
    members: Member[];
    duesRecords: DuesRecord[];
    paymentSubmissions: PaymentSubmission[];
    transactions: CashTransaction[];
    donations: Donation[];
    socialServices: SocialService[];
    bankAccounts: BankAccount[];
    settings?: AppSettings;
  };
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase belum dikonfigurasi!' };
  }

  try {
    // 1. Members
    const { data: dbMembers, error: errM } = await client.from('members').select('*');
    if (errM) throw new Error(`members: ${errM.message}`);

    // 2. Dues
    const { data: dbDues, error: errD } = await client.from('dues_records').select('*').limit(10000);
    if (errD) throw new Error(`dues_records: ${errD.message}`);

    // 3. Submissions
    const { data: dbSubs, error: errS } = await client.from('payment_submissions').select('*');
    if (errS) throw new Error(`payment_submissions: ${errS.message}`);

    // 4. Transactions
    const { data: dbTx, error: errT } = await client.from('cash_transactions').select('*');
    if (errT) throw new Error(`cash_transactions: ${errT.message}`);

    // 5. Donations
    const { data: dbDon, error: errDn } = await client.from('donations').select('*');
    if (errDn) throw new Error(`donations: ${errDn.message}`);

    // 6. Social
    const { data: dbSoc, error: errSc } = await client.from('social_services').select('*');
    if (errSc) throw new Error(`social_services: ${errSc.message}`);

    // 7. Bank
    const { data: dbBank, error: errB } = await client.from('bank_accounts').select('*');
    if (errB) throw new Error(`bank_accounts: ${errB.message}`);

    // 8. Settings
    const { data: dbSettings } = await client.from('app_settings').select('*').limit(1).maybeSingle();

    const members: Member[] = (dbMembers || []).map((m: any) => ({
      id: m.id,
      nama: m.nama,
      gelar: m.gelar || '',
      nap: m.nap,
      noWa: m.no_wa,
      instansi: m.instansi,
      jabatan: m.jabatan || '',
      status: m.status,
      foto: m.foto || undefined,
      tanggalBergabung: m.tanggal_bergabung,
      email: m.email || undefined,
      alamat: m.alamat || undefined,
      nik: m.nik || undefined,
      password: m.password || undefined,
      pin: m.pin || undefined,
    }));

    const duesRecords: DuesRecord[] = (dbDues || []).map((d: any) => ({
      memberId: d.member_id,
      year: d.year,
      month: d.month,
      status: d.status,
      paymentId: d.payment_id || undefined,
      amount: Number(d.amount) || 25000,
      updatedAt: d.updated_at,
    }));

    const paymentSubmissions: PaymentSubmission[] = (dbSubs || []).map((s: any) => ({
      id: s.id,
      memberId: s.member_id,
      memberName: s.member_name,
      memberNap: s.member_nap,
      memberWa: s.member_wa,
      memberInstansi: s.member_instansi,
      months: s.months || [],
      totalAmount: Number(s.total_amount),
      bankAccountId: s.bank_account_id,
      bankName: s.bank_name,
      accountNumber: s.account_number,
      proofUrl: s.proof_url,
      proofName: s.proof_name || undefined,
      status: s.status,
      submittedAt: s.submitted_at,
      verifiedAt: s.verified_at || undefined,
      verifiedBy: s.verified_by || undefined,
      rejectionReason: s.rejection_reason || undefined,
      notes: s.notes || undefined,
    }));

    const transactions: CashTransaction[] = (dbTx || []).map((t: any) => ({
      id: t.id,
      date: t.date,
      type: t.type,
      category: t.category,
      subCategory: t.sub_category || undefined,
      sourceOrRecipient: t.source_or_recipient,
      amount: Number(t.amount),
      description: t.description,
      proofUrl: t.proof_url || undefined,
      relatedPaymentId: t.related_payment_id || undefined,
      recordedBy: t.recorded_by || undefined,
      createdAt: t.created_at,
    }));

    const donations: Donation[] = (dbDon || []).map((dn: any) => ({
      id: dn.id,
      date: dn.date,
      donorName: dn.donor_name,
      donorContact: dn.donor_contact || undefined,
      amount: Number(dn.amount),
      type: dn.type,
      purpose: dn.purpose,
      description: dn.description,
      proofUrl: dn.proof_url || undefined,
      createdAt: dn.created_at,
    }));

    const socialServices: SocialService[] = (dbSoc || []).map((sc: any) => ({
      id: sc.id,
      title: sc.title,
      date: sc.date,
      location: sc.location,
      fundSource: sc.fund_source,
      totalBudget: Number(sc.total_budget),
      totalSpent: Number(sc.total_spent),
      beneficiaries: sc.beneficiaries,
      description: sc.description,
      documentationUrls: sc.documentation_urls || [],
      expenses: sc.expenses || [],
      createdAt: sc.created_at,
    }));

    const bankAccounts: BankAccount[] = (dbBank || []).map((b: any) => ({
      id: b.id,
      bankName: b.bank_name,
      accountNumber: b.account_number,
      accountHolder: b.account_holder,
      isActive: b.is_active,
      isPrimary: b.is_primary,
      notes: b.notes || undefined,
      qrisUrl: b.qris_url || undefined,
    }));

    let settings: AppSettings | undefined = undefined;
    if (dbSettings) {
      settings = {
        organizationName: dbSettings.organization_name || 'DPC PATELKI KABUPATEN KAYONG UTARA',
        branchName: dbSettings.branch_name || 'Kabupaten Kayong Utara',
        monthlyFee: Number(dbSettings.monthly_fee) || 25000,
        startYear: Number(dbSettings.start_year) || 2024,
        endYear: Number(dbSettings.end_year) || 2026,
        address: dbSettings.address || '',
        contactWa: dbSettings.contact_wa || '',
        contactEmail: dbSettings.contact_email || '',
        ketuaName: dbSettings.ketua_name || '',
        ketuaNap: dbSettings.ketua_nap || '',
        bendaharaName: dbSettings.bendahara_name || '',
        bendaharaNap: dbSettings.bendahara_nap || '',
        treasurerUsername: dbSettings.treasurer_username || 'bendahara',
        treasurerPassword: dbSettings.treasurer_password || 'bendahara123',
        categoriesExpense: dbSettings.categories_expense || [],
        categoriesIncome: dbSettings.categories_income || [],
        waTemplateApproved: dbSettings.wa_template_approved || '',
        waTemplateReminder: dbSettings.wa_template_reminder || '',
        waTemplateRejected: dbSettings.wa_template_rejected || '',
      };
    }

    return {
      success: true,
      message: `Berhasil menarik ${members.length} anggota, ${transactions.length} transaksi, ${duesRecords.length} catatan iuran dari Supabase!`,
      data: {
        members,
        duesRecords,
        paymentSubmissions,
        transactions,
        donations,
        socialServices,
        bankAccounts,
        settings,
      },
    };
  } catch (error: any) {
    console.error('Error pulling from Supabase:', error);
    return { success: false, message: `Gagal menarik data dari Supabase: ${error.message || 'Terjadi kesalahan'}` };
  }
}

/**
 * Berlangganan perubahan realtime ke Supabase untuk sinkronisasi antar perangkat/pengguna.
 */
export function subscribeToSupabaseRealtime(onDataChanged: () => void): (() => void) | null {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const channel = client
      .channel('patelki-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        onDataChanged();
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Failed to subscribe to Supabase realtime:', err);
    return null;
  }
}

