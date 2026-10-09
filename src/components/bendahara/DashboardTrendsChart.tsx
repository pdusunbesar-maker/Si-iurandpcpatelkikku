import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Users,
  Coins,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTH_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

interface DashboardTrendsChartProps {
  onNavigate?: (page: string) => void;
}

export const DashboardTrendsChart: React.FC<DashboardTrendsChartProps> = ({ onNavigate }) => {
  const { members, duesRecords, settings, formatCurrency } = useApp();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [activeTab, setActiveTab] = useState<'iuran' | 'members' | 'combined'>('iuran');

  const availableYears = useMemo(() => {
    const start = settings.startYear || 2025;
    const end = Math.max(settings.endYear || 2031, currentYear);
    const yrs: number[] = [];
    for (let y = start; y <= end; y++) yrs.push(y);
    return yrs;
  }, [settings.startYear, settings.endYear, currentYear]);

  // Active and total members
  const activeMembersList = useMemo(() => members.filter(m => m.status === 'aktif'), [members]);
  const activeCount = activeMembersList.length;

  // Compute monthly data for the selected year
  const chartData = useMemo(() => {
    const monthlyFee = Number(settings.monthlyFee) || 30000;

    return MONTH_SHORT.map((mShort, idx) => {
      const monthNum = idx + 1;

      // Filter dues records for this month & year
      const monthDues = duesRecords.filter(
        d => d.year === selectedYear && d.month === monthNum
      );

      const paidRecords = monthDues.filter(d => d.status === 'paid');
      const pendingRecords = monthDues.filter(d => d.status === 'pending');
      const unpaidRecords = monthDues.filter(d => d.status === 'unpaid');

      const collectedAmount = paidRecords.reduce((sum, d) => sum + (d.amount || monthlyFee), 0);
      const pendingAmount = pendingRecords.reduce((sum, d) => sum + (d.amount || monthlyFee), 0);
      const unpaidAmount = unpaidRecords.reduce((sum, d) => sum + (d.amount || monthlyFee), 0);

      // Target is all active members for this period
      const targetAmount = activeCount * monthlyFee;
      const complianceRate = targetAmount > 0 ? Math.min(100, Math.round((collectedAmount / targetAmount) * 100)) : 0;

      // Active members growth estimation up to this month
      // Filter members registered on or before this month & year
      const membersUpToMonth = members.filter(m => {
        if (!m.tanggalBergabung) return true;
        const joinDate = new Date(m.tanggalBergabung);
        if (isNaN(joinDate.getTime())) return true;
        const joinYear = joinDate.getFullYear();
        const joinMonth = joinDate.getMonth() + 1;
        return joinYear < selectedYear || (joinYear === selectedYear && joinMonth <= monthNum);
      });

      const activeUpToMonth = membersUpToMonth.filter(m => m.status === 'aktif').length;
      const totalUpToMonth = membersUpToMonth.length;

      return {
        month: mShort,
        monthFull: MONTH_FULL[idx],
        monthNum,
        collected: collectedAmount,
        target: targetAmount,
        pending: pendingAmount,
        arrears: unpaidAmount,
        complianceRate,
        paidMembersCount: paidRecords.length,
        activeMembers: activeUpToMonth,
        totalMembers: totalUpToMonth,
        isFuture: selectedYear > currentYear || (selectedYear === currentYear && monthNum > currentMonth),
      };
    });
  }, [duesRecords, members, selectedYear, settings.monthlyFee, activeCount, currentYear, currentMonth]);

  // Aggregate stats for KPI badges
  const yearlyStats = useMemo(() => {
    const totalCollected = chartData.reduce((acc, d) => acc + d.collected, 0);
    const totalTarget = chartData.reduce((acc, d) => acc + (d.isFuture ? 0 : d.target), 0);
    const totalPending = chartData.reduce((acc, d) => acc + d.pending, 0);
    const totalArrears = chartData.reduce((acc, d) => acc + (d.isFuture ? 0 : d.arrears), 0);

    const pastMonths = chartData.filter(d => !d.isFuture);
    const avgCompliance = pastMonths.length > 0
      ? Math.round(pastMonths.reduce((acc, d) => acc + d.complianceRate, 0) / pastMonths.length)
      : 0;

    return {
      totalCollected,
      totalTarget,
      totalPending,
      totalArrears,
      avgCompliance,
    };
  }, [chartData]);

  // Custom Tooltip for Iuran Collection
  const CustomIuranTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/60 text-xs min-w-[210px] animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/80">
            <span className="font-bold text-amber-400 font-sans">
              {data.monthFull} {selectedYear}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
              {data.complianceRate}% Lunas
            </span>
          </div>

          <div className="space-y-1.5 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                Terkumpul:
              </span>
              <span className="font-bold text-emerald-400">{formatCurrency(data.collected)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                Target Potensi:
              </span>
              <span className="font-bold text-slate-200">{formatCurrency(data.target)}</span>
            </div>

            {data.pending > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                  Verifikasi:
                </span>
                <span className="font-bold text-amber-300">{formatCurrency(data.pending)}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" />
                Tunggakan:
              </span>
              <span className="font-bold text-red-300">{formatCurrency(data.arrears)}</span>
            </div>

            <div className="pt-1.5 mt-1 border-t border-slate-800 text-[10px] text-slate-400 font-sans flex items-center justify-between">
              <span>Anggota Lunas:</span>
              <span className="font-bold text-white font-mono">{data.paidMembersCount} / {activeCount} ATLM</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Member Growth
  const CustomMemberTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/60 text-xs min-w-[200px] animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/80">
            <span className="font-bold text-emerald-400 font-sans">
              {data.monthFull} {selectedYear}
            </span>
            <span className="text-slate-400 text-[10px]">Statistik Anggota</span>
          </div>

          <div className="space-y-1.5 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                Anggota Aktif:
              </span>
              <span className="font-bold text-emerald-300">{data.activeMembers} ATLM</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                Total Terdaftar:
              </span>
              <span className="font-bold text-amber-300">{data.totalMembers} ATLM</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800">
              <span className="text-slate-300">Kepatuhan Iuran:</span>
              <span className="font-bold text-emerald-400">{data.complianceRate}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Interactive Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Tren Kolektibilitas Iuran &amp; Pertumbuhan Anggota
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Visualisasi analitik bulanan real-time berbasis Recharts untuk DPC PATELKI Kayong Utara
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Tabs & Year Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Visualization Tab Switcher */}
          <div className="p-1 bg-slate-100 rounded-2xl flex items-center gap-1 select-none text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('iuran')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'iuran'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kolektibilitas Iuran</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('members')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'members'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-500" />
              <span>Pertumbuhan Anggota</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('combined')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'combined'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Komprehensif</span>
            </button>
          </div>

          {/* Year Filter Select */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
            >
              {availableYears.map(yr => (
                <option key={yr} value={yr}>
                  Tahun {yr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/80">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
            Terkumpul ({selectedYear})
          </span>
          <span className="text-base sm:text-xl font-black font-mono text-emerald-900 mt-1 block">
            {formatCurrency(yearlyStats.totalCollected)}
          </span>
          <span className="text-[10px] text-emerald-700 mt-0.5 block">
            Target Berjalan: {formatCurrency(yearlyStats.totalTarget)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/80">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
            Rata-rata Kepatuhan
          </span>
          <span className="text-base sm:text-xl font-black font-mono text-amber-900 mt-1 block">
            {yearlyStats.avgCompliance}%
          </span>
          <span className="text-[10px] text-amber-700 mt-0.5 block">
            Tingkat pelunasan iuran tahun {selectedYear}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/80">
          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
            Total Anggota Aktif
          </span>
          <span className="text-base sm:text-xl font-black font-mono text-blue-900 mt-1 block">
            {activeCount} <span className="text-xs font-sans font-bold text-blue-700">ATLM</span>
          </span>
          <span className="text-[10px] text-blue-700 mt-0.5 block">
            Dari {members.length} anggota terdaftar
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200/80">
          <span className="text-[11px] font-bold text-red-800 uppercase tracking-wider block">
            Sisa Tunggakan ({selectedYear})
          </span>
          <span className="text-base sm:text-xl font-black font-mono text-red-900 mt-1 block">
            {formatCurrency(yearlyStats.totalArrears)}
          </span>
          <span className="text-[10px] text-red-700 mt-0.5 block">
            Kewajiban belum terverifikasi
          </span>
        </div>
      </div>

      {/* Main Recharts Area */}
      <div className="pt-2">
        {activeTab === 'iuran' && (
          <div>
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold text-slate-700">
                Grafik Kolektibilitas Iuran Bulanan (Jan – Des {selectedYear})
              </span>
              <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00664F]" /> Terkumpul (Rp)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Target Potensi (Rp)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" /> Sisa Tunggakan
                </span>
              </div>
            </div>

            <div className="w-full h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00664F" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#00664F" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorArrears" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={val => (val >= 1000000 ? `${(val / 1000000).toFixed(1)}Jt` : val >= 1000 ? `${val / 1000}rb` : val)}
                  />
                  <Tooltip content={<CustomIuranTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="collected"
                    name="Terkumpul"
                    stroke="#00664F"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorCollected)"
                  />
                  <Line
                    type="step"
                    dataKey="target"
                    name="Target Potensi"
                    stroke="#94A3B8"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Bar
                    dataKey="arrears"
                    name="Tunggakan"
                    fill="#EF4444"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={14}
                    opacity={0.7}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div>
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold text-slate-700">
                Grafik Pertumbuhan &amp; Akumulasi Anggota Aktif ({selectedYear})
              </span>
              <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00664F]" /> Anggota Aktif
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF9F00]" /> Total Terdaftar
                </span>
              </div>
            </div>

            <div className="w-full h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActiveMembers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00664F" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#00664F" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorTotalMembers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF9F00" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#FF9F00" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomMemberTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="totalMembers"
                    name="Total Terdaftar"
                    stroke="#FF9F00"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTotalMembers)"
                  />
                  <Area
                    type="monotone"
                    dataKey="activeMembers"
                    name="Anggota Aktif"
                    stroke="#00664F"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorActiveMembers)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'combined' && (
          <div>
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold text-slate-700">
                Analitik Komprehensif: Tren Kolektibilitas (Rp) &amp; Kepatuhan (%)
              </span>
              <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00664F]" /> Terkumpul (Rp)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> Kepatuhan (%)
                </span>
              </div>
            </div>

            <div className="w-full h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={val => (val >= 1000000 ? `${(val / 1000000).toFixed(1)}Jt` : val >= 1000 ? `${val / 1000}rb` : val)}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: '#F59E0B' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={val => `${val}%`}
                  />
                  <Tooltip content={<CustomIuranTooltip />} />
                  <Bar
                    yAxisId="left"
                    dataKey="collected"
                    name="Terkumpul"
                    fill="#00664F"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={22}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="complianceRate"
                    name="Tingkat Kepatuhan"
                    stroke="#F59E0B"
                    strokeWidth={2.5}
                    dot={{ fill: '#F59E0B', r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation & Shortcut */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2 text-slate-500 text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Data terintegrasi otomatis dari rekap iuran dan database anggota aktif Supabase.</span>
        </div>

        {onNavigate && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('matrix-12')}
              className="text-emerald-700 hover:text-emerald-900 font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Buka Matrix 12 Bulan</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={() => onNavigate('matrix-tahunan')}
              className="text-amber-700 hover:text-amber-900 font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Rekap Matrix 2025–2031</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardTrendsChart;
