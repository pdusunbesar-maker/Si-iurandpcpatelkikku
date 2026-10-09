import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldAlert,
  Search,
  Filter,
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Clock,
  User,
  History,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  FileText,
  RotateCcw,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Database,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { PatelkiLogo } from '../../components/PatelkiLogo';
import { ActivityLog, ActivityLogCategory, ActivityActionType } from '../../types';
import {
  exportActivityLogsExcel,
  exportActivityLogsPDF,
  exportActivityLogsCSV,
} from '../../utils/exportFinancialReports';

export const ActivityLogs: React.FC = () => {
  const { activityLogs, clearActivityLogs, settings } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');
  const [selectedLogDetail, setSelectedLogDetail] = useState<ActivityLog | null>(null);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      // 1. Search filter
      const matchesSearch =
        searchTerm.trim() === '' ||
        log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.oldValue && log.oldValue.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.newValue && log.newValue.toLowerCase().includes(searchTerm.toLowerCase()));

      // 2. Category filter
      const matchesCategory =
        selectedCategory === 'all' || log.category === selectedCategory;

      // 3. Action type filter
      const matchesAction =
        selectedAction === 'all' || log.action === selectedAction;

      // 4. Time range filter
      let matchesTime = true;
      if (selectedTimeRange !== 'all') {
        const logDate = new Date(log.timestamp).getTime();
        const now = Date.now();
        if (selectedTimeRange === 'today') {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          matchesTime = logDate >= startOfToday.getTime();
        } else if (selectedTimeRange === '7d') {
          matchesTime = now - logDate <= 7 * 24 * 60 * 60 * 1000;
        } else if (selectedTimeRange === '30d') {
          matchesTime = now - logDate <= 30 * 24 * 60 * 60 * 1000;
        }
      }

      return matchesSearch && matchesCategory && matchesAction && matchesTime;
    });
  }, [activityLogs, searchTerm, selectedCategory, selectedAction, selectedTimeRange]);

  // KPI Metrics
  const stats = useMemo(() => {
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayCount = activityLogs.filter(
      l => new Date(l.timestamp).getTime() >= startOfToday.getTime()
    ).length;

    const settingsCount = activityLogs.filter(
      l => l.category === 'settings' || l.category === 'auth' || l.category === 'bank_accounts'
    ).length;

    const financeCount = activityLogs.filter(
      l => l.category === 'transactions' || l.category === 'dues'
    ).length;

    return {
      total: activityLogs.length,
      today: todayCount,
      settings: settingsCount,
      finance: financeCount,
    };
  }, [activityLogs]);

  // Export handlers
  const handleExportExcel = () => {
    try {
      setIsExportingExcel(true);
      const filterDesc = `Kategori: ${selectedCategory}, Aksi: ${selectedAction}, Rentang: ${selectedTimeRange}`;
      exportActivityLogsExcel(filteredLogs, settings, filterDesc);
      setExportSuccessMessage('✓ Berkas Excel Jejak Audit berhasil diunduh.');
      setTimeout(() => setExportSuccessMessage(null), 3500);
    } catch (err) {
      console.error('Error exporting Activity Logs Excel:', err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPDF = () => {
    try {
      setIsExportingPdf(true);
      const filterDesc = `Kategori: ${selectedCategory}, Aksi: ${selectedAction}, Rentang: ${selectedTimeRange}`;
      exportActivityLogsPDF(filteredLogs, settings, filterDesc);
      setExportSuccessMessage('✓ Berkas PDF resmi Jejak Audit berhasil diunduh.');
      setTimeout(() => setExportSuccessMessage(null), 3500);
    } catch (err) {
      console.error('Error exporting Activity Logs PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportCSV = () => {
    try {
      exportActivityLogsCSV(filteredLogs);
      setExportSuccessMessage('✓ Berkas CSV Log Aktivitas berhasil diunduh.');
      setTimeout(() => setExportSuccessMessage(null), 3500);
    } catch (err) {
      console.error('Error exporting Activity Logs CSV:', err);
    }
  };

  // Helper for badges
  const getCategoryBadge = (category: ActivityLogCategory) => {
    switch (category) {
      case 'settings':
        return { label: 'Pengaturan', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'auth':
        return { label: 'Kredensial & Auth', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'transactions':
        return { label: 'Transaksi Kas', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'dues':
        return { label: 'Verifikasi Iuran', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'members':
        return { label: 'Data Anggota', bg: 'bg-cyan-100 text-cyan-800 border-cyan-200' };
      case 'bank_accounts':
        return { label: 'Rekening Bank', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'donations':
        return { label: 'Donasi', bg: 'bg-pink-100 text-pink-800 border-pink-200' };
      case 'social_services':
        return { label: 'Bakti Sosial', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
      default:
        return { label: 'Sistem / Umum', bg: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const getActionBadge = (action: ActivityActionType) => {
    switch (action) {
      case 'create':
        return { label: 'TAMBAH / BUAT', bg: 'bg-emerald-500 text-white' };
      case 'update':
        return { label: 'PERBARUI / UBAH', bg: 'bg-blue-600 text-white' };
      case 'delete':
        return { label: 'HAPUS', bg: 'bg-red-600 text-white' };
      case 'approve':
        return { label: 'DISETUJUI', bg: 'bg-emerald-600 text-white' };
      case 'reject':
        return { label: 'DITOLAK', bg: 'bg-rose-600 text-white' };
      case 'login':
        return { label: 'LOGIN SESI', bg: 'bg-slate-700 text-white' };
      case 'logout':
        return { label: 'LOGOUT', bg: 'bg-slate-500 text-white' };
      default:
        return { label: action.toUpperCase(), bg: 'bg-slate-600 text-white' };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification Banner */}
      {exportSuccessMessage && (
        <div className="no-print p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-bold text-emerald-900 flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-black cursor-pointer text-sm px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-emerald-700 shrink-0" />
              <span>Jejak Audit & Log Aktivitas</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
              {activityLogs.length} Catatan Terekam
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Transparansi penuh pengawasan sistem: melacak siapa yang mengubah parameter, pengaturan, kredensial, dan transaksi kas.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExportingExcel || filteredLogs.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-60"
            title="Download log aktivitas format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExportingExcel ? 'Mengunduh...' : 'Export Excel'}</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-60"
            title="Download log aktivitas format CSV (.csv)"
          >
            <FileText className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          {/* Download PDF */}
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExportingPdf || filteredLogs.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-60"
            title="Download log aktivitas format PDF resmi (.pdf)"
          >
            <Download className="w-4 h-4" />
            <span>{isExportingPdf ? 'Menyiapkan...' : 'Download PDF'}</span>
          </button>

          {/* Print PDF */}
          <button
            type="button"
            onClick={() => window.print()}
            disabled={filteredLogs.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-60"
            title="Cetak langsung dokumen ke printer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen</span>
          </button>

          {/* Clear Logs */}
          <button
            type="button"
            onClick={() => setShowClearConfirmModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
            title="Bersihkan log aktivitas lokal"
          >
            <Trash2 className="w-4 h-4" />
            <span>Bersihkan</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="no-print grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Audit Log</p>
            <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{stats.total}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Semua jejak aktivitas</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <History className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aktivitas Hari Ini</p>
            <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">{stats.today}</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Sesi terkini</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Perubahan Pengaturan</p>
            <p className="text-2xl font-black text-blue-700 mt-1 font-mono">{stats.settings}</p>
            <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Profil, Kredensial & Bank</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transaksi & Iuran</p>
            <p className="text-2xl font-black text-amber-700 mt-1 font-mono">{stats.finance}</p>
            <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Verifikasi & Mutasi Kas</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari aktivitas, nama pelaku, keterangan perubahan, nilai baru/lama..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-end md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tabel Audit
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Timeline Riwayat
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Category Filter */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-bold text-slate-600 shrink-0">Kategori:</span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full bg-transparent font-medium text-slate-800 outline-hidden cursor-pointer"
            >
              <option value="all">Semua Kategori</option>
              <option value="settings">Pengaturan Organisasi</option>
              <option value="auth">Kredensial & Autentikasi</option>
              <option value="bank_accounts">Rekening Bank</option>
              <option value="transactions">Transaksi Kas (Masuk/Keluar)</option>
              <option value="dues">Iuran & Verifikasi</option>
              <option value="members">Data Anggota</option>
              <option value="donations">Donasi</option>
              <option value="social_services">Bakti Sosial</option>
              <option value="general">Sistem & Audit</option>
            </select>
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-bold text-slate-600 shrink-0">Aksi:</span>
            <select
              value={selectedAction}
              onChange={e => setSelectedAction(e.target.value)}
              className="w-full bg-transparent font-medium text-slate-800 outline-hidden cursor-pointer"
            >
              <option value="all">Semua Tipe Aksi</option>
              <option value="create">Tambah / Buat (Create)</option>
              <option value="update">Perbarui / Ubah (Update)</option>
              <option value="delete">Hapus (Delete)</option>
              <option value="approve">Setujui (Approve)</option>
              <option value="reject">Tolak (Reject)</option>
              <option value="login">Login Sesi</option>
              <option value="audit">Pemeriksaan Audit</option>
            </select>
          </div>

          {/* Time Range Filter */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-bold text-slate-600 shrink-0">Periode:</span>
            <select
              value={selectedTimeRange}
              onChange={e => setSelectedTimeRange(e.target.value)}
              className="w-full bg-transparent font-medium text-slate-800 outline-hidden cursor-pointer"
            >
              <option value="all">Semua Waktu</option>
              <option value="today">Hari Ini Saja</option>
              <option value="7d">7 Hari Terakhir</option>
              <option value="30d">30 Hari Terakhir</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content View (Table or Timeline) */}
      {filteredLogs.length === 0 ? (
        <div className="no-print bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Tidak ada log aktivitas ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Tidak ada catatan jejak audit yang sesuai dengan kata kunci atau filter yang Anda pilih. Coba sesuaikan filter pencarian.
          </p>
          {(searchTerm || selectedCategory !== 'all' || selectedAction !== 'all' || selectedTimeRange !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedAction('all');
                setSelectedTimeRange('all');
              }}
              className="mt-2 px-4 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold cursor-pointer transition-all"
            >
              Reset Semua Filter
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="no-print bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5 text-center w-12">No</th>
                  <th className="p-3.5 w-44">Waktu & Tanggal</th>
                  <th className="p-3.5 w-44">Pelaku / Aktor</th>
                  <th className="p-3.5 w-32">Kategori</th>
                  <th className="p-3.5 w-28 text-center">Aksi</th>
                  <th className="p-3.5">Ringkasan & Detail Perubahan</th>
                  <th className="p-3.5 text-center w-20">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log, idx) => {
                  const catBadge = getCategoryBadge(log.category);
                  const actBadge = getActionBadge(log.action);
                  const logDate = new Date(log.timestamp);

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      onClick={() => setSelectedLogDetail(log)}
                    >
                      <td className="p-3.5 text-center font-mono text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-600">
                        <div className="font-bold text-slate-800">
                          {logDate.toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-slate-400">
                          {logDate.toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })} WIB
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px]">{log.actorName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                          Peran: {log.actorRole}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md border ${catBadge.bg}`}
                        >
                          {catBadge.label}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-black rounded-md shadow-2xs ${actBadge.bg}`}
                        >
                          {actBadge.label}
                        </span>
                      </td>
                      <td className="p-3.5 space-y-1">
                        <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {log.title}
                        </div>
                        <div className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {log.description}
                        </div>
                        {(log.oldValue || log.newValue) && (
                          <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                            {log.oldValue && (
                              <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 line-through">
                                Lama: {log.oldValue}
                              </span>
                            )}
                            {log.oldValue && log.newValue && (
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                            )}
                            {log.newValue && (
                              <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                                Baru: {log.newValue}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-center" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedLogDetail(log)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Lihat Rincian Lengkap"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TIMELINE VIEW */
        <div className="no-print space-y-3">
          {filteredLogs.map((log, idx) => {
            const catBadge = getCategoryBadge(log.category);
            const actBadge = getActionBadge(log.action);
            const logDate = new Date(log.timestamp);

            return (
              <div
                key={log.id}
                onClick={() => setSelectedLogDetail(log)}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row gap-4 items-start justify-between"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 mt-0.5">
                    <History className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${catBadge.bg}`}>
                        {catBadge.label}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-black rounded-md ${actBadge.bg}`}>
                        {actBadge.label}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {logDate.toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })} WIB
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-900">{log.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{log.description}</p>

                    {(log.oldValue || log.newValue) && (
                      <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px]">
                        {log.oldValue && (
                          <div className="px-2 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
                            <span className="font-bold text-[10px] block text-rose-600 uppercase">Sebelumnya:</span>
                            <span className="line-through">{log.oldValue}</span>
                          </div>
                        )}
                        {log.newValue && (
                          <div className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="font-bold text-[10px] block text-emerald-600 uppercase">Nilai Baru:</span>
                            <span>{log.newValue}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="sm:text-right shrink-0 self-end sm:self-auto text-xs text-slate-500 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {log.actorName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {log.actorRole.toUpperCase()} {log.ipAddress ? `• ${log.ipAddress}` : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedLogDetail && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Rincian Jejak Audit</h3>
                  <p className="text-[11px] font-mono text-slate-400">{selectedLogDetail.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLogDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-black cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Aktivitas</span>
                  <span className={`px-2 py-0.5 text-[10px] font-black rounded-md ${getActionBadge(selectedLogDetail.action).bg}`}>
                    {getActionBadge(selectedLogDetail.action).label}
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-900">{selectedLogDetail.title}</h4>
                <p className="text-slate-600 leading-relaxed">{selectedLogDetail.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Pelaku (Aktor)</span>
                  <p className="font-black text-slate-800 mt-0.5">{selectedLogDetail.actorName}</p>
                  <p className="text-[10px] text-slate-500">Peran: {selectedLogDetail.actorRole.toUpperCase()}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Waktu Tercatat</span>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">
                    {new Date(selectedLogDetail.timestamp).toLocaleTimeString('id-ID')} WIB
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {new Date(selectedLogDetail.timestamp).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Old vs New Value Comparison */}
              {(selectedLogDetail.oldValue || selectedLogDetail.newValue) && (
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Perbandingan Perubahan Nilai
                  </span>
                  {selectedLogDetail.oldValue && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                      <span className="text-[10px] font-bold text-rose-700 uppercase block">Nilai Sebelumnya:</span>
                      <p className="font-mono text-rose-900 mt-0.5">{selectedLogDetail.oldValue}</p>
                    </div>
                  )}
                  {selectedLogDetail.newValue && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase block">Nilai Baru / Sesudah:</span>
                      <p className="font-mono text-emerald-900 mt-0.5 font-bold">{selectedLogDetail.newValue}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedLogDetail.ipAddress && (
                <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-1">
                  <span>Alamat IP / Lingkungan:</span>
                  <span>{selectedLogDetail.ipAddress}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLogDetail(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR LOGS CONFIRMATION MODAL */}
      {showClearConfirmModal && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-black text-slate-900 text-base">Bersihkan Semua Jejak Log?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tindakan ini akan mengosongkan riwayat jejak audit di penyimpanan browser lokal. Data histori penting untuk akuntabilitas organisasi.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  clearActivityLogs();
                  setShowClearConfirmModal(false);
                  setExportSuccessMessage('✓ Log aktivitas berhasil dibersihkan.');
                  setTimeout(() => setExportSuccessMessage(null), 3000);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-all shadow-md shadow-rose-600/20"
              >
                Ya, Bersihkan Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY OFFICIAL AUDIT REPORT DOCUMENT (window.print()) */}
      <div id="report-document" className="hidden p-8 bg-white text-slate-900 font-sans">
        {/* Kop Surat Resmi */}
        <div className="flex items-center gap-4 pb-4 border-b-4 border-double border-slate-900 mb-6">
          <PatelkiLogo className="w-20 h-20 shrink-0" />
          <div className="text-center flex-1">
            <h3 className="text-xs font-black tracking-widest text-slate-800 uppercase">
              PERSATUAN AHLI TEKNOLOGI LABORATORIUM MEDIK INDONESIA (PATELKI)
            </h3>
            <h1 className="text-lg font-black text-slate-950 tracking-tight">
              DEWAN PENGURUS CABANG KABUPATEN KAYONG UTARA
            </h1>
            <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
              Sekretariat: {settings.address || 'Kabupaten Kayong Utara, Kalimantan Barat'} • WA: {settings.contactWa || '-'} • Email: {settings.contactEmail || '-'}
            </p>
          </div>
        </div>

        {/* Title */}
        <div className="my-6 text-center">
          <h2 className="text-base font-black tracking-wider text-slate-900 uppercase">
            LAPORAN JEJAK AUDIT & LOG AKTIVITAS SISTEM
          </h2>
          <p className="text-xs font-bold text-amber-700 mt-0.5 uppercase tracking-wider">
            DPC PATELKI KABUPATEN KAYONG UTARA • PERIODE 2025–2031
          </p>
        </div>

        {/* Info Box */}
        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
          <span><strong>Total Rekaman:</strong> {filteredLogs.length} Aktivitas</span>
          <span><strong>Tanggal Cetak:</strong> {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span><strong>Kategori:</strong> {selectedCategory.toUpperCase()}</span>
          <span><strong>Integritas:</strong> Terverifikasi & Otentik</span>
        </div>

        {/* Audit Table */}
        <table className="w-full text-left text-xs border border-slate-300 border-collapse mb-6">
          <thead className="bg-slate-100 font-bold text-slate-900 text-[11px]">
            <tr className="border-b border-slate-300">
              <th className="p-2 text-center border-r border-slate-300 w-10">No</th>
              <th className="p-2 border-r border-slate-300 w-32">Waktu</th>
              <th className="p-2 border-r border-slate-300 w-36">Pelaku / Aktor</th>
              <th className="p-2 border-r border-slate-300 w-24">Kategori</th>
              <th className="p-2 border-r border-slate-300 w-20 text-center">Aksi</th>
              <th className="p-2 border-r border-slate-300">Ringkasan Aktivitas</th>
              <th className="p-2">Keterangan / Nilai Baru</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredLogs.map((log, idx) => (
              <tr key={log.id} className="border-b border-slate-200">
                <td className="p-2 text-center border-r border-slate-200">{idx + 1}</td>
                <td className="p-2 font-mono text-[10px] border-r border-slate-200">
                  {new Date(log.timestamp).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="p-2 font-bold border-r border-slate-200">
                  {log.actorName}
                  <span className="block font-normal text-[9px] text-slate-500 uppercase">({log.actorRole})</span>
                </td>
                <td className="p-2 uppercase text-[10px] font-bold border-r border-slate-200">{log.category}</td>
                <td className="p-2 text-center font-black text-[10px] border-r border-slate-200">{log.action.toUpperCase()}</td>
                <td className="p-2 font-bold border-r border-slate-200">{log.title}</td>
                <td className="p-2 text-[11px]">
                  {log.description}
                  {log.newValue && <span className="block font-bold text-emerald-800 mt-0.5">Nilai: {log.newValue}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Signatures */}
        <div className="flex justify-between items-start mt-8 text-xs pt-4">
          <div className="text-center w-64">
            <p>Mengetahui,</p>
            <p className="font-bold">Ketua DPC PATELKI Kayong Utara</p>
            <div className="h-16"></div>
            <p className="font-black underline">{settings.ketuaName || '( ..................................................... )'}</p>
            <p className="text-[10px] text-slate-500 font-mono">NAP: {settings.ketuaNap || '-'}</p>
          </div>

          <div className="text-center w-64">
            <p>Sukadana, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p>Dibuat Oleh,</p>
            <p className="font-bold">Bendahara DPC PATELKI Kayong Utara</p>
            <div className="h-16"></div>
            <p className="font-black underline">{settings.bendaharaName || '( ..................................................... )'}</p>
            <p className="text-[10px] text-slate-500 font-mono">NAP: {settings.bendaharaNap || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;
