import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { LoginHeader } from '../../components/auth/LoginHeader';
import { RoleSwitcher } from '../../components/auth/RoleSwitcher';
import { LoginForm } from '../../components/auth/LoginForm';
import { LoginFooter } from '../../components/auth/LoginFooter';
import { MessageCircle, X } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, settings, generateWhatsAppLink } = useApp();

  const [activeRole, setActiveRole] = useState<UserRole>('bendahara');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Switch role and clear inputs & errors
  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    setErrorMessage(null);
    setIdentifier('');
    setPassword('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setErrorMessage(
        activeRole === 'bendahara'
          ? 'Silakan masukkan username atau NAP Bendahara!'
          : 'Silakan masukkan Nomor Anggota (NAP), Nama, atau No. WhatsApp Anda!'
      );
      return;
    }

    setLoading(true);
    try {
      const res = await login(activeRole, cleanIdentifier, password);
      if (!res.success) {
        setErrorMessage(
          res.error || 'Login gagal. Periksa kembali informasi akun dan kata sandi Anda.'
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat proses login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-gradient-to-br from-[#005B46] via-[#004D3C] to-[#003B2E] text-slate-900 relative overflow-x-hidden font-sans select-text">
      {/* ============================================================== */}
      {/* DECORATIVE BACKGROUND SVGS & SWOOSHES (Top-Left & Bottom-Right)  */}
      {/* ============================================================== */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle Ambient Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#00664F]/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-3xl" />

        {/* Top-Left Big Diagonal Swoosh: Orange & Emerald (matching mockups) */}
        <svg
          className="absolute -top-12 -left-16 w-[420px] sm:w-[580px] h-[320px] sm:h-[440px] opacity-95 pointer-events-none"
          viewBox="0 0 600 450"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Emerald Arc */}
          <path
            d="M-80 -40 C 220 50, 420 220, 360 480 L -80 480 Z"
            fill="url(#swoosh-emerald-tl)"
          />
          {/* Orange Arc Ribbon */}
          <path
            d="M-40 -40 C 240 20, 380 180, 240 450 L 170 450 C 310 190, 160 30, -40 -40 Z"
            fill="url(#swoosh-orange-tl)"
          />
          <defs>
            <linearGradient id="swoosh-emerald-tl" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#00664F" />
              <stop offset="100%" stopColor="#004D3C" />
            </linearGradient>
            <linearGradient id="swoosh-orange-tl" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFB326" />
              <stop offset="100%" stopColor="#FF9F00" />
            </linearGradient>
          </defs>
        </svg>

        {/* Bottom-Right Big Diagonal Swoosh: Orange & Emerald Arc */}
        <svg
          className="absolute -bottom-16 -right-16 w-[440px] sm:w-[680px] h-[340px] sm:h-[480px] opacity-95 pointer-events-none"
          viewBox="0 0 700 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Emerald Flow */}
          <path
            d="M780 540 C 450 480, 280 320, 340 60 L 780 60 Z"
            fill="url(#swoosh-emerald-br)"
          />
          {/* Vibrant Orange Accent Band */}
          <path
            d="M740 540 C 400 460, 260 280, 410 40 L 480 40 C 320 280, 470 440, 740 540 Z"
            fill="url(#swoosh-orange-br)"
          />
          <defs>
            <linearGradient id="swoosh-emerald-br" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#004D3C" />
              <stop offset="100%" stopColor="#00664F" />
            </linearGradient>
            <linearGradient id="swoosh-orange-br" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#FF9F00" />
              <stop offset="100%" stopColor="#ED8C00" />
            </linearGradient>
          </defs>
        </svg>

        {/* Top-Right Decorative Calligraphy: "Bersama Membangun Profesi" */}
        <div className="hidden lg:flex flex-col items-end absolute top-8 right-12 select-none text-right z-10 pointer-events-none">
          <span className="text-xl xl:text-2xl font-black italic tracking-wide text-white drop-shadow-md leading-tight font-serif">
            Bersama
          </span>
          <span className="text-xl xl:text-2xl font-black italic tracking-wide text-white drop-shadow-md leading-tight font-serif">
            Membangun
          </span>
          <div className="relative inline-block mt-0.5">
            <span className="text-2xl xl:text-3xl font-black italic tracking-wide text-[#FF9F00] drop-shadow-lg font-serif">
              Profesi
            </span>
            {/* Curved orange brush underline */}
            <svg
              className="w-28 h-4 -mt-1 text-[#FF9F00]"
              viewBox="0 0 100 15"
              fill="currentColor"
            >
              <path d="M2 10 Q 50 1 98 12 Q 50 6 2 10 Z" />
            </svg>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MAIN TWO-COLUMN CONTAINER (Centered & Balanced Layout)          */}
      {/* ============================================================== */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* ------------------------------------------------------------ */}
          {/* LEFT COLUMN: BRANDING & HIGHLIGHTS (5 or 6 cols on desktop)  */}
          {/* ------------------------------------------------------------ */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center animate-in fade-in duration-500">
            <LoginHeader />
          </div>

          {/* ------------------------------------------------------------ */}
          {/* RIGHT COLUMN: LOGIN CARD (6 cols on desktop)                 */}
          {/* ------------------------------------------------------------ */}
          <div className="lg:col-span-6 xl:col-span-6 flex items-center justify-center lg:justify-end animate-in fade-in slide-in-from-bottom-5 duration-600">
            <div className="w-full max-w-[620px] xl:max-w-[650px] bg-white rounded-[24px] shadow-2xl shadow-emerald-950/20 border border-white/60 p-6 sm:p-9 lg:p-10 relative overflow-hidden transition-all duration-300">
              {/* Role Switcher Tabs */}
              <div className="mb-7">
                <RoleSwitcher
                  activeRole={activeRole}
                  onRoleChange={handleRoleChange}
                  disabled={loading}
                />
              </div>

              {/* Login Form Body */}
              <LoginForm
                activeRole={activeRole}
                identifier={identifier}
                onIdentifierChange={setIdentifier}
                password={password}
                onPasswordChange={setPassword}
                showPassword={showPassword}
                onToggleShowPassword={() => setShowPassword(!showPassword)}
                rememberSession={rememberSession}
                onRememberSessionChange={setRememberSession}
                loading={loading}
                errorMessage={errorMessage}
                onSubmit={handleLoginSubmit}
                onHelpClick={() => setShowHelpModal(true)}
              />

              {/* Subtle Decorative Wave at the Bottom Edge of Card */}
              <div className="absolute -bottom-1 left-0 right-0 h-4 pointer-events-none opacity-40 overflow-hidden">
                <svg
                  className="w-full h-full text-emerald-100"
                  viewBox="0 0 500 20"
                  preserveAspectRatio="none"
                  fill="currentColor"
                >
                  <path d="M0,0 C150,18 350,2 500,14 L500,20 L0,20 Z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ============================================================== */}
      {/* BOTTOM FULL-WIDTH FOOTER                                       */}
      {/* ============================================================== */}
      <LoginFooter />

      {/* ============================================================== */}
      {/* HELP MODAL DIALOG                                              */}
      {/* ============================================================== */}
      {showHelpModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3
                id="help-modal-title"
                className="font-extrabold text-base sm:text-lg text-slate-900"
              >
                Bantuan Akses Akun
              </h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <h4 className="font-bold text-amber-900 mb-1">
                  1. Login Bendahara DPC:
                </h4>
                <p className="text-amber-800 text-xs">
                  Gunakan username bendahara (standar:{' '}
                  <code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono font-bold text-amber-950">
                    {settings.treasurerUsername || 'bendahara'}
                  </code>
                  ) dan kata sandi yang telah diatur oleh bendahara.
                </p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <h4 className="font-bold text-emerald-900 mb-1">
                  2. Login Rekan Anggota:
                </h4>
                <p className="text-emerald-800 text-xs">
                  Gunakan <strong>Nomor Anggota PATELKI (NAP)</strong> (contoh:{' '}
                  <code className="bg-emerald-100/80 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-950">
                    611101
                  </code>{' '}
                  atau format titik). Kata sandi default adalah{' '}
                  <code className="bg-emerald-100/80 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-950">
                    123456
                  </code>{' '}
                  atau kata sandi baru yang telah Anda perbarui.
                </p>
              </div>

              <p className="text-xs text-slate-500 pt-1">
                Lupa kata sandi atau data tidak terbaca? Silakan hubungi langsung
                Bendahara DPC PATELKI Kayong Utara melalui WhatsApp.
              </p>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <a
                href={generateWhatsAppLink(
                  settings.contactWa || '6281256789001',
                  'Halo Bendahara DPC Patelki KKU, saya butuh bantuan untuk login akun aplikasi SI-IURAN.'
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00664F] hover:bg-[#004D3C] text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat WhatsApp Bendahara</span>
              </a>

              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
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
