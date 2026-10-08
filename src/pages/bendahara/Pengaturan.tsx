import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BankAccount } from '../../types';
import {
  Settings,
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  Save,
  Building,
  Check,
  QrCode,
  RotateCcw,
  Shield,
  Lock,
  Eye,
  EyeOff,
  User,
  Database,
  Cloud,
  UploadCloud,
  DownloadCloud,
  Copy,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Code2,
  Phone,
  MessageSquare,
  Send,
} from 'lucide-react';
import { SUPABASE_SCHEMA_SQL } from '../../data/supabaseSchemaSql';
import { PhotoUploader } from '../../components/PhotoUploader';
import { normalizeSupabaseUrl } from '../../lib/supabase';

export const Pengaturan: React.FC = () => {
  const {
    members,
    updateMember,
    currentMember,
    setCurrentMember,
    bankAccounts,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    settings,
    updateSettings,
    formatCurrency,
    resetAllDataToDefault,
    isSupabaseActive,
    isSupabaseSyncing,
    supabaseConfig,
    saveSupabaseSettings,
    syncUploadToSupabase,
    syncDownloadFromSupabase,
    testSupabase,
    generateWhatsAppLink,
    formatPhoneDisplay,
    normalizePhoneNumber,
  } = useApp();

  const [settingsForm, setSettingsForm] = useState(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [waSavedSuccess, setWaSavedSuccess] = useState(false);

  // Sync settingsForm if settings change externally
  React.useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  const handleSaveWaNumber = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanWa = normalizePhoneNumber(settingsForm.contactWa);
    const updated = { ...settingsForm, contactWa: cleanWa };
    setSettingsForm(updated);
    updateSettings({ contactWa: cleanWa });
    setWaSavedSuccess(true);
    setTimeout(() => setWaSavedSuccess(false), 2500);
  };

  const handleTestWa = () => {
    const cleanWa = normalizePhoneNumber(settingsForm.contactWa);
    const testMsg = `Halo Bendahara DPC PATELKI Kayong Utara,\n\nIni adalah pesan uji coba tautan konfirmasi pembayaran iuran. Nomor WhatsApp ini (${cleanWa}) telah terhubung dengan benar ke aplikasi!`;
    const url = generateWhatsAppLink(cleanWa, testMsg);
    window.open(url, '_blank');
  };

  // Treasurer Member and Photo
  const treasurerMember = members.find(m => m.id === currentMember?.id || m.jabatan?.toLowerCase().includes('bendahara')) || members[0];
  const [treasurerPhoto, setTreasurerPhoto] = useState(treasurerMember?.foto || '');

  const handleTreasurerPhotoChange = (newPhoto: string) => {
    setTreasurerPhoto(newPhoto);
    if (treasurerMember) {
      updateMember(treasurerMember.id, { foto: newPhoto });
      if (currentMember && currentMember.id === treasurerMember.id) {
        setCurrentMember({ ...currentMember, foto: newPhoto });
      }
    }
  };

  // Supabase state
  const [supabaseUrl, setSupabaseUrl] = useState(supabaseConfig.url || '');
  const [supabaseKey, setSupabaseKey] = useState(supabaseConfig.key || '');
  const [supabaseAutoSync, setSupabaseAutoSync] = useState(supabaseConfig.autoSync ?? true);
  const [showSupabaseKey, setShowSupabaseKey] = useState(false);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [supabaseActionMsg, setSupabaseActionMsg] = useState<{ success: boolean; message: string } | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await resetAllDataToDefault();
    } finally {
      setIsResetting(false);
      setShowResetConfirmModal(false);
    }
  };

  const handleTestSupabase = async () => {
    setIsTestingSupabase(true);
    setSupabaseTestResult(null);
    try {
      const normalized = normalizeSupabaseUrl(supabaseUrl);
      if (normalized && normalized !== supabaseUrl) {
        setSupabaseUrl(normalized);
      }
      const res = await testSupabase(normalized || supabaseUrl, supabaseKey);
      if ((res as any).correctedUrl && (res as any).correctedUrl !== supabaseUrl) {
        setSupabaseUrl((res as any).correctedUrl);
      }
      setSupabaseTestResult(res);
    } catch (err: any) {
      setSupabaseTestResult({ success: false, message: err.message || 'Gagal terhubung' });
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = normalizeSupabaseUrl(supabaseUrl);
    setSupabaseUrl(cleanUrl);
    saveSupabaseSettings(cleanUrl, supabaseKey.trim(), supabaseAutoSync);
    setSupabaseActionMsg({ success: true, message: 'Konfigurasi Supabase berhasil dinormalisasi & disimpan!' });
    setTimeout(() => setSupabaseActionMsg(null), 3000);
  };

  const handleUploadAllToSupabase = async () => {
    if (!supabaseUrl || !supabaseKey) {
      alert('Harap isi URL dan Anon Key Supabase terlebih dahulu!');
      return;
    }
    const res = await syncUploadToSupabase();
    setSupabaseActionMsg(res);
    setTimeout(() => setSupabaseActionMsg(null), 4000);
  };

  const handleDownloadAllFromSupabase = async () => {
    if (!supabaseUrl || !supabaseKey) {
      alert('Harap isi URL dan Anon Key Supabase terlebih dahulu!');
      return;
    }
    const res = await syncDownloadFromSupabase();
    setSupabaseActionMsg(res);
    setTimeout(() => setSupabaseActionMsg(null), 4000);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Treasurer password change state
  const [treasurerName, setTreasurerName] = useState(settings.bendaharaName || treasurerMember?.nama || '');
  const [treasurerNap, setTreasurerNap] = useState(settings.bendaharaNap || treasurerMember?.nap || '');
  const [treasurerUser, setTreasurerUser] = useState(settings.treasurerUsername || 'bendahara');
  const [treasurerPass, setTreasurerPass] = useState(settings.treasurerPassword || 'bendahara123');
  const [showTreasurerPass, setShowTreasurerPass] = useState(false);
  const [authSavedSuccess, setAuthSavedSuccess] = useState(false);

  const handleSaveAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!treasurerName.trim()) {
      alert('Nama Bendahara tidak boleh kosong!');
      return;
    }
    if (!treasurerUser.trim()) {
      alert('Username Bendahara tidak boleh kosong!');
      return;
    }
    if (!treasurerPass.trim() || treasurerPass.length < 4) {
      alert('Kata sandi minimal 4 karakter!');
      return;
    }

    const cleanName = treasurerName.trim();
    const cleanNap = treasurerNap.trim();

    // 1. Update settings
    updateSettings({
      bendaharaName: cleanName,
      bendaharaNap: cleanNap,
      treasurerUsername: treasurerUser.trim(),
      treasurerPassword: treasurerPass.trim(),
    });

    // 2. Sync with settingsForm
    setSettingsForm(prev => ({
      ...prev,
      bendaharaName: cleanName,
      bendaharaNap: cleanNap,
    }));

    // 3. Sync with treasurer member and currentMember
    if (treasurerMember) {
      updateMember(treasurerMember.id, {
        nama: cleanName,
        nap: cleanNap,
        foto: treasurerPhoto,
      });
      if (currentMember) {
        setCurrentMember({
          ...currentMember,
          nama: cleanName,
          nap: cleanNap,
          foto: treasurerPhoto,
        });
      }
    }

    setAuthSavedSuccess(true);
    setTimeout(() => setAuthSavedSuccess(false), 2500);
  };

  // Bank modal state
  const [showBankModal, setShowBankModal] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [bankFormData, setBankFormData] = useState<Omit<BankAccount, 'id'>>({
    bankName: 'Bank Kalbar',
    accountNumber: '',
    accountHolder: 'DPC PATELKI KAYONG UTARA',
    isActive: true,
    isPrimary: false,
    notes: '',
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(settingsForm);

    if (settingsForm.bendaharaName) {
      setTreasurerName(settingsForm.bendaharaName);
    }
    if (settingsForm.bendaharaNap) {
      setTreasurerNap(settingsForm.bendaharaNap);
    }

    if (treasurerMember) {
      updateMember(treasurerMember.id, {
        nama: settingsForm.bendaharaName,
        nap: settingsForm.bendaharaNap,
      });
      if (currentMember) {
        setCurrentMember({
          ...currentMember,
          nama: settingsForm.bendaharaName,
          nap: settingsForm.bendaharaNap,
        });
      }
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankFormData.accountNumber) {
      alert('Nomor rekening wajib diisi!');
      return;
    }

    if (editingBank) {
      updateBankAccount(editingBank.id, bankFormData);
      setEditingBank(null);
    } else {
      addBankAccount(bankFormData);
      setShowBankModal(false);
    }
  };

  const handleOpenEditBank = (b: BankAccount) => {
    setEditingBank(b);
    setBankFormData({
      bankName: b.bankName,
      accountNumber: b.accountNumber,
      accountHolder: b.accountHolder,
      isActive: b.isActive,
      isPrimary: b.isPrimary,
      notes: b.notes || '',
      qrisUrl: b.qrisUrl,
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Pengaturan Aplikasi & Rekening
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-xs font-bold">
            Konfigurasi DPC
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Kelola rekening tujuan pembayaran, nominal iuran bulanan, template WhatsApp, dan pejabat DPC.
        </p>
      </div>

      {/* 1. Rekening Bank Bendahara */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-500" />
              Rekening Pembayaran Bendahara
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Rekening bank / QRIS yang akan ditampilkan kepada anggota saat membayar iuran.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingBank(null);
              setBankFormData({
                bankName: 'Bank Kalbar',
                accountNumber: '',
                accountHolder: 'DPC PATELKI KAYONG UTARA',
                isActive: true,
                isPrimary: false,
                notes: '',
              });
              setShowBankModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Tambah Rekening Bank
          </button>
        </div>

        {/* Bank accounts grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bankAccounts.map(b => (
            <div
              key={b.id}
              className={`p-5 rounded-2xl border-2 flex flex-col justify-between transition-all ${
                b.isPrimary
                  ? 'border-emerald-500 bg-emerald-50/20'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900">{b.bankName}</span>
                  {b.isPrimary && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Utama
                    </span>
                  )}
                </div>

                <p className="font-mono text-base font-black text-emerald-800 mt-2 tracking-wide">
                  {b.accountNumber}
                </p>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">
                  a/n {b.accountHolder}
                </p>
                {b.notes && (
                  <p className="text-[11px] text-slate-500 mt-2 italic leading-tight">
                    {b.notes}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span
                  className={`text-[11px] font-bold ${
                    b.isActive ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  {b.isActive ? '🟢 Aktif' : '⚫ Nonaktif'}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditBank(b)}
                    className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg"
                    title="Edit Rekening"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Hapus rekening ${b.bankName}?`)) {
                        deleteBankAccount(b.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                    title="Hapus Rekening"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Profil Akun & Kredensial Login Bendahara */}
      <form onSubmit={handleSaveAuth} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            Profil Akun & Kredensial Login Bendahara
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Perbarui nama resmi, NAP, foto profil, username, dan kata sandi Bendahara DPC. Perubahan langsung sinkron ke seluruh aplikasi termasuk bilah atas (Navbar).
          </p>
        </div>

        {/* Nama & NAP Bendahara */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Nama Lengkap Bendahara & Gelar *
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <User className="w-4 h-4 text-emerald-600" />
              </div>
              <input
                type="text"
                required
                value={treasurerName}
                onChange={e => setTreasurerName(e.target.value)}
                placeholder="Contoh: Siti Nurhaliza, S.Tr.Kes"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 outline-hidden focus:border-amber-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Nama yang tampil di bilah atas (Navbar), kuitansi, dan laporan keuangan.
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Nomor Anggota (NAP) Bendahara *
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Shield className="w-4 h-4 text-emerald-600" />
              </div>
              <input
                type="text"
                required
                value={treasurerNap}
                onChange={e => setTreasurerNap(e.target.value)}
                placeholder="Contoh: 61.11.001"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 outline-hidden focus:border-amber-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              NAP resmi Bendahara DPC Patelki Kayong Utara.
            </p>
          </div>
        </div>

        {/* Username & Password Login */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs pt-2 border-t border-slate-100">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Username Login Bendahara *
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <User className="w-4 h-4 text-amber-500" />
              </div>
              <input
                type="text"
                required
                value={treasurerUser}
                onChange={e => setTreasurerUser(e.target.value)}
                placeholder="Contoh: bendahara"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 outline-hidden focus:border-amber-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Username yang dimasukkan pada form login Bendahara.
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Kata Sandi / Password Baru Bendahara *
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="w-4 h-4 text-amber-500" />
              </div>
              <input
                type={showTreasurerPass ? 'text' : 'password'}
                required
                value={treasurerPass}
                onChange={e => setTreasurerPass(e.target.value)}
                placeholder="Masukkan kata sandi baru..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 outline-hidden focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowTreasurerPass(!showTreasurerPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showTreasurerPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Minimal 4 karakter (Default awal: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">bendahara123</code>).
            </p>
          </div>
        </div>

        {/* Unggah Foto Profil Bendahara */}
        <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200">
          <PhotoUploader
            currentPhoto={treasurerPhoto}
            name={treasurerName || treasurerMember?.nama || treasurerUser || 'Bendahara'}
            onChange={handleTreasurerPhotoChange}
            label="Foto Profil Bendahara (Kamera / Galeri HP / Komputer)"
            helperText="Unggah foto resmi Bendahara DPC. Foto langsung tersimpan ke sistem & diperbarui di navbar atas."
            size="md"
          />
        </div>

        <div className="flex items-center justify-end pt-2 border-t border-slate-100">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
          >
            {authSavedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {authSavedSuccess ? 'Profil & Kredensial Bendahara Diperbarui!' : 'Simpan Profil & Kredensial Bendahara'}
          </button>
        </div>
      </form>

      {/* 2.5 Dedicated WhatsApp Konfirmasi Pembayaran Setting Card */}
      <div className="bg-linear-to-r from-emerald-900 via-emerald-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-700/50 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-700/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Nomor WhatsApp Konfirmasi Pembayaran
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                  Tujuan Otomatis Anggota
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Nomor WhatsApp Bendahara yang langsung dihubungi oleh anggota saat selesai mengirim bukti pembayaran.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestWa}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-700/70 hover:bg-emerald-600/90 text-white rounded-xl text-xs font-bold border border-emerald-500/40 transition-all cursor-pointer shrink-0"
            title="Kirim pesan tes ke nomor ini via WhatsApp"
          >
            <Send className="w-3.5 h-3.5" />
            Uji Coba Hubungi No Ini
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold text-emerald-100">
              Nomor WhatsApp Bendahara (Format: 08... atau 628...) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={settingsForm.contactWa}
                onChange={e => setSettingsForm({ ...settingsForm, contactWa: e.target.value })}
                placeholder="Contoh: 081256789001 atau 6281256789001"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-emerald-950/60 border border-emerald-600/60 text-white font-mono font-bold text-sm outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
            </div>
            {settingsForm.contactWa ? (
              <p className="text-[11px] text-emerald-300 font-semibold mt-1">
                ✓ Format WhatsApp Valid: <code className="bg-emerald-950/80 px-1.5 py-0.5 rounded text-amber-300 font-mono">{normalizePhoneNumber(settingsForm.contactWa)}</code> ({formatPhoneDisplay(settingsForm.contactWa)})
              </p>
            ) : (
              <p className="text-[11px] text-emerald-300/80 mt-1">
                💡 Nomor ini akan otomatis distandarkan dengan kode negara <code>62</code> saat tautan WhatsApp dibuka oleh anggota.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleSaveWaNumber()}
              className="w-full py-3 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              {waSavedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {waSavedSuccess ? 'Nomor WA Tersimpan!' : 'Simpan Nomor WhatsApp'}
            </button>
            <span className="text-[10px] text-center text-emerald-200/70">
              Tersimpan langsung & otomatis tersinkron ke Supabase.
            </span>
          </div>
        </div>
      </div>

      {/* 3. General Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-500" />
            Parameter Iuran, Kontak & Pejabat DPC
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tarif iuran bulanan, kontak resmi organisasi, dan nama pejabat yang tertera pada kuitansi dan laporan transparansi.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nominal Iuran Wajib Bulanan (Rp) *
            </label>
            <input
              type="number"
              required
              min={5000}
              step={5000}
              value={settingsForm.monthlyFee}
              onChange={e => setSettingsForm({ ...settingsForm, monthlyFee: Number(e.target.value) })}
              className="w-full p-3 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 outline-hidden focus:border-amber-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Default: Rp30.000 / bulan / anggota
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Rentang Periode Iuran *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={settingsForm.startYear}
                onChange={e => setSettingsForm({ ...settingsForm, startYear: Number(e.target.value) })}
                className="w-1/2 p-3 rounded-xl border border-slate-300 font-bold outline-hidden"
              />
              <span className="font-bold text-slate-500">s/d</span>
              <input
                type="number"
                value={settingsForm.endYear}
                onChange={e => setSettingsForm({ ...settingsForm, endYear: Number(e.target.value) })}
                className="w-1/2 p-3 rounded-xl border border-slate-300 font-bold outline-hidden"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Standar DPC Patelki Kayong Utara: 2025 – 2031
            </p>
          </div>
        </div>

        {/* Contact Info & Office Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs pt-4 border-t border-slate-100">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nomor WhatsApp Resmi Bendahara (Konfirmasi Pembayaran) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={settingsForm.contactWa}
                onChange={e => setSettingsForm({ ...settingsForm, contactWa: e.target.value })}
                placeholder="Contoh: 081256789001"
                className="w-full pl-9 p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 outline-hidden"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Anggota yang membayar akan otomatis dialihkan ke nomor WhatsApp ini.
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Email Resmi DPC PATELKI
            </label>
            <input
              type="email"
              value={settingsForm.contactEmail}
              onChange={e => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
              placeholder="Contoh: dpcpatelki.kayongutara@gmail.com"
              className="w-full p-2.5 rounded-xl border border-slate-300 outline-hidden"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Tertera di kop surat kuitansi dan dokumen resmi.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 mb-1">
              Alamat Sekretariat DPC PATELKI
            </label>
            <input
              type="text"
              value={settingsForm.address}
              onChange={e => setSettingsForm({ ...settingsForm, address: e.target.value })}
              placeholder="Contoh: Sekretariat DPC Patelki KKU, Jl. Bhayangkara No. 04, Sukadana"
              className="w-full p-2.5 rounded-xl border border-slate-300 outline-hidden"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Alamat lengkap yang tercetak di kop kuitansi iuran sah.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs pt-4 border-t border-slate-100">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nama Ketua DPC & NAP *
            </label>
            <div className="space-y-2">
              <input
                type="text"
                required
                value={settingsForm.ketuaName}
                onChange={e => setSettingsForm({ ...settingsForm, ketuaName: e.target.value })}
                placeholder="Nama Ketua Lengkap dengan Gelar"
                className="w-full p-2.5 rounded-xl border border-slate-300 outline-hidden"
              />
              <input
                type="text"
                value={settingsForm.ketuaNap}
                onChange={e => setSettingsForm({ ...settingsForm, ketuaNap: e.target.value })}
                placeholder="NAP Ketua"
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nama Bendahara DPC & NAP *
            </label>
            <div className="space-y-2">
              <input
                type="text"
                required
                value={settingsForm.bendaharaName}
                onChange={e => setSettingsForm({ ...settingsForm, bendaharaName: e.target.value })}
                placeholder="Nama Bendahara Lengkap"
                className="w-full p-2.5 rounded-xl border border-slate-300 outline-hidden"
              />
              <input
                type="text"
                value={settingsForm.bendaharaNap}
                onChange={e => setSettingsForm({ ...settingsForm, bendaharaNap: e.target.value })}
                placeholder="NAP Bendahara"
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* WhatsApp Templates */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="font-extrabold text-sm text-slate-900">
            Template Pesan Notifikasi WhatsApp Otomatis
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Template: Pembayaran Disetujui
            </label>
            <textarea
              rows={4}
              value={settingsForm.waTemplateApproved}
              onChange={e => setSettingsForm({ ...settingsForm, waTemplateApproved: e.target.value })}
              className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 bg-slate-50 outline-hidden"
            />
            <p className="text-[10px] text-slate-500 mt-0.5">
              Tag tersedia: [NAMA], [NAP], [PERIODE], [NOMINAL], [BENDAHARA]
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Template: Pengingat Tunggakan (Tagihan)
            </label>
            <textarea
              rows={5}
              value={settingsForm.waTemplateReminder}
              onChange={e => setSettingsForm({ ...settingsForm, waTemplateReminder: e.target.value })}
              className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 bg-slate-50 outline-hidden"
            />
            <p className="text-[10px] text-slate-500 mt-0.5">
              Tag tersedia: [NAMA], [NAP], [PERIODE], [NOMINAL], [TANGGAL]
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
          >
            {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {savedSuccess ? 'Pengaturan Tersimpan!' : 'Simpan Semua Pengaturan'}
          </button>
        </div>
      </form>

      {/* 4. Integrasi Database Supabase (PostgreSQL Cloud) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900">
                    Database Supabase (PostgreSQL Cloud)
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      isSupabaseActive
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isSupabaseActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    {isSupabaseActive ? 'Terhubung ke Supabase' : 'Offline / LocalStorage'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sinkronisasi data anggota, kas, dan iuran ke cloud database PostgreSQL Supabase secara realtime.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSqlModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-emerald-600" />
              Skrip SQL Schema
            </button>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Buka Supabase
            </a>
          </div>
        </div>

        {/* Action / Test Notifications */}
        {supabaseActionMsg && (
          <div
            className={`p-3 rounded-2xl text-xs font-medium flex items-center gap-2 ${
              supabaseActionMsg.success
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {supabaseActionMsg.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{supabaseActionMsg.message}</span>
          </div>
        )}

        {supabaseTestResult && (
          <div
            className={`p-3 rounded-2xl text-xs font-medium flex items-center gap-2 ${
              supabaseTestResult.success
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border border-amber-200 text-amber-800'
            }`}
          >
            {supabaseTestResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            )}
            <span>{supabaseTestResult.message}</span>
          </div>
        )}

        {/* Configuration Form */}
        <form onSubmit={handleSaveSupabaseConfig} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Supabase Project URL *
                </label>
                {supabaseUrl && (supabaseUrl.includes('/rest/v1') || supabaseUrl.includes('supabase.com/dashboard')) && (
                  <button
                    type="button"
                    onClick={() => setSupabaseUrl(normalizeSupabaseUrl(supabaseUrl))}
                    className="text-[10px] text-amber-700 font-bold hover:underline"
                  >
                    Perbaiki Format URL
                  </button>
                )}
              </div>
              <input
                type="text"
                required
                value={supabaseUrl}
                onChange={e => setSupabaseUrl(e.target.value)}
                onBlur={() => {
                  const cleaned = normalizeSupabaseUrl(supabaseUrl);
                  if (cleaned && cleaned !== supabaseUrl) {
                    setSupabaseUrl(cleaned);
                  }
                }}
                placeholder="https://xyzabcdefghijklmnop.supabase.co"
                className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden bg-slate-50/50"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Format: <code className="bg-slate-100 px-1 py-0.2 rounded font-mono font-bold text-slate-700">https://[project-id].supabase.co</code> (tanpa tambahan <code>/rest/v1</code> atau URL browser dashboard).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Supabase Anon (Public) API Key *
              </label>
              <div className="relative">
                <input
                  type={showSupabaseKey ? 'text' : 'password'}
                  required
                  value={supabaseKey}
                  onChange={e => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full text-xs font-mono p-2.5 pr-9 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={() => setShowSupabaseKey(!showSupabaseKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showSupabaseKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Ditemukan di: Dashboard Supabase &gt; Project Settings &gt; API &gt; Project API keys (anon / public)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="autoSyncCheck"
              checked={supabaseAutoSync}
              onChange={e => setSupabaseAutoSync(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300"
            />
            <label htmlFor="autoSyncCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
              Aktifkan Sinkronisasi Otomatis saat aplikasi dimulai
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isTestingSupabase || !supabaseUrl || !supabaseKey}
                onClick={handleTestSupabase}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                {isTestingSupabase ? 'Menguji Koneksi...' : 'Tes Koneksi'}
              </button>

              <button
                type="button"
                disabled={isSupabaseSyncing || !supabaseUrl || !supabaseKey}
                onClick={handleUploadAllToSupabase}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-900 text-xs font-bold rounded-xl border border-emerald-200 transition-all cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
                {isSupabaseSyncing ? 'Mengunggah...' : 'Unggah Semua Data Lokal ke Supabase'}
              </button>

              <button
                type="button"
                disabled={isSupabaseSyncing || !supabaseUrl || !supabaseKey}
                onClick={handleDownloadAllFromSupabase}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-900 text-xs font-bold rounded-xl border border-blue-200 transition-all cursor-pointer"
              >
                <DownloadCloud className="w-3.5 h-3.5 text-blue-600" />
                {isSupabaseSyncing ? 'Menarik...' : 'Tarik Data dari Supabase'}
              </button>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Simpan Konfigurasi Supabase
            </button>
          </div>
        </form>

        {/* Petunjuk Penggunaan Cepat */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
          <p className="font-bold text-slate-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Langkah Cepat Menghubungkan Supabase:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 leading-relaxed">
            <li>Buka <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">supabase.com</a> dan buat project baru (gratis).</li>
            <li>Klik tombol <strong>Skrip SQL Schema</strong> di pojok kanan atas kartu ini, lalu salin kodenya.</li>
            <li>Di dashboard Supabase, buka menu <strong>SQL Editor</strong> &gt; buat query baru &gt; tempel (paste) skrip tersebut dan klik <strong>Run</strong>.</li>
            <li>Buka menu <strong>Project Settings</strong> &gt; <strong>API</strong>, lalu salin <strong>Project URL</strong> dan <strong>anon key</strong> ke formulir di atas.</li>
            <li>Klik <strong>Simpan Konfigurasi Supabase</strong> dan klik <strong>Unggah Semua Data Lokal ke Supabase</strong>.</li>
          </ol>
        </div>
      </div>

      {/* 5. Zona Pembersihan Data Demo & Reset Database */}
      <div className="bg-white rounded-3xl border border-red-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                Pembersihan Data Demo & Reset Bersih
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 max-w-xl leading-relaxed">
                Hapus seluruh data dummy/demo (anggota percobaan, riwayat kuitansi demo, kas demo) secara permanen dari penyimpanan browser lokal dan tabel cloud Supabase. Data yang telah dihapus tidak akan pernah muncul kembali.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowResetConfirmModal(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-md shadow-red-600/20 transition-all cursor-pointer shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            Hapus Semua Data Demo Permanen
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-red-200 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                Hapus Permanen Data Demo?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tindakan ini akan mengosongkan seluruh anggota demo, kuitansi demo, dan mutasi kas demo dari browser Anda serta membersihkan tabel cloud Supabase.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed font-medium">
              ⚠️ Pengaturan organisasi resmi DPC Patelki Kayong Utara dan rekening bank utama tetap aman dipertahankan.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setShowResetConfirmModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleConfirmReset}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isResetting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                {isResetting ? 'Menghapus...' : 'Ya, Hapus Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Skrip SQL Schema Supabase */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-600" />
                  Skrip SQL Schema Database Supabase
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Jalankan skrip ini sekali di Supabase SQL Editor untuk membuat semua tabel & hak akses.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="my-4 flex-1 overflow-auto bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-[11px] leading-relaxed select-all">
              <pre>{SUPABASE_SCHEMA_SQL}</pre>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                Mencakup tabel: members, dues_records, payment_submissions, cash_transactions, dll.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSqlModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedSql ? 'Tersalin ke Clipboard!' : 'Salin Skrip SQL'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Bank Modal */}
      {(showBankModal || editingBank) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="font-extrabold text-base text-slate-900">
              {editingBank ? 'Edit Rekening Bank' : 'Tambah Rekening Pembayaran'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Masukkan detail bank untuk pembayaran iuran anggota.
            </p>

            <form onSubmit={handleSaveBank} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Bank / Metode *</label>
                <input
                  type="text"
                  required
                  value={bankFormData.bankName}
                  onChange={e => setBankFormData({ ...bankFormData, bankName: e.target.value })}
                  placeholder="Contoh: Bank Kalbar / BRI / Mandiri / QRIS"
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Rekening / ID *</label>
                <input
                  type="text"
                  required
                  value={bankFormData.accountNumber}
                  onChange={e => setBankFormData({ ...bankFormData, accountNumber: e.target.value })}
                  placeholder="5021-0899-2311"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Atas Nama Rekening *</label>
                <input
                  type="text"
                  required
                  value={bankFormData.accountHolder}
                  onChange={e => setBankFormData({ ...bankFormData, accountHolder: e.target.value })}
                  placeholder="DPC PATELKI KAYONG UTARA"
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-hidden uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan / Petunjuk Transfer</label>
                <input
                  type="text"
                  value={bankFormData.notes}
                  onChange={e => setBankFormData({ ...bankFormData, notes: e.target.value })}
                  placeholder="Contoh: Bebas biaya antar sesama Bank Kalbar"
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-hidden"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={bankFormData.isPrimary}
                    onChange={e => setBankFormData({ ...bankFormData, isPrimary: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  Jadikan Rekening Utama
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={bankFormData.isActive}
                    onChange={e => setBankFormData({ ...bankFormData, isActive: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  Status Aktif
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowBankModal(false);
                    setEditingBank(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs"
                >
                  Simpan Rekening
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pengaturan;
