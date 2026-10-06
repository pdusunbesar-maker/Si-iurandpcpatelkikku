import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PatelkiLogo } from './PatelkiLogo';
import { ConfirmModal } from './ConfirmModal';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  ChevronDown,
  Shield,
  LogOut,
  User,
  Settings,
  Receipt,
  Wallet,
  Users,
  Menu,
} from 'lucide-react';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage, onToggleMobileMenu }) => {
  const {
    currentUserRole,
    currentMember,
    settings,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    paymentSubmissions,
    logout,
  } = useApp();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Synchronized display name & NAP for Bendahara or Anggota
  const displayName = currentUserRole === 'bendahara'
    ? (settings.bendaharaName || currentMember?.nama || 'Bendahara DPC')
    : (currentMember?.nama || 'Anggota');

  const displayNap = currentUserRole === 'bendahara'
    ? (settings.bendaharaNap || currentMember?.nap || '-')
    : (currentMember?.nap || '-');

  // Filter notifications for current user / role
  const userNotifs = notifications.filter(n => {
    if (currentUserRole === 'bendahara') {
      return n.recipientId === 'bendahara' || n.recipientId === 'all';
    }
    return n.recipientId === currentMember?.id || n.recipientId === 'all';
  });

  const unreadCount = userNotifs.filter(n => !n.isRead).length;
  const pendingVerifCount = paymentSubmissions.filter(s => s.status === 'pending').length;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs w-full">
        <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-10">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              {onToggleMobileMenu && (
                <button
                  type="button"
                  onClick={onToggleMobileMenu}
                  className="lg:hidden p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200"
                  aria-label="Buka Menu Sidebar"
                >
                  <Menu className="w-5 h-5 text-emerald-800" />
                </button>
              )}

              <div
                className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer group"
                onClick={() => onNavigate(currentUserRole === 'bendahara' ? 'dashboard' : 'dashboard-anggota')}
              >
                <PatelkiLogo className="w-9 h-9 sm:w-11 sm:h-11 transition-transform duration-300 group-hover:scale-105 shrink-0" />
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="font-extrabold text-sm sm:text-lg tracking-tight text-emerald-900 leading-none">
                      SI-IURAN <span className="text-amber-500">PATELKI</span>
                    </span>
                    <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                      DPC Kayong Utara
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-600 font-medium tracking-wide hidden md:block">
                    Sistem Informasi Iuran & Keuangan Organisasi Profesi ATLM
                  </p>
                </div>
              </div>
            </div>

            {/* Right Action Bar */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* In-App Notifications Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifMenu(!showNotifMenu);
                    setShowUserMenu(false);
                  }}
                  className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors focus:outline-hidden cursor-pointer"
                  title="Notifikasi"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifMenu && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">Notifikasi</span>
                        {unreadCount > 0 && (
                          <span className="bg-amber-100 text-amber-800 font-bold text-xs px-2 py-0.5 rounded-full">
                            {unreadCount} Baru
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
                        >
                          Tandai Semua Dibaca
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
                      {userNotifs.length === 0 ? (
                        <div className="py-8 text-center text-slate-600 text-xs">
                          Belum ada notifikasi
                        </div>
                      ) : (
                        userNotifs.map(n => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markNotificationAsRead(n.id);
                              if (n.link) {
                                onNavigate(n.link);
                                setShowNotifMenu(false);
                              }
                            }}
                            className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${
                              !n.isRead ? 'bg-amber-50/40' : ''
                            }`}
                          >
                            <div className="shrink-0 mt-0.5">
                              {n.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                              {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                              {n.type === 'danger' && <XCircle className="w-4 h-4 text-red-500" />}
                              {n.type === 'info' && <Info className="w-4 h-4 text-blue-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 leading-snug">{n.title}</p>
                              <p className="text-[11px] text-slate-700 mt-0.5 line-clamp-2 leading-relaxed">
                                {n.message}
                              </p>
                              <p className="text-[10px] text-slate-600 mt-1 font-medium">{n.date}</p>
                            </div>
                            {!n.isRead && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Current User Profile Pill & Dropdown Switcher */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifMenu(false);
                  }}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all text-left cursor-pointer"
                >
                  <img
                    src={
                      currentMember?.foto ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        displayName || 'Patelki'
                      )}`
                    }
                    alt={displayName}
                    className="w-8 h-8 rounded-lg object-cover border border-amber-300"
                  />
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                      {displayName}
                      {currentUserRole === 'bendahara' ? (
                        <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-md">
                          BENDAHARA
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-md">
                          ANGGOTA
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-700 font-medium truncate max-w-[150px]">
                      NAP: {displayNap} • {currentMember?.instansi || 'Kayong Utara'}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {/* User Menu Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Profil Akun
                      </p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-sm font-extrabold text-slate-900 truncate">
                          {displayName}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-1 ${
                            currentUserRole === 'bendahara'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          {currentUserRole === 'bendahara' ? 'Bendahara DPC' : 'Anggota Aktif'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                        NAP: {displayNap} • {currentMember?.instansi || 'Kayong Utara'}
                      </p>
                    </div>

                    {/* Quick Navigation Links */}
                    <div className="p-2 space-y-1">
                      {currentUserRole === 'bendahara' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              onNavigate('pengaturan');
                              setShowUserMenu(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-950 rounded-xl font-bold transition-colors text-left cursor-pointer"
                          >
                            <Settings className="w-4 h-4 text-amber-500" />
                            <span>Pengaturan Organisasi & Akun</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onNavigate('anggota');
                              setShowUserMenu(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl font-semibold transition-colors text-left cursor-pointer"
                          >
                            <Users className="w-4 h-4 text-emerald-600" />
                            <span>Kelola Data Anggota</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onNavigate('kas');
                              setShowUserMenu(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl font-semibold transition-colors text-left cursor-pointer"
                          >
                            <Wallet className="w-4 h-4 text-blue-600" />
                            <span>Buku Kas & Transaksi</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              onNavigate('profil');
                              setShowUserMenu(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-950 rounded-xl font-bold transition-colors text-left cursor-pointer"
                          >
                            <User className="w-4 h-4 text-emerald-600" />
                            <span>Profil Saya</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onNavigate('bayar-iuran');
                              setShowUserMenu(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 rounded-xl font-semibold transition-colors text-left cursor-pointer"
                          >
                            <Wallet className="w-4 h-4 text-amber-500" />
                            <span>Bayar Iuran Bulanan</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onNavigate('riwayat-anggota');
                              setShowUserMenu(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl font-semibold transition-colors text-left cursor-pointer"
                          >
                            <Receipt className="w-4 h-4 text-blue-600" />
                            <span>Riwayat Pembayaran & Kuitansi</span>
                          </button>
                        </>
                      )}
                    </div>

                    {/* Dedicated Logout Option */}
                    <div className="p-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowLogoutConfirm(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-extrabold text-xs rounded-xl transition-colors cursor-pointer border border-red-200"
                      >
                        <LogOut className="w-4 h-4" />
                        Keluar / Logout Akun
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Quick Logout Button on Navbar */}
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-extrabold transition-all cursor-pointer"
                title="Keluar dari Akun"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Konfirmasi Keluar Akun"
        message={`Apakah Anda yakin ingin keluar dari akun ${currentMember?.nama || 'ini'}? Anda akan diarahkan kembali ke halaman login.`}
        confirmText="Ya, Keluar"
        cancelText="Batal"
        variant="danger"
        icon="logout"
        onConfirm={() => {
          logout();
          setShowLogoutConfirm(false);
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
};

export default Navbar;
