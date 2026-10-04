import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Heart,
  HeartHandshake,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  TrendingUp,
  FileSpreadsheet,
  PlusCircle,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

interface DashboardBendaharaProps {
  onNavigate: (page: string) => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const DashboardBendahara: React.FC<DashboardBendaharaProps> = ({ onNavigate }) => {
  const {
    members,
    duesRecords,
    paymentSubmissions,
    transactions,
    donations,
    socialServices,
    settings,
    getCashBalance,
    getTotalIncome,
    getTotalExpense,
    getTotalDonations,
    getTotalSocialServices,
    getYearlyArrearsList,
    formatCurrency,
  } = useApp();

  const currentYear = 2026;
  const currentMonth = 10; // Oktober 2026 based on metadata

  const activeMembers = members.filter(m => m.status === 'aktif');
  const activeCount = activeMembers.length;

  // Monthly stats for current month
  const currentMonthDues = duesRecords.filter(
    d => d.year === currentYear && d.month === currentMonth
  );

  const paidCountMonth = currentMonthDues.filter(d => d.status === 'paid').length;
  const unpaidCountMonth = currentMonthDues.filter(d => d.status === 'unpaid').length;
  const pendingCountMonth = currentMonthDues.filter(d => d.status === 'pending').length;

  const totalDuesThisMonth = paidCountMonth * settings.monthlyFee;
  const totalPotentialThisMonth = activeCount * settings.monthlyFee;
  const complianceRateThisMonth = activeCount > 0 ? Math.round((paidCountMonth / activeCount) * 100) : 0;

  // Overall totals
  const cashBalance = getCashBalance();
  const totalIncome = getTotalIncome();
  const totalExpense = getTotalExpense();
  const totalDonation = getTotalDonations();
  const totalSocial = getTotalSocialServices();

  const pendingSubmissions = paymentSubmissions.filter(s => s.status === 'pending');
  const arrearsList = getYearlyArrearsList(currentYear);
  const totalArrearsAll = arrearsList.reduce((sum, item) => sum + item.totalArrears, 0);

  // Monthly breakdown for visual charts
  const monthlyData = [
    { month: 'Jan', income: 2400000, expense: 450000 },
    { month: 'Feb', income: 2100000, expense: 620000 },
    { month: 'Mar', income: 2700000, expense: 890000 },
    { month: 'Apr', income: 2400000, expense: 350000 },
    { month: 'Mei', income: 2200000, expense: 1200000 },
    { month: 'Jun', income: 2500000, expense: 500000 },
    { month: 'Jul', income: 2300000, expense: 400000 },
    { month: 'Agu', income: 2600000, expense: 2200000 },
    { month: 'Sep', income: 3300000, expense: 3270000 },
    { month: 'Okt', income: 4460000, expense: 250000 },
  ];

  const maxChartVal = Math.max(...monthlyData.map(d => Math.max(d.income, d.expense)), 5000000);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Banner with Org Branding */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-emerald-700/40">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-72 h-72 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              Dashboard Bendahara
            </div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white">
              DPC PATELKI KABUPATEN KAYONG UTARA
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
              Monitoring kas keuangan, rekapitulasi iuran anggota ({settings.monthlyFee.toLocaleString('id-ID')}/bln), verifikasi transfer bukti, dan transparansi organisasi.
            </p>
          </div>

          {/* Current Cash Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 sm:min-w-[280px]">
            <div className="flex items-center justify-between text-xs text-amber-300 font-semibold mb-1">
              <span>Saldo Kas Saat Ini</span>
              <Wallet className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {formatCurrency(cashBalance)}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-200">
              <span>Status Pembukuan: Aktif</span>
              <span className="text-amber-300 font-bold">100% Real-time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Urgent Alert Notifications */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pendingSubmissions.length > 0 ? (
          <div
            onClick={() => onNavigate('verifikasi')}
            className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400/80 hover:bg-amber-100/80 transition-all cursor-pointer flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl font-bold">
                <Clock className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">
                  🔔 {pendingSubmissions.length} Pembayaran Menunggu Verifikasi
                </p>
                <p className="text-[11px] text-slate-600">Periksa bukti transfer anggota</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-amber-600 group-hover:translate-x-1 transition-transform" />
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-emerald-950">Semua Verifikasi Tuntas</p>
              <p className="text-[11px] text-emerald-700">Tidak ada antrean pembayaran baru</p>
            </div>
          </div>
        )}

        {arrearsList.length > 0 ? (
          <div
            onClick={() => onNavigate('tunggakan')}
            className="p-4 rounded-2xl bg-red-50 border-2 border-red-300 hover:bg-red-100/80 transition-all cursor-pointer flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-500 text-white rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-red-950">
                  ⚠️ {arrearsList.length} Anggota Memiliki Tunggakan
                </p>
                <p className="text-[11px] text-red-700">Total: {formatCurrency(totalArrearsAll)}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-red-600 group-hover:translate-x-1 transition-transform" />
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-emerald-950">Kepatuhan 100%</p>
              <p className="text-[11px] text-emerald-700">Semua anggota telah melunasi iuran</p>
            </div>
          </div>
        )}

        <div
          onClick={() => onNavigate('buku-kas')}
          className="p-4 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-between group shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-amber-300">
                💰 Saldo Kas: {formatCurrency(cashBalance)}
              </p>
              <p className="text-[11px] text-slate-300">Buka Buku Kas & Riwayat Transaksi</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* Main KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Iuran Masuk */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-400 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Iuran Masuk
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 mt-2 font-mono">
            {formatCurrency(totalIncome)}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Pemasukan kumulatif kas
          </p>
        </div>

        {/* Total Pengeluaran */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-400 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Pengeluaran
            </span>
            <div className="p-2 rounded-xl bg-red-100 text-red-700">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 mt-2 font-mono">
            {formatCurrency(totalExpense)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Operasional, ATK, Rapat & Kegiatan
          </p>
        </div>

        {/* Total Donasi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-400 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Donasi Masuk
            </span>
            <div className="p-2 rounded-xl bg-pink-100 text-pink-700">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 mt-2 font-mono">
            {formatCurrency(totalDonation)}
          </div>
          <p className="text-[11px] text-pink-600 font-semibold mt-1">
            {donations.length} Donatur terdaftar
          </p>
        </div>

        {/* Total Bakti Sosial */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-400 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Bakti Sosial
            </span>
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 mt-2 font-mono">
            {formatCurrency(totalSocial)}
          </div>
          <p className="text-[11px] text-indigo-600 font-semibold mt-1">
            {socialServices.length} Kegiatan terlaksana
          </p>
        </div>
      </div>

      {/* Iuran Bulan Ini (Oktober 2026) Deep Dive */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs">
                Periode Berjalan: {MONTH_NAMES[currentMonth - 1]} {currentYear}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                (Tarif: {formatCurrency(settings.monthlyFee)}/anggota)
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
              Rekapitulasi Iuran Bulan Ini
            </h2>
          </div>

          <button
            onClick={() => onNavigate('matrix-12')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs"
          >
            Buka Matrix 12 Bulan
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500 font-bold uppercase">Potensi Penerimaan</p>
            <p className="text-xl font-black text-slate-900 font-mono mt-1">
              {formatCurrency(totalPotentialThisMonth)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">{activeCount} Anggota Aktif</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <p className="text-xs text-emerald-800 font-bold uppercase flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Sudah Bayar (Lunas)
            </p>
            <p className="text-xl font-black text-emerald-700 font-mono mt-1">
              {paidCountMonth} <span className="text-sm font-semibold">Anggota</span>
            </p>
            <p className="text-[11px] text-emerald-600 mt-0.5">
              Terkumpul: {formatCurrency(totalDuesThisMonth)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
            <p className="text-xs text-red-800 font-bold uppercase flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-red-600" /> Belum Bayar
            </p>
            <p className="text-xl font-black text-red-700 font-mono mt-1">
              {unpaidCountMonth} <span className="text-sm font-semibold">Anggota</span>
            </p>
            <p className="text-[11px] text-red-600 mt-0.5">
              Belum masuk: {formatCurrency(unpaidCountMonth * settings.monthlyFee)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300">
            <p className="text-xs text-amber-900 font-bold uppercase flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Menunggu Verifikasi
            </p>
            <p className="text-xl font-black text-amber-800 font-mono mt-1">
              {pendingCountMonth} <span className="text-sm font-semibold">Anggota</span>
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Nilai: {formatCurrency(pendingCountMonth * settings.monthlyFee)}
            </p>
          </div>
        </div>

        {/* Compliance Progress Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
            <span>Tingkat Kepatuhan Pembayaran Bulan Ini:</span>
            <span className="text-emerald-700 font-black text-sm">{complianceRateThisMonth}%</span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${complianceRateThisMonth}%` }}
              className="bg-emerald-500 h-full transition-all duration-500"
            />
            <div
              style={{ width: `${(pendingCountMonth / (activeCount || 1)) * 100}%` }}
              className="bg-amber-400 h-full"
            />
          </div>
          <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Lunas ({paidCountMonth})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Verifikasi ({pendingCountMonth})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              <span>Belum Bayar ({unpaidCountMonth})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Bar Chart & Organization Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expense Monthly Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-black text-slate-900 text-base">
                Grafik Pemasukan & Pengeluaran 2026
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbandingan arus kas bulanan DPC Patelki KKU
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-500" />
                <span className="text-slate-700">Masuk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-amber-500" />
                <span className="text-slate-700">Keluar</span>
              </div>
            </div>
          </div>

          {/* Bar Visualization */}
          <div className="h-64 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-slate-100">
            {monthlyData.map(item => {
              const incomeHeight = (item.income / maxChartVal) * 100;
              const expenseHeight = (item.expense / maxChartVal) * 100;

              return (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1 h-full">
                    {/* Income Bar */}
                    <div
                      style={{ height: `${Math.max(incomeHeight, 6)}%` }}
                      className="w-1/2 max-w-[18px] bg-emerald-500 group-hover:bg-emerald-600 rounded-t-md transition-all relative"
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded-md whitespace-nowrap z-20 pointer-events-none">
                        Masuk: {formatCurrency(item.income)}
                      </div>
                    </div>
                    {/* Expense Bar */}
                    <div
                      style={{ height: `${Math.max(expenseHeight, 6)}%` }}
                      className="w-1/2 max-w-[18px] bg-amber-400 group-hover:bg-amber-500 rounded-t-md transition-all relative"
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded-md whitespace-nowrap z-20 pointer-events-none">
                        Keluar: {formatCurrency(item.expense)}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-900">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Januari – Oktober 2026</span>
            <span className="font-semibold text-emerald-700">Surplus Kas Terjaga</span>
          </div>
        </div>

        {/* Institution Distribution Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-black text-slate-900 text-base">Sebaran Instansi Anggota</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeCount} Ahli Laboratorium Medik terdaftar di KKU
            </p>

            <div className="mt-5 space-y-3">
              {[
                { name: 'RSUD Sultan Muhammad Jamaludin I', count: 4, pct: 33 },
                { name: 'Puskesmas Teluk Batang', count: 2, pct: 17 },
                { name: 'Puskesmas Sukadana', count: 2, pct: 17 },
                { name: 'Puskesmas Simpang Hilir', count: 1, pct: 8 },
                { name: 'Puskesmas Seponti', count: 1, pct: 8 },
                { name: 'Puskesmas Pulau Maya & Karimata', count: 2, pct: 17 },
              ].map(inst => (
                <div key={inst.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="truncate pr-2">{inst.name}</span>
                    <span className="font-bold text-slate-900 shrink-0">{inst.count} ATLM</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${inst.pct}%` }}
                      className="bg-emerald-600 h-full rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('anggota-list')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              Kelola Data Anggota Lengkap
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons Grid */}
      <div className="bg-amber-500/10 border border-amber-400/40 rounded-3xl p-6">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="p-1 bg-amber-400 text-slate-950 rounded-lg">⚡</span>
          Aksi Cepat Bendahara
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <button
            onClick={() => onNavigate('verifikasi')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all text-left group"
          >
            <Clock className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform mb-2" />
            <p className="text-xs font-extrabold text-slate-900">Verifikasi Pembayaran</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Periksa bukti transfer</p>
          </button>

          <button
            onClick={() => onNavigate('tunggakan')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all text-left group"
          >
            <MessageSquare className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform mb-2" />
            <p className="text-xs font-extrabold text-slate-900">Tagih via WhatsApp</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Kirim pengingat tunggakan</p>
          </button>

          <button
            onClick={() => onNavigate('kas-keluar')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all text-left group"
          >
            <ArrowUpRight className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform mb-2" />
            <p className="text-xs font-extrabold text-slate-900">Catat Pengeluaran Kas</p>
            <p className="text-[10px] text-slate-500 mt-0.5">ATK, operasional, rapat</p>
          </button>

          <button
            onClick={() => onNavigate('laporan')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all text-left group"
          >
            <FileSpreadsheet className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform mb-2" />
            <p className="text-xs font-extrabold text-slate-900">Laporan Transparansi</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Export PDF / Excel resmi</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardBendahara;
