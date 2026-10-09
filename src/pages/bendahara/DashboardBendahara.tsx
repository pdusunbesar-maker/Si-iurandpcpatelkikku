import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useDuesData } from '../../hooks/useDuesData';
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
  Building,
  Calendar,
  Layers,
  Sparkles,
  PieChart,
  BarChart3,
  Percent,
  ShieldAlert,
} from 'lucide-react';
import { Member } from '../../types';
import { DashboardTrendsChart } from '../../components/bendahara/DashboardTrendsChart';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface DashboardBendaharaProps {
  onNavigate: (page: string) => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

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
    runDataAudit,
    runAutoSync,
  } = useApp();

  const [auditResult, setAuditResult] = useState<{
    consistent: boolean;
    totalIssues: number;
    issuesList: string[];
    details: {
      missingPaidInDuesRecords: number;
      orphanedDuesRecords: number;
      unmatchedSubmissions: number;
    };
  } | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleRunAudit = () => {
    setIsAuditing(true);
    setSyncMessage(null);
    setTimeout(() => {
      const res = runDataAudit();
      setAuditResult(res);
      setIsAuditing(false);
    }, 400);
  };

  const handleRunAutoSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await runAutoSync();
      setSyncMessage(res.message);
      const updatedAudit = runDataAudit();
      setAuditResult(updatedAudit);
    } catch (err: any) {
      setSyncMessage(err.message || 'Gagal melakukan auto-sync');
    } finally {
      setIsSyncing(false);
    }
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12 based on running calendar
  const currentMonthName = MONTH_NAMES[now.getMonth()];

  const [chartYear, setChartYear] = useState<number>(currentYear);
  const duesDataSync = useDuesData(chartYear);

  // Month-over-Month Growth Calculation for 'Analisis Tren Iuran' summary card
  const monthlyBreakdownSync = duesDataSync.monthlyBreakdown;
  const currentMonthStats = monthlyBreakdownSync[currentMonth - 1] || { collected: 0, compliance: 0, paidCount: 0 };
  const prevMonthStats = currentMonth > 1 ? monthlyBreakdownSync[currentMonth - 2] : { collected: 0, compliance: 0, paidCount: 0 };
  
  const growthCollectedDiff = currentMonthStats.collected - (prevMonthStats?.collected || 0);
  const growthPercentage = (prevMonthStats?.collected || 0) > 0
    ? Math.round(((currentMonthStats.collected - prevMonthStats.collected) / prevMonthStats.collected) * 100)
    : (currentMonthStats.collected > 0 ? 100 : 0);

  const activeMembers = members.filter(m => m.status === 'aktif');
  const activeCount = activeMembers.length;
  const totalMemberCount = members.length;

  // Monthly stats for current running month
  const currentMonthDues = duesRecords.filter(
    d => d.year === currentYear && d.month === currentMonth
  );

  const paidCountMonth = currentMonthDues.filter(d => d.status === 'paid').length;
  const unpaidCountMonth = currentMonthDues.filter(d => d.status === 'unpaid').length;
  const pendingCountMonth = currentMonthDues.filter(d => d.status === 'pending').length;

  const totalDuesThisMonth = paidCountMonth * settings.monthlyFee;
  const totalPotentialThisMonth = activeCount * settings.monthlyFee;
  const complianceRateThisMonth = activeCount > 0 ? Math.round((paidCountMonth / activeCount) * 100) : 0;

  // Overall Cashbook totals
  const cashBalance = getCashBalance();
  const totalIncome = getTotalIncome();
  const totalExpense = getTotalExpense();
  const totalDonation = getTotalDonations();
  const totalSocial = getTotalSocialServices();

  const pendingSubmissions = paymentSubmissions.filter(s => s.status === 'pending');

  // Arrears list accumulated from January 2025 up to running calendar month
  const arrearsList = getYearlyArrearsList('all');
  const totalArrearsAll = arrearsList.reduce((sum, item) => sum + item.totalArrears, 0);

  // Cumulative potential calculation from Jan 2025 up to running calendar month
  const totalElapsedMonths = Math.max(1, ((currentYear - (settings.startYear || 2025)) * 12) + currentMonth);
  const totalCumulativePotential = totalElapsedMonths * activeCount * settings.monthlyFee;
  const totalDuesCollectedReal = duesRecords
    .filter(d => d.status === 'paid' && d.year >= 2025 && (d.year < currentYear || (d.year === currentYear && d.month <= currentMonth)))
    .reduce((sum, d) => sum + (d.amount || settings.monthlyFee), 0);
  const cumulativeCollectionRate = totalCumulativePotential > 0
    ? Math.round((totalDuesCollectedReal / totalCumulativePotential) * 100)
    : 0;

  // Real-time Monthly Breakdown for Chart: Synchronized from `transactions` table
  const monthlyData = MONTH_SHORT.map((mShort, index) => {
    const mNum = index + 1;
    const mStr = mNum.toString().padStart(2, '0');
    const prefix = `${chartYear}-${mStr}`;

    const monthTx = transactions.filter(t => t.date && t.date.startsWith(prefix));
    const income = monthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    return {
      month: mShort,
      monthNum: mNum,
      income,
      expense,
      surplus: income - expense,
      txCount: monthTx.length,
    };
  });

  const chartTotalIncome = monthlyData.reduce((s, m) => s + m.income, 0);
  const chartTotalExpense = monthlyData.reduce((s, m) => s + m.expense, 0);
  const chartNetSurplus = chartTotalIncome - chartTotalExpense;
  const maxChartVal = Math.max(...monthlyData.map(d => Math.max(d.income, d.expense)), 1000000);

  // Real-time Member Institutional Distribution (Sebaran Instansi Anggota)
  const instansiMap = new Map<string, {
    name: string;
    total: number;
    active: number;
    nonaktif: number;
    members: Member[];
  }>();

  members.forEach(m => {
    const instName = m.instansi && m.instansi.trim() ? m.instansi.trim() : 'Lainnya / Mandiri';
    const existing = instansiMap.get(instName) || {
      name: instName,
      total: 0,
      active: 0,
      nonaktif: 0,
      members: [],
    };
    existing.total += 1;
    if (m.status === 'aktif') existing.active += 1;
    else existing.nonaktif += 1;
    existing.members.push(m);
    instansiMap.set(instName, existing);
  });

  const instansiDistribution = Array.from(instansiMap.values())
    .map(inst => ({
      ...inst,
      percentage: totalMemberCount > 0 ? Math.round((inst.total / totalMemberCount) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

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
              <p className="text-xs font-bold text-emerald-900">Semua Pembayaran Terverifikasi</p>
              <p className="text-[11px] text-emerald-700">Tidak ada antrean pending</p>
            </div>
          </div>
        )}

        {totalArrearsAll > 0 ? (
          <div
            onClick={() => onNavigate('tunggakan')}
            className="p-4 rounded-2xl bg-red-50 border border-red-200 hover:bg-red-100/70 transition-all cursor-pointer flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-500 text-white rounded-xl font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">
                  ⚠️ {arrearsList.length} Anggota Menunggak
                </p>
                <p className="text-[11px] text-red-700 font-mono font-bold">
                  Total: {formatCurrency(totalArrearsAll)}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-red-500 group-hover:translate-x-1 transition-transform" />
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-emerald-900">Kepatuhan Iuran 100%</p>
              <p className="text-[11px] text-emerald-700">Seluruh anggota lunas s.d. saat ini</p>
            </div>
          </div>
        )}

        <div
          onClick={() => onNavigate('anggota-list')}
          className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-between group shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-white rounded-xl font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">
                👥 {totalMemberCount} Ahli Lab Terdaftar
              </p>
              <p className="text-[11px] text-slate-600">
                {activeCount} aktif • {instansiDistribution.length} instansi sebaran
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* 4 Main Cash Flow KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pemasukan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-400 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Pemasukan Kas
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-700 mt-2 font-mono">
            {formatCurrency(totalIncome)}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {transactions.filter(t => t.type === 'income').length} Transaksi Pemasukan
          </p>
        </div>

        {/* Total Pengeluaran */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-400 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Pengeluaran Kas
            </span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-amber-800 mt-2 font-mono">
            {formatCurrency(totalExpense)}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {transactions.filter(t => t.type === 'expense').length} Transaksi Pengeluaran
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

      {/* Synchronized Potensi Penerimaan & Realisasi Kas Section */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-xs">
                📊 Sinkronisasi Potensi Penerimaan
              </span>
              <span className="text-xs text-slate-500 font-medium">
                (Tarif Wajib: {formatCurrency(settings.monthlyFee)} /anggota /bln)
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
              Data Potensi Penerimaan & Realisasi Iuran DPC
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('rekapitulasi')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Rekapitulasi Iuran
            </button>
            <button
              onClick={() => onNavigate('matrix-12')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
            >
              Matrix 12 Bulan
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2 Comparison Cards: Bulan Berjalan vs Akumulasi Sejak Jan 2025 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card 1: Potensi Bulan Berjalan */}
          <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Periode Bulan Ini
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm">
                  {currentMonthName} {currentYear}
                </h4>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-700">
                {activeCount} Anggota Aktif
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Potensi Masuk</span>
                <span className="font-black font-mono text-slate-900 text-sm mt-0.5 block">
                  {formatCurrency(totalPotentialThisMonth)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] text-emerald-800 font-bold uppercase block">Lunas Terkumpul</span>
                <span className="font-black font-mono text-emerald-700 text-sm mt-0.5 block">
                  {formatCurrency(totalDuesThisMonth)}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">{paidCountMonth} Org</span>
              </div>
              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <span className="text-[10px] text-red-800 font-bold uppercase block">Belum Masuk</span>
                <span className="font-black font-mono text-red-700 text-sm mt-0.5 block">
                  {formatCurrency(unpaidCountMonth * settings.monthlyFee)}
                </span>
                <span className="text-[10px] text-red-600 font-semibold">{unpaidCountMonth} Org</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span>Kepatuhan Bulan Ini:</span>
                <span className="text-emerald-700 font-mono font-black">{complianceRateThisMonth}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${complianceRateThisMonth}%` }}
                  className="bg-emerald-500 h-full transition-all duration-500"
                />
                <div
                  style={{ width: `${(pendingCountMonth / (activeCount || 1)) * 100}%` }}
                  className="bg-amber-400 h-full"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Akumulasi Potensi Sejak Jan 2025 s.d. Sekarang */}
          <div className="p-5 rounded-2xl bg-emerald-950 text-white space-y-4 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <div>
                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                  Akumulasi Kalender Berjalan
                </span>
                <h4 className="font-extrabold text-white text-sm">
                  Januari 2025 s.d. {currentMonthName} {currentYear} ({totalElapsedMonths} Bulan)
                </h4>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-white/10 border border-white/20 text-xs font-mono font-bold text-amber-300">
                {cumulativeCollectionRate}% Realisasi
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs relative z-10">
              <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                <span className="text-[10px] text-emerald-300 font-bold uppercase block">Total Potensi</span>
                <span className="font-black font-mono text-white text-sm mt-0.5 block">
                  {formatCurrency(totalCumulativePotential)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                <span className="text-[10px] text-emerald-300 font-bold uppercase block">Kas Terkumpul</span>
                <span className="font-black font-mono text-emerald-300 text-sm mt-0.5 block">
                  {formatCurrency(totalDuesCollectedReal)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30">
                <span className="text-[10px] text-red-300 font-bold uppercase block">Total Tunggakan</span>
                <span className="font-black font-mono text-red-300 text-sm mt-0.5 block">
                  {formatCurrency(totalArrearsAll)}
                </span>
              </div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-200 mb-1.5">
                <span>Rasio Realisasi Kas Iuran:</span>
                <span className="text-amber-300 font-mono font-black">{cumulativeCollectionRate}%</span>
              </div>
              <div className="w-full bg-white/15 h-2.5 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${cumulativeCollectionRate}%` }}
                  className="bg-emerald-400 h-full transition-all duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Automated Data Audit & Auto-Sync Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Audit Otomatis & Konsistensi Data Iuran</h3>
              <p className="text-xs text-slate-500">
                Periksa kesesuaian data antara tabel transaksi iuran, verifikasi pembayaran, dan status anggota secara real-time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 text-amber-400 ${isAuditing ? 'animate-spin' : ''}`} />
              {isAuditing ? 'Memeriksa...' : 'Jalankan Audit Otomatis'}
            </button>

            {auditResult && !auditResult.consistent && (
              <button
                onClick={handleRunAutoSync}
                disabled={isSyncing}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Menyelaraskan...' : 'Perbaiki Otomatis (Auto-Sync)'}
              </button>
            )}
          </div>
        </div>

        {syncMessage && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        {auditResult ? (
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {auditResult.consistent ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Data Sesuai & Konsisten (0 Inkonsistensi)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Ditemukan {auditResult.totalIssues} Ketidaksesuaian Data
                  </span>
                )}
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Terakhir diaudit: {new Date().toLocaleTimeString('id-ID')}
              </span>
            </div>

            {!auditResult.consistent && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <p className="text-xs font-bold text-slate-800">Rincian Temuan Ketidaksesuaian:</p>
                <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-2">
                  {auditResult.issuesList.map((issue, idx) => (
                    <li key={idx} className="text-xs text-slate-600 flex items-start gap-2 bg-white p-2 rounded-xl border border-slate-200">
                      <span className="text-amber-500 font-bold">#{idx + 1}</span>
                      <span className="flex-1">{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="pt-2 text-xs text-slate-400 italic flex items-center gap-2">
            <span>ℹ️ Klik tombol "Jalankan Audit Otomatis" untuk memulai pengecekan konsistensi data.</span>
          </div>
        )}
      </div>

      {/* Analisis Tren Iuran Summary Card using sync hook */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-emerald-700/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" />
              Analisis Tren Iuran & Pertumbuhan Bulan ke Bulan
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Perbandingan Kolektibilitas {currentMonthName} {chartYear} vs Bulan Sebelumnya
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              Data tersinkronisasi langsung dari hook `useDuesData` untuk memantau persentase pertumbuhan pembayaran iuran anggota secara real-time.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Growth Stat Badge */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center sm:text-left min-w-[200px]">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
                Pertumbuhan Bulan Ini
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-2xl font-black font-mono ${growthPercentage >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {growthPercentage >= 0 ? `+${growthPercentage}%` : `${growthPercentage}%`}
                </span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${growthPercentage >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                  {growthCollectedDiff >= 0 ? `+${formatCurrency(growthCollectedDiff)}` : formatCurrency(growthCollectedDiff)}
                </span>
              </div>
              <span className="text-[10px] text-slate-300 mt-1 block font-mono">
                Terkumpul: {formatCurrency(currentMonthStats.collected)} ({currentMonthStats.paidCount} ATLM Lunas)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics: Monthly Iuran Collection Trends & Active Member Growth (Recharts) */}
      <DashboardTrendsChart onNavigate={onNavigate} />

      {/* Financial Bar Chart & Organization Distribution (100% Real-Time Integrated) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expense Monthly Chart (Integrated from `transactions`) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-black text-slate-900 text-base">
                    Grafik Pemasukan & Pengeluaran Kas
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Arus kas aktual dari catatan pembukuan transaksi DPC
                </p>
              </div>

              {/* Year Selector for Chart */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                {[2025, 2026, 2027, 2028].map(yr => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setChartYear(yr)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      chartYear === yr
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart Summary Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Total Masuk {chartYear}</span>
                <span className="font-black font-mono text-emerald-700 text-sm mt-0.5 block">
                  {formatCurrency(chartTotalIncome)}
                </span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[10px] font-bold text-amber-900 uppercase block">Total Keluar {chartYear}</span>
                <span className="font-black font-mono text-amber-800 text-sm mt-0.5 block">
                  {formatCurrency(chartTotalExpense)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">Net Surplus {chartYear}</span>
                <span className={`font-black font-mono text-sm mt-0.5 block ${chartNetSurplus >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {formatCurrency(chartNetSurplus)}
                </span>
              </div>
            </div>

            {/* Recharts Monthly Income vs Expense Bar Chart */}
            <div className="h-72 w-full pt-4 pb-2 border-b border-slate-100">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(0)}jt` : `${val / 1000}rb`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs min-w-[180px]">
                            <p className="font-bold text-amber-400 mb-2 border-b border-slate-700 pb-1">Bulan: {label} {chartYear}</p>
                            <div className="space-y-1 font-mono">
                              <p className="flex justify-between gap-3 text-emerald-400">
                                <span>Pemasukan:</span>
                                <span className="font-bold">{formatCurrency(payload[0]?.value as number || 0)}</span>
                              </p>
                              <p className="flex justify-between gap-3 text-amber-400">
                                <span>Pengeluaran:</span>
                                <span className="font-bold">{formatCurrency(payload[1]?.value as number || 0)}</span>
                              </p>
                              <p className="flex justify-between gap-3 pt-1 border-t border-slate-700 text-white font-bold">
                                <span>Net Surplus:</span>
                                <span>{formatCurrency(((payload[0]?.value as number) || 0) - ((payload[1]?.value as number) || 0))}</span>
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="income" name="Pemasukan Kas" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="expense" name="Pengeluaran Kas" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-500" />
                <span className="text-slate-700 font-semibold">Pemasukan Kas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-amber-400" />
                <span className="text-slate-700 font-semibold">Pengeluaran Kas</span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('buku-kas')}
              className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline"
            >
              Lihat Rincian Buku Kas →
            </button>
          </div>
        </div>

        {/* Institution Distribution Card (100% Real-Time Integrated from `members`) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-black text-slate-900 text-base">Sebaran Instansi Anggota</h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px] font-bold">
                {instansiDistribution.length} Instansi
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Distribusi {totalMemberCount} Ahli Laboratorium Medik terdaftar di KKU
            </p>

            <div className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
              {instansiDistribution.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <Building className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  Belum ada data instansi anggota.
                </div>
              ) : (
                instansiDistribution.map(inst => (
                  <div key={inst.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span className="truncate pr-2 font-bold text-slate-900">{inst.name}</span>
                      <span className="font-mono font-bold text-emerald-800 shrink-0">
                        {inst.total} ATLM ({inst.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${inst.percentage}%` }}
                        className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{inst.active} Aktif {inst.nonaktif > 0 ? `• ${inst.nonaktif} Nonaktif` : ''}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('anggota-list')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <button
            onClick={() => onNavigate('verifikasi')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all text-left group cursor-pointer"
          >
            <Clock className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform mb-2" />
            <p className="text-xs font-extrabold text-slate-900">Verifikasi Pembayaran</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Periksa bukti transfer</p>
          </button>

          <button
            onClick={() => onNavigate('tunggakan')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all text-left group cursor-pointer"
          >
            <MessageSquare className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform mb-2" />
            <p className="text-xs font-extrabold text-slate-900">Tagih via WhatsApp</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Kirim pengingat tunggakan</p>
          </button>

          <button
            onClick={() => onNavigate('kas-keluar')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all text-left group cursor-pointer"
          >
            <ArrowUpRight className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform mb-2" />
            <p className="text-xs font-extrabold text-slate-900">Catat Pengeluaran Kas</p>
            <p className="text-[10px] text-slate-500 mt-0.5">ATK, operasional, rapat</p>
          </button>

          <button
            onClick={() => onNavigate('laporan')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all text-left group cursor-pointer"
          >
            <FileSpreadsheet className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform mb-2" />
            <p className="text-xs font-extrabold text-slate-900">Laporan Transparansi</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Export PDF / Excel resmi</p>
          </button>

          <button
            onClick={() => onNavigate('anggaran-tahunan')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all text-left group cursor-pointer"
          >
            <BarChart3 className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform mb-2" />
            <p className="text-xs font-extrabold text-slate-900">Anggaran Tahunan</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Komparasi RAPB vs Riil</p>
          </button>

          <button
            onClick={() => onNavigate('activity-logs')}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-left group cursor-pointer"
          >
            <ShieldAlert className="w-5 h-5 text-emerald-700 group-hover:scale-110 transition-transform mb-2" />
            <p className="text-xs font-extrabold text-slate-900">Log Aktivitas & Audit</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Jejak perubahan akun</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardBendahara;
