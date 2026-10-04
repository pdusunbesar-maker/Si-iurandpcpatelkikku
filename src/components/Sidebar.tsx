import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ConfirmModal } from './ConfirmModal';
import {
  LayoutDashboard,
  Users,
  Grid3X3,
  CalendarDays,
  Clock,
  BarChart3,
  AlertCircle,
  BookOpen,
  ArrowDownLeft,
  ArrowUpRight,
  HeartHandshake,
  Heart,
  FileText,
  MessageSquare,
  Settings,
  CreditCard,
  User,
  History,
  Send,
  Building2,
  Sliders,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { currentUserRole, paymentSubmissions, getYearlyArrearsList, logout, currentMember } = useApp();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const pendingCount = paymentSubmissions.filter(s => s.status === 'pending').length;
  const arrearsCount = getYearlyArrearsList().length;

  const handleNav = (page: string) => {
    onNavigate(page);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:sticky top-16 sm:top-20 z-40 h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] w-64 sm:w-72 bg-white border-r border-slate-200 overflow-y-auto custom-scrollbar flex flex-col justify-between transition-transform duration-300 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-6">
          {/* Bendahara Navigation */}
          {currentUserRole === 'bendahara' ? (
            <div className="space-y-5">
              {/* Dashboard */}
              <div>
                <button
                  type="button"
                  onClick={() => handleNav('dashboard')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    currentPage === 'dashboard'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard Keuangan
                </button>
              </div>

              {/* Data Anggota */}
              <div>
                <p className="px-3 text-[11px] font-extrabold text-slate-600 tracking-wider uppercase">
                  Data Anggota
                </p>
                <div className="mt-1.5 space-y-1">
                  <button
                    type="button"
                    onClick={() => handleNav('anggota-list')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      currentPage === 'anggota-list'
                        ? 'bg-emerald-50 text-emerald-950 font-bold border-l-4 border-emerald-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Users className="w-4 h-4 text-emerald-600" />
                    Daftar & Kelola Anggota
                  </button>
                </div>
              </div>

              {/* Menu Iuran */}
              <div>
                <p className="px-3 text-[11px] font-extrabold text-slate-600 tracking-wider uppercase">
                  Iuran & Verifikasi
                </p>
                <div className="mt-1.5 space-y-1">
                  <button
                    type="button"
                    onClick={() => handleNav('matrix-12')}
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      currentPage === 'matrix-12'
                        ? 'bg-amber-50 text-amber-950 font-bold border-l-4 border-amber-500'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Grid3X3 className="w-4 h-4 text-amber-500" />
                      Matrix Iuran 12 Bulan
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNav('matrix-tahunan')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      currentPage === 'matrix-tahunan'
                        ? 'bg-amber-50 text-amber-950 font-bold border-l-4 border-amber-500'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CalendarDays className="w-4 h-4 text-amber-600" />
                    Rekap Matrix 2025–2031
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNav('verifikasi')}
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      currentPage === 'verifikasi'
                        ? 'bg-amber-50 text-amber-950 font-bold border-l-4 border-amber-500'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-amber-500" />
                      Menunggu Verifikasi
                    </div>
                    {pendingCount > 0 && (
                      <span className="px-2 py-0.5 text-[11px] font-extrabold rounded-full bg-red-500 text-white animate-pulse">
                        {pendingCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNav('tunggakan')}
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      currentPage === 'tunggakan'
                        ? 'bg-amber-50 text-amber-950 font-bold border-l-4 border-amber-500'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      Daftar Tunggakan
                    </div>
                    {arrearsCount > 0 && (
                      <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-red-100 text-red-700">
                        {arrearsCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNav('rekap-iuran')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      currentPage === 'rekap-iuran'
                        ? 'bg-amber-50 text-amber-950 font-bold border-l-4 border-amber-500'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    Rekapitulasi Iuran
                  </button>
                </div>
              </div>

              {/* Keuangan */}
              <div>
                <p className="px-3 text-[11px] font-extrabold text-slate-600 tracking-wider uppercase">
                  Keuangan Kas
                </p>
                <div className="mt-1.5 space-y-1">
                  <button
                    type="button"
                    onClick={() => handleNav('buku-kas')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      currentPage === 'buku-kas'
                        ? 'bg-emerald-50 text-emerald-950 font-bold border-l-4 border-emerald-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    Buku Kas Utama
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNav('kas-masuk')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      currentPage === 'kas-masuk'
                        ? 'bg-emerald-50 text-emerald-950 font-bold border-l-4 border-emerald-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                    Pemasukan Kas
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNav('kas-keluar')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      currentPage === 'kas-keluar'
                        ? 'bg-emerald-50 text-emerald-950 font-bold border-l-4 border-emerald-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-red-500" />
                    Pengeluaran Kas
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNav('donasi')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      currentPage === 'donasi'
                        ? 'bg-emerald-50 text-emerald-950 font-bold border-l-4 border-emerald-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Heart className="w-4 h-4 text-pink-500" />
                    Donasi & Sumbangan
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNav('bakti-sosial')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      currentPage === 'bakti-sosial'
                        ? 'bg-emerald-50 text-emerald-950 font-bold border-l-4 border-emerald-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <HeartHandshake className="w-4 h-4 text-indigo-500" />
                    Bakti Sosial DPC
                  </button>
                </div>
              </div>

              {/* Laporan & Komunikasi */}
              <div>
                <p className="px-3 text-[11px] font-extrabold text-slate-600 tracking-wider uppercase">
                  Laporan & WhatsApp
                </p>
                <div className="mt-1.5 space-y-1">
                  <button
                    type="button"
                    onClick={() => handleNav('laporan')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      currentPage === 'laporan'
                        ? 'bg-amber-50 text-amber-950 font-bold border-l-4 border-amber-500'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-amber-600" />
                    Laporan Transparansi
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNav('whatsapp-broadcast')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      currentPage === 'whatsapp-broadcast'
                        ? 'bg-emerald-50 text-emerald-950 font-bold border-l-4 border-emerald-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    Tagihan & Notif WhatsApp
                  </button>
                </div>
              </div>

              {/* Pengaturan */}
              <div>
                <p className="px-3 text-[11px] font-extrabold text-slate-600 tracking-wider uppercase">
                  Konfigurasi
                </p>
                <div className="mt-1.5 space-y-1">
                  <button
                    type="button"
                    onClick={() => handleNav('pengaturan')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      currentPage === 'pengaturan'
                        ? 'bg-slate-100 text-slate-900 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    Rekening & Pengaturan
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Anggota Navigation */
            <div className="space-y-5">
              <div>
                <button
                  type="button"
                  onClick={() => handleNav('dashboard-anggota')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    currentPage === 'dashboard-anggota'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard Saya
                </button>
              </div>

              <div>
                <p className="px-3 text-[11px] font-extrabold text-slate-600 tracking-wider uppercase">
                  Iuran Saya
                </p>
                <div className="mt-1.5 space-y-1">
                  <button
                    type="button"
                    onClick={() => handleNav('bayar-iuran')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      currentPage === 'bayar-iuran'
                        ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                        : 'text-amber-950 bg-amber-50 hover:bg-amber-100 font-bold'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    Bayar Iuran Online
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNav('matrix-saya')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      currentPage === 'matrix-saya'
                        ? 'bg-emerald-50 text-emerald-950 font-bold border-l-4 border-emerald-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4 text-emerald-600" />
                    Matrix 12 Bulan Saya
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNav('riwayat-saya')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      currentPage === 'riwayat-saya'
                        ? 'bg-emerald-50 text-emerald-950 font-bold border-l-4 border-emerald-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <History className="w-4 h-4 text-emerald-600" />
                    Riwayat & Kuitansi
                  </button>
                </div>
              </div>

              <div>
                <p className="px-3 text-[11px] font-extrabold text-slate-600 tracking-wider uppercase">
                  Transparansi Kas DPC
                </p>
                <div className="mt-1.5 space-y-1">
                  <button
                    type="button"
                    onClick={() => handleNav('rekap-kas-anggota')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      currentPage === 'rekap-kas-anggota'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'text-emerald-900 bg-emerald-50/70 hover:bg-emerald-100/80 font-bold'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-emerald-700" />
                    Rekap Keuangan Kas
                  </button>
                </div>
              </div>

              <div>
                <p className="px-3 text-[11px] font-extrabold text-slate-600 tracking-wider uppercase">
                  Informasi & Akun
                </p>
                <div className="mt-1.5 space-y-1">
                  <button
                    type="button"
                    onClick={() => handleNav('profil-saya')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      currentPage === 'profil-saya'
                        ? 'bg-emerald-50 text-emerald-950 font-bold border-l-4 border-emerald-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <User className="w-4 h-4 text-slate-600" />
                    Profil Saya
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNav('info-rekening')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      currentPage === 'info-rekening'
                        ? 'bg-emerald-50 text-emerald-950 font-bold border-l-4 border-emerald-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-amber-600" />
                    Rekening & QRIS DPC
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Brand info & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors cursor-pointer border border-red-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar / Logout
          </button>

          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              DPC PATELKI KKU
            </div>
            <p className="text-[10px] text-slate-600 mt-0.5">
              Periode 2025 – 2031
            </p>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Konfirmasi Keluar Akun"
        message={`Apakah Anda yakin ingin keluar dari sistem (${currentMember?.nama || 'Akun ini'})? Anda akan kembali ke halaman login.`}
        confirmText="Ya, Keluar"
        cancelText="Batal"
        variant="danger"
        icon="logout"
        onConfirm={() => {
          logout();
          setShowLogoutConfirm(false);
          if (onCloseMobile) onCloseMobile();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
};

export default Sidebar;
