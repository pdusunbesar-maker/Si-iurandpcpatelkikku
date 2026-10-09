export const SUPABASE_SCHEMA_SQL = `-- ==============================================================
-- SKEMA DATABASE SUPABASE (POSTGRESQL) UNTUK SI-IURAN PATELKI
-- DPC PATELKI KABUPATEN KAYONG UTARA
-- Jalankan skrip ini pada Supabase SQL Editor (supabase.com)
-- ==============================================================

-- 1. TABEL ANGGOTA (members)
CREATE TABLE IF NOT EXISTS public.members (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    gelar TEXT DEFAULT '',
    nap TEXT NOT NULL UNIQUE,
    no_wa TEXT NOT NULL UNIQUE,
    instansi TEXT NOT NULL,
    jabatan TEXT DEFAULT '',
    status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
    foto TEXT,
    tanggal_bergabung TEXT,
    email TEXT,
    alamat TEXT,
    nik TEXT,
    password TEXT DEFAULT '123456',
    pin TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL REKENING BANK BENDAHARA (bank_accounts)
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id TEXT PRIMARY KEY,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_holder TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_primary BOOLEAN DEFAULT FALSE,
    notes TEXT,
    qris_url TEXT,
    CONSTRAINT unique_bank_and_number UNIQUE (bank_name, account_number)
);

-- 3. TABEL PENGAJUAN / BUKTI PEMBAYARAN IURAN (payment_submissions)
CREATE TABLE IF NOT EXISTS public.payment_submissions (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    member_name TEXT NOT NULL,
    member_nap TEXT NOT NULL,
    member_wa TEXT NOT NULL,
    member_instansi TEXT NOT NULL,
    months JSONB NOT NULL,
    total_amount NUMERIC NOT NULL CHECK (total_amount > 0),
    bank_account_id TEXT REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    proof_url TEXT NOT NULL,
    proof_name TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    verified_by TEXT,
    rejection_reason TEXT,
    notes TEXT
);

-- 4. TABEL REKAP IURAN BULANAN (dues_records)
CREATE TABLE IF NOT EXISTS public.dues_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    member_id TEXT NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    year INT NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    status TEXT DEFAULT 'unpaid' CHECK (status IN ('paid', 'pending', 'unpaid', 'inactive')),
    payment_id TEXT REFERENCES public.payment_submissions(id) ON DELETE SET NULL,
    amount NUMERIC DEFAULT 30000 CHECK (amount >= 0),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_member_year_month UNIQUE(member_id, year, month)
);

-- 5. TABEL BUKU KAS / TRANSAKSI KAS (cash_transactions)
CREATE TABLE IF NOT EXISTS public.cash_transactions (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    sub_category TEXT,
    source_or_recipient TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    proof_url TEXT,
    related_payment_id TEXT REFERENCES public.payment_submissions(id) ON DELETE SET NULL,
    recorded_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL DONASI / INFAQ (donations)
CREATE TABLE IF NOT EXISTS public.donations (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    donor_name TEXT NOT NULL,
    donor_contact TEXT,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    type TEXT DEFAULT 'uang' CHECK (type IN ('uang', 'barang', 'lainnya')),
    purpose TEXT NOT NULL,
    description TEXT,
    proof_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABEL PROGRAM BAKTI SOSIAL (social_services)
CREATE TABLE IF NOT EXISTS public.social_services (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    location TEXT NOT NULL,
    fund_source TEXT NOT NULL,
    total_budget NUMERIC DEFAULT 0 CHECK (total_budget >= 0),
    total_spent NUMERIC DEFAULT 0 CHECK (total_spent >= 0),
    beneficiaries TEXT NOT NULL,
    description TEXT,
    documentation_urls JSONB DEFAULT '[]'::JSONB,
    expenses JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABEL PENGATURAN APLIKASI (app_settings)
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY DEFAULT 'current_settings',
    organization_name TEXT NOT NULL,
    branch_name TEXT NOT NULL,
    monthly_fee NUMERIC DEFAULT 30000 CHECK (monthly_fee >= 0),
    initial_balance NUMERIC DEFAULT 0,
    start_year INT DEFAULT 2025,
    end_year INT DEFAULT 2031,
    address TEXT,
    contact_wa TEXT,
    contact_email TEXT,
    ketua_name TEXT,
    ketua_nap TEXT,
    bendahara_name TEXT,
    bendahara_nap TEXT,
    treasurer_username TEXT DEFAULT 'bendahara',
    treasurer_password TEXT DEFAULT 'bendahara123',
    categories_expense JSONB DEFAULT '[]'::JSONB,
    categories_income JSONB DEFAULT '[]'::JSONB,
    wa_template_approved TEXT,
    wa_template_reminder TEXT,
    wa_template_rejected TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrasi tambahan kolom & relasi aman jika tabel sudah ada sebelumnya
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS initial_balance NUMERIC DEFAULT 0;

-- ==============================================================
-- KEAMANAN & ROW LEVEL SECURITY (RLS)
-- Aktifkan akses tabel untuk aplikasi client-side (Anon Key)
-- ==============================================================

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dues_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon all on members" ON public.members;
CREATE POLICY "Allow anon all on members" ON public.members FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on dues_records" ON public.dues_records;
CREATE POLICY "Allow anon all on dues_records" ON public.dues_records FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on payment_submissions" ON public.payment_submissions;
CREATE POLICY "Allow anon all on payment_submissions" ON public.payment_submissions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on cash_transactions" ON public.cash_transactions;
CREATE POLICY "Allow anon all on cash_transactions" ON public.cash_transactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on donations" ON public.donations;
CREATE POLICY "Allow anon all on donations" ON public.donations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on social_services" ON public.social_services;
CREATE POLICY "Allow anon all on social_services" ON public.social_services FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on bank_accounts" ON public.bank_accounts;
CREATE POLICY "Allow anon all on bank_accounts" ON public.bank_accounts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on app_settings" ON public.app_settings;
CREATE POLICY "Allow anon all on app_settings" ON public.app_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Indeks performa & relasi Foreign Key
CREATE INDEX IF NOT EXISTS idx_members_nap ON public.members(nap);
CREATE INDEX IF NOT EXISTS idx_members_no_wa ON public.members(no_wa);
CREATE INDEX IF NOT EXISTS idx_dues_member_year ON public.dues_records(member_id, year);
CREATE INDEX IF NOT EXISTS idx_dues_payment_id ON public.dues_records(payment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_member_id ON public.payment_submissions(member_id);
CREATE INDEX IF NOT EXISTS idx_submissions_bank_id ON public.payment_submissions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.payment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.cash_transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_related_payment ON public.cash_transactions(related_payment_id);
`;
