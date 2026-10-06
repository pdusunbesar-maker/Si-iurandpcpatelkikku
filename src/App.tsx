import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { PatelkiLogo } from './components/PatelkiLogo';

// Bendahara Pages
import { DashboardBendahara } from './pages/bendahara/DashboardBendahara';
import { DataAnggota } from './pages/bendahara/DataAnggota';
import { MatrixIuran } from './pages/bendahara/MatrixIuran';
import { MatrixTahunan } from './pages/bendahara/MatrixTahunan';
import { VerifikasiPembayaran } from './pages/bendahara/VerifikasiPembayaran';
import { DaftarTunggakan } from './pages/bendahara/DaftarTunggakan';
import { RekapitulasiIuran } from './pages/bendahara/RekapitulasiIuran';
import { BukuKas } from './pages/bendahara/BukuKas';
import { KasTransactionPage } from './pages/bendahara/KasTransactionPage';
import { Donasi } from './pages/bendahara/Donasi';
import { BaktiSosial } from './pages/bendahara/BaktiSosial';
import { LaporanTransparansi } from './pages/bendahara/LaporanTransparansi';
import { WhatsAppBroadcast } from './pages/bendahara/WhatsAppBroadcast';
import { Pengaturan } from './pages/bendahara/Pengaturan';

// Anggota Pages
import { DashboardAnggota } from './pages/anggota/DashboardAnggota';
import { BayarIuran } from './pages/anggota/BayarIuran';
import { MatrixSaya } from './pages/anggota/MatrixSaya';
import { RiwayatIuranAnggota } from './pages/anggota/RiwayatIuranAnggota';
import { ProfilAnggota } from './pages/anggota/ProfilAnggota';
import { InfoRekening } from './pages/anggota/InfoRekening';
import { RekapKasAnggota } from './pages/anggota/RekapKasAnggota';

import { Menu } from 'lucide-react';
import { LoginPage } from './pages/auth/LoginPage';

const MainContent: React.FC = () => {
  const { currentUserRole } = useApp();
  const [currentPage, setCurrentPage] = useState<string>(
    currentUserRole === 'bendahara' ? 'dashboard' : 'dashboard-anggota'
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync default page when switching role
  React.useEffect(() => {
    if (currentUserRole === 'bendahara' && currentPage.startsWith('dashboard-anggota')) {
      setCurrentPage('dashboard');
    } else if (currentUserRole === 'anggota' && currentPage === 'dashboard') {
      setCurrentPage('dashboard-anggota');
    }
  }, [currentUserRole, currentPage]);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCurrentPage = () => {
    if (currentUserRole === 'bendahara') {
      switch (currentPage) {
        case 'dashboard':
          return <DashboardBendahara onNavigate={handleNavigate} />;
        case 'anggota-list':
          return <DataAnggota />;
        case 'matrix-12':
          return <MatrixIuran />;
        case 'matrix-tahunan':
          return <MatrixTahunan />;
        case 'verifikasi':
          return <VerifikasiPembayaran />;
        case 'tunggakan':
          return <DaftarTunggakan />;
        case 'rekap-iuran':
          return <RekapitulasiIuran />;
        case 'buku-kas':
          return <BukuKas />;
        case 'kas-masuk':
          return <KasTransactionPage type="income" />;
        case 'kas-keluar':
          return <KasTransactionPage type="expense" />;
        case 'donasi':
          return <Donasi />;
        case 'bakti-sosial':
          return <BaktiSosial />;
        case 'laporan':
          return <LaporanTransparansi />;
        case 'whatsapp-broadcast':
          return <WhatsAppBroadcast />;
        case 'pengaturan':
          return <Pengaturan />;
        default:
          return <DashboardBendahara onNavigate={handleNavigate} />;
      }
    } else {
      // Anggota Pages
      switch (currentPage) {
        case 'dashboard-anggota':
          return <DashboardAnggota onNavigate={handleNavigate} />;
        case 'bayar-iuran':
          return <BayarIuran onNavigate={handleNavigate} />;
        case 'matrix-saya':
          return <MatrixSaya onNavigate={handleNavigate} />;
        case 'riwayat-saya':
          return <RiwayatIuranAnggota onNavigate={handleNavigate} />;
        case 'profil-saya':
          return <ProfilAnggota />;
        case 'info-rekening':
          return <InfoRekening />;
        case 'rekap-kas-anggota':
          return <RekapKasAnggota onNavigate={handleNavigate} />;
        default:
          return <DashboardAnggota onNavigate={handleNavigate} />;
      }
    }
  };

  return (
    <div className="w-full min-h-[100dvh] bg-slate-50 flex flex-col font-sans overflow-x-hidden">
      <Navbar
        onNavigate={handleNavigate}
        currentPage={currentPage}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Main Full-Screen Body Container */}
      <div className="w-full flex-1 flex flex-col lg:flex-row min-w-0">
        {/* Sidebar */}
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Page Content Viewport - Full Width Expansion */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 xl:p-10 min-w-0 w-full overflow-x-hidden">
          {renderCurrentPage()}
        </main>
      </div>

      {/* Mobile Floating Menu Button (Secondary Trigger) */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl shadow-xl flex items-center gap-2 border border-amber-300 active:scale-95 transition-all cursor-pointer"
        >
          <Menu className="w-5 h-5" />
          <span className="text-xs font-black">Menu Navigasi</span>
        </button>
      </div>
    </div>
  );
};

const AppView: React.FC = () => {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <MainContent />;
};

export default function App() {
  return (
    <AppProvider>
      <AppView />
    </AppProvider>
  );
}
