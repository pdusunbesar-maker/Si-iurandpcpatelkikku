import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  Phone,
  Building,
  Mail,
  MapPin,
  Calendar,
  Save,
  Check,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  AlertCircle,
  Camera,
} from 'lucide-react';
import { PhotoUploader } from '../../components/PhotoUploader';

export const ProfilAnggota: React.FC = () => {
  const { currentMember, updateMember, changeMemberPassword, formatPhoneDisplay, normalizePhoneNumber } = useApp();

  if (!currentMember) return null;

  const [formData, setFormData] = useState({
    nama: currentMember.nama,
    gelar: currentMember.gelar,
    noWa: currentMember.noWa,
    instansi: currentMember.instansi,
    jabatan: currentMember.jabatan || '',
    email: currentMember.email || '',
    alamat: currentMember.alamat || '',
    foto: currentMember.foto || '',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNoWa = normalizePhoneNumber(formData.noWa);
    updateMember(currentMember.id, { ...formData, noWa: cleanNoWa });
    setFormData(prev => ({ ...prev, noWa: cleanNoWa }));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!newPassword.trim()) {
      setPasswordError('Kata sandi baru tidak boleh kosong!');
      return;
    }
    if (newPassword.length < 4) {
      setPasswordError('Kata sandi minimal 4 karakter!');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi tidak cocok!');
      return;
    }

    changeMemberPassword(currentMember.id, newPassword.trim());
    setPasswordSuccess(true);
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Profil & Keamanan Akun
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            Portal Anggota Patelki
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Perbarui data profil, informasi instansi, serta username (NAP) dan kata sandi login Anda.
        </p>
      </div>

      {/* 1. Account Login Security Info & Password Change Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">
              Kredensial & Kata Sandi Login Anggota
            </h2>
            <p className="text-xs text-slate-500">
              Informasi username login (NAP) dan pengaturan kata sandi pribadi Anda.
            </p>
          </div>
        </div>

        {/* Username Info Box */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Username Resmi Anda:
            </span>
            <p className="text-lg font-black font-mono text-emerald-950 mt-0.5">
              {currentMember.nap}
            </p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Gunakan Nomor Anggota (NAP) di atas saat masuk pada halaman login.
            </p>
          </div>
          <div className="bg-white px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-bold text-slate-700 self-start sm:self-auto">
            Status Akun: <span className="text-emerald-700">Aktif</span>
          </div>
        </div>

        {/* Password Change Form */}
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Ubah Kata Sandi Baru
          </h3>

          {passwordError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Kata sandi berhasil diperbarui! Gunakan kata sandi baru untuk login berikutnya.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Kata Sandi Baru *
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimal 4 karakter..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 outline-hidden font-medium focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Ulangi Kata Sandi Baru *
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 outline-hidden font-medium focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500">
              Kata sandi awal standar anggota adalah: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">123456</code>
            </span>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Simpan Kata Sandi Baru
            </button>
          </div>
        </form>
      </div>

      {/* 2. Biodata & Profil Form */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-100 text-center sm:text-left">
          <img
            src={
              formData.foto ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                formData.nama
              )}`
            }
            alt={formData.nama}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-md shrink-0"
          />
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              {currentMember.nama}, {currentMember.gelar}
            </h2>
            <p className="text-xs text-emerald-800 font-mono font-bold mt-0.5">
              Nomor Anggota (NAP): {currentMember.nap}
            </p>
            <p className="text-xs text-slate-500 mt-1 flex items-center justify-center sm:justify-start gap-1">
              <Building className="w-3.5 h-3.5 text-slate-400" /> {currentMember.instansi}
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                required
                value={formData.nama}
                onChange={e => setFormData({ ...formData, nama: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 outline-hidden focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Gelar Profesi</label>
              <input
                type="text"
                value={formData.gelar}
                onChange={e => setFormData({ ...formData, gelar: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                No. WhatsApp Aktif (Format: 08... atau 628...) *
              </label>
              <input
                type="text"
                required
                value={formData.noWa}
                onChange={e => setFormData({ ...formData, noWa: e.target.value })}
                placeholder="Contoh: 081234567890"
                className="w-full p-2.5 rounded-xl border border-slate-300 outline-hidden font-mono"
              />
              {formData.noWa && (
                <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                  ✓ Format WhatsApp: <code>{normalizePhoneNumber(formData.noWa)}</code> ({formatPhoneDisplay(formData.noWa)})
                </p>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Instansi / Unit Kerja *</label>
              <input
                type="text"
                required
                value={formData.instansi}
                onChange={e => setFormData({ ...formData, instansi: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Jabatan di Laboratorium</label>
              <input
                type="text"
                value={formData.jabatan}
                onChange={e => setFormData({ ...formData, jabatan: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Alamat Domisili</label>
            <input
              type="text"
              value={formData.alamat}
              onChange={e => setFormData({ ...formData, alamat: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 outline-hidden"
            />
          </div>

          {/* Unggah Foto Profil Langsung */}
          <div className="p-4 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-200">
            <PhotoUploader
              currentPhoto={formData.foto}
              name={formData.nama}
              onChange={(newPhoto) => setFormData({ ...formData, foto: newPhoto })}
              label="Unggah Foto Profil (Kamera / Galeri HP / Komputer)"
              helperText="Pilih foto formal atau pas foto resmi ATLM. Gambar langsung dikompresi otomatis & disimpan ke database."
              size="lg"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Perubahan biodata akan disimpan langsung ke sistem database DPC.
            </span>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {savedSuccess ? 'Tersimpan!' : 'Simpan Biodata'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilAnggota;
