import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PatelkiLogo } from '../../components/PatelkiLogo';
import { UserRole } from '../../types';
import {
  Shield,
  UserCheck,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Building,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, settings, generateWhatsAppLink } = useApp();

  const [activeRole, setActiveRole] = useState<UserRole>('bendahara');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Switch tab resets inputs
  const handleRoleTabChange = (role: UserRole) => {
    setActiveRole(role);
    setErrorMessage(null);
    setIdentifier('');
    setPassword('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage(
        activeRole === 'bendahara'
          ? 'Masukkan username atau NAP Bendahara!'
          : 'Masukkan Nomor Anggota (NAP) Anda!'
      );
      return;
    }

    const res = login(activeRole, identifier, password);
    if (!res.success) {
      setErrorMessage(res.error || 'Login gagal. Periksa kembali username dan kata sandi Anda.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Dynamic Background Glows with #FFAA00 and Patelki Green */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-[600px] bg-linear-to-b from-emerald-900/10 via-transparent to-amber-500/5 pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md sm:max-w-lg bg-white rounded-3xl sm:rounded-4xl shadow-2xl border border-slate-200/80 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Org Branding Header */}
        <div className="bg-linear-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white p-6 sm:p-8 text-center relative border-b border-emerald-700/40">
          <div className="inline-flex p-3 bg-white rounded-2xl shadow-lg shadow-black/30 mb-3 transform hover:scale-105 transition-transform">
            <PatelkiLogo size={56} />
          </div>
          <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
            SI-IURAN <span className="text-amber-400">PATELKI</span>
          </h1>
          <p className="text-xs font-bold tracking-widest text-emerald-200 uppercase mt-0.5">
            DPC Kabupaten Kayong Utara
          </p>
          <p className="text-[11px] text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
            Sistem Informasi Iuran, Verifikasi & Keuangan Organisasi Profesi ATLM
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-200/80 rounded-2xl">
            <button
              type="button"
              onClick={() => handleRoleTabChange('bendahara')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeRole === 'bendahara'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              Login Bendahara
            </button>

            <button
              type="button"
              onClick={() => handleRoleTabChange('anggota')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeRole === 'anggota'
                  ? 'bg-emerald-600 text-white shadow-md font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Login Anggota
            </button>
          </div>
        </div>

        {/* Login Form Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Gagal Masuk</p>
                <p className="text-[11px] text-red-600 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Identifier Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {activeRole === 'bendahara'
                  ? 'Username / NAP Bendahara *'
                  : 'Username Anggota (Nomor Anggota / NAP) *'}
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {activeRole === 'bendahara' ? (
                    <Shield className="w-4 h-4 text-amber-500" />
                  ) : (
                    <User className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder={
                    activeRole === 'bendahara'
                      ? 'Username bendahara (default: bendahara)'
                      : 'Masukkan NAP (contoh: 61.11.002)'
                  }
                  className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden bg-slate-50 font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Kata Sandi / PIN *
                </label>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  className="text-[11px] text-amber-600 hover:text-amber-700 font-bold"
                >
                  Bantuan Login?
                </button>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full pl-10 pr-10 py-3 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden bg-slate-50 font-medium text-slate-900"
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

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500"
                />
                <span className="text-xs text-slate-600 font-medium">Ingat Sesi Saya</span>
              </label>

              <span className="text-[11px] text-slate-400">
                {activeRole === 'bendahara' ? 'Akses Penuh' : 'Khusus Anggota'}
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5 active:scale-98 ${
                activeRole === 'bendahara'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
              }`}
            >
              <span>{activeRole === 'bendahara' ? 'Masuk sebagai Bendahara' : 'Masuk ke Portal Anggota'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-100/70 p-4 text-center border-t border-slate-200/60">
          <p className="text-[11px] text-slate-500">
            DPC Patelki Kabupaten Kayong Utara • Sekretariat Sukadana
          </p>
        </div>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="font-black text-base text-slate-900">Bantuan Masuk Akun</h3>
            <div className="mt-3 space-y-2 text-xs text-slate-600">
              <p>
                <strong>Untuk Bendahara:</strong> Gunakan username yang telah diatur (default: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">{settings.treasurerUsername || 'bendahara'}</code>) dan kata sandi Anda. Anda dapat mengubah username dan kata sandi di menu <em>Pengaturan</em>.
              </p>
              <p>
                <strong>Untuk Anggota:</strong> Username Anda adalah <strong>Nomor Anggota (NAP)</strong> (contoh: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">61.11.002</code>). Kata sandi default awal adalah <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">123456</code>. Anda dapat mengubah kata sandi kapan saja di menu <em>Profil Saya</em>.
              </p>
              <p className="pt-2 text-slate-500 text-[11px]">
                Jika lupa kata sandi atau butuh bantuan, hubungi Bendahara DPC Patelki Kayong Utara untuk mereset kata sandi Anda.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <a
                href={generateWhatsAppLink(settings.contactWa, 'Halo Bendahara DPC Patelki KKU, saya butuh bantuan login aplikasi.')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                Chat WhatsApp Bendahara →
              </a>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
