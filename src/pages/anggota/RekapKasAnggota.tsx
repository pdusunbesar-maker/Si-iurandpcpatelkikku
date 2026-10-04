import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import * as XLSX from 'xlsx';
import { PatelkiLogo } from '../../components/PatelkiLogo';
import {
  BookOpen,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Search,
  Filter,
  TrendingUp,
  PieChart,
  Info,
  Building,
  CreditCard,
  User,
} from 'lucide-react';

interface RekapKasAnggotaProps {
  onNavigate?: (page: string) => void;
}

export const RekapKasAnggota: React.FC<RekapKasAnggotaProps> = ({ onNavigate }) => {
  const {
    transactions,
    currentMember,
    duesRecords,
    settings,
    getCashBalance,
    getTotalIncome,
    getTotalExpense,
    formatCurrency,
  } = useApp();

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate my personal dues paid contribution
  const myPaidDuesTotal = duesRecords
    .filter(d => d.memberId === currentMember?.id && d.status === 'paid')
    .reduce((sum, d) => sum + d.amount, 0);

  // Overall cash balance
  const totalBalance = getCashBalance();
  const totalAllIncome = getTotalIncome();
  const totalAllExpense = getTotalExpense();

  // Filtered transactions
  const filteredTransactions = transactions.filter(t => {
    const txYear = new Date(t.date).getFullYear();
    const matchYear = selectedYear === 0 || txYear === selectedYear;
    const matchType = selectedType === 'all' || t.type === selectedType;
    const matchCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchSearch =
      searchQuery === '' ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.sourceOrRecipient && t.sourceOrRecipient.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchYear && matchType && matchCategory && matchSearch;
  });

  // Calculate category breakdowns for expenses in selected year
  const yearExpenses = transactions.filter(
    t => t.type === 'expense' && (selectedYear === 0 || new Date(t.date).getFullYear() === selectedYear)
  );
  const totalYearExpense = yearExpenses.reduce((sum, t) => sum + t.amount, 0);

  const categoryExpenseMap: { [cat: string]: number } = {};
  yearExpenses.forEach(t => {
    categoryExpenseMap[t.category] = (categoryExpenseMap[t.category] || 0) + t.amount;
  });

  const categoriesSorted = Object.entries(categoryExpenseMap).sort((a, b) => b[1] - a[1]);

  // Unique categories list for filter
  const allCategories = Array.from(new Set(transactions.map(t => t.category)));

  // Handlers
  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const summaryData = [
      { Keterangan: 'Organisasi', Nilai: settings.organizationName },
      { Keterangan: 'Cabang / DPC', Nilai: settings.branchName },
      { Keterangan: 'Tahun Pembukuan', Nilai: selectedYear === 0 ? 'Semua Tahun' : selectedYear },
      { Keterangan: 'Total Saldo Kas Berjalan', Nilai: totalBalance },
      { Keterangan: 'Total Pemasukan Kas', Nilai: totalAllIncome },
      { Keterangan: 'Total Pengeluaran Kas', Nilai: totalAllExpense },
      { Keterangan: 'Nama Anggota yang Mengunduh', Nilai: `${currentMember?.nama || ''} (${currentMember?.nap || ''})` },
    ];

    const detailData = filteredTransactions.map((t, idx) => ({
      No: idx + 1,
      Tanggal: t.date,
      Arus: t.type === 'income' ? 'Kas Masuk' : 'Kas Keluar',
      Kategori: t.category,
      Keterangan: t.description,
      'Pihak / Sumber': t.sourceOrRecipient || '-',
      'Nominal (Rp)': t.amount,
      Pencatat: t.recordedBy || 'Bendahara DPC',
    }));

    const workbook = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    const wsDetail = XLSX.utils.json_to_sheet(detailData);

    XLSX.utils.book_append_sheet(workbook, wsSummary, 'Ringkasan');
    XLSX.utils.book_append_sheet(workbook, wsDetail, 'Detail_Kas');
    XLSX.writeFile(workbook, `Rekap_Keuangan_Kas_Patelki_${selectedYear || 'Semua'}.xlsx`);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Page Header (Hidden on Print) */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Rekap Keuangan Kas Organisasi
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Transparansi Terbuka
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Transparansi arus penerimaan iuran, donasi, dan penggunaan kas DPC PATELKI Kabupaten Kayong Utara.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Unduh Excel (XLSX)
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Rekap
          </button>
        </div>
      </div>

      {/* Official Print Header (Only visible on Print) */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PatelkiLogo className="w-16 h-16" />
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                {settings.organizationName}
              </h2>
              <h3 className="text-sm font-extrabold text-slate-800">
                {settings.branchName}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                {settings.address}
              </p>
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-500">
            <p className="font-bold text-slate-800">DOKUMEN TRANSPARANSI ANGGOTA</p>
            <p>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
            <p>Anggota: {currentMember?.nama} ({currentMember?.nap})</p>
          </div>
        </div>
      </div>

      {/* Personal Contribution & Cash Overview Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 no-print">
        {/* Total Saldo Kas */}
        <div className="p-6 rounded-3xl bg-linear-to-br from-emerald-800 to-slate-900 text-white shadow-lg border border-emerald-700/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-amber-400" />
                Saldo Kas DPC Saat Ini
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                Kas Riil Aktif
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black mt-3 font-mono tracking-tight text-white">
              {formatCurrency(totalBalance)}
            </h3>
            <p className="text-xs text-emerald-100/80 mt-1">
              Tersimpan aman di Rekening Bank Kalbar, BRI, dan Kas Tunai Bendahara.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-emerald-700/40 flex items-center justify-between text-xs text-emerald-200">
            <span>Kas Masuk: <strong className="text-emerald-300">{formatCurrency(totalAllIncome)}</strong></span>
            <span>Kas Keluar: <strong className="text-amber-300">{formatCurrency(totalAllExpense)}</strong></span>
          </div>
        </div>

        {/* Total Kontribusi Saya */}
        <div className="p-6 rounded-3xl bg-linear-to-br from-amber-500 to-amber-600 text-slate-950 shadow-lg border border-amber-400 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4" />
                Kontribusi Iuran Anda
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-950/15 text-slate-950 text-[10px] font-black">
                NAP: {currentMember?.nap}
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black mt-3 font-mono tracking-tight text-slate-950">
              {formatCurrency(myPaidDuesTotal)}
            </h3>
            <p className="text-xs text-slate-900/80 mt-1 leading-relaxed">
              Total dana iuran yang telah Anda setorkan dan terverifikasi di kas DPC Patelki.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-950/20 flex items-center justify-between text-xs font-bold text-slate-900">
            <span>Status Keanggotaan: Aktif</span>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('riwayat-saya')}
                className="underline hover:text-slate-950 text-xs font-black cursor-pointer"
              >
                Lihat Kuitansi Saya →
              </button>
            )}
          </div>
        </div>

        {/* Ringkasan Akuntabilitas & Pejabat DPC */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-4 h-4 text-emerald-600" />
                Pengelola Kas DPC
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                Periode 2025–2031
              </span>
            </div>
            <div className="mt-3 space-y-2">
              <div>
                <p className="text-[11px] text-slate-500">Ketua DPC:</p>
                <p className="text-xs font-bold text-slate-900">{settings.ketuaName}</p>
                <p className="text-[10px] text-slate-400 font-mono">NAP: {settings.ketuaNap}</p>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] text-slate-500">Bendahara DPC:</p>
                <p className="text-xs font-bold text-slate-900">{settings.bendaharaName}</p>
                <p className="text-[10px] text-slate-400 font-mono">NAP: {settings.bendaharaNap}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-slate-100 flex items-center gap-1 text-[11px] text-emerald-800 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            Audit Terbuka untuk seluruh anggota terdaftar
          </div>
        </div>
      </div>

      {/* Expense Allocation Breakdown for Members */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-amber-500" />
              Alokasi Penggunaan Dana Kas ({selectedYear === 0 ? 'Semua Periode' : `Tahun ${selectedYear}`})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Rincian persentase ke mana dana kas organisasi dialokasikan untuk kepentingan profesi dan sosial.
            </p>
          </div>
          <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            Total Belanja: {formatCurrency(totalYearExpense)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categoriesSorted.length === 0 ? (
            <div className="col-span-3 text-center py-6 text-xs text-slate-400">
              Tidak ada data pengeluaran pada tahun ini.
            </div>
          ) : (
            categoriesSorted.map(([category, amount]) => {
              const percentage = totalYearExpense > 0 ? ((amount / totalYearExpense) * 100).toFixed(1) : '0';
              return (
                <div
                  key={category}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 truncate max-w-[170px]" title={category}>
                      {category}
                    </span>
                    <span className="font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md text-[10px]">
                      {percentage}%
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 text-[11px]">Realisasi:</span>
                    <span className="font-extrabold text-slate-900">{formatCurrency(amount)}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Filter and Search Bar (Hidden on Print) */}
      <div className="no-print bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari transaksi kas, keterangan, atau pihak terkait..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-amber-500 outline-hidden bg-slate-50 font-medium"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Year Filter */}
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 outline-hidden focus:border-amber-500 cursor-pointer"
          >
            <option value={2026}>Tahun 2026</option>
            <option value={2025}>Tahun 2025</option>
            <option value={0}>Semua Tahun</option>
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value as any)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 outline-hidden focus:border-amber-500 cursor-pointer"
          >
            <option value="all">Semua Arus Kas</option>
            <option value="income">🟢 Kas Masuk (Pemasukan)</option>
            <option value="expense">🔴 Kas Keluar (Pengeluaran)</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 outline-hidden focus:border-amber-500 cursor-pointer max-w-[170px]"
          >
            <option value="all">Semua Kategori</option>
            {allCategories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cash Journal Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              Jurnal Rekapitulasi Kas Transparan
            </h3>
            <p className="text-[11px] text-slate-500">
              Menampilkan {filteredTransactions.length} transaksi pembukuan kas.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-xl border border-slate-200">
            Tahun: {selectedYear === 0 ? 'Semua' : selectedYear}
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-slate-100/90 text-slate-900 uppercase font-black tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4">Kategori & Keterangan</th>
                <th className="py-3.5 px-4">Pihak / Sumber</th>
                <th className="py-3.5 px-4 text-center">Arus</th>
                <th className="py-3.5 px-4 text-right">Kas Masuk (Rp)</th>
                <th className="py-3.5 px-4 text-right">Kas Keluar (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada transaksi kas yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                      {new Date(t.date).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{t.category}</span>
                      <span className="text-[11px] text-slate-600 leading-snug">{t.description}</span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">
                      {t.sourceOrRecipient || '-'}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.type === 'income'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                        }`}
                      >
                        {t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                    </td>

                    {/* Income Column */}
                    <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                      {t.type === 'income' ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          +{formatCurrency(t.amount)}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Expense Column */}
                    <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                      {t.type === 'expense' ? (
                        <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded-md">
                          -{formatCurrency(t.amount)}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Table Footer Totals */}
            <tfoot className="bg-slate-50 font-black text-xs border-t-2 border-slate-200">
              <tr>
                <td colSpan={5} className="py-3.5 px-4 text-right text-slate-700 uppercase">
                  Total Pada Tampilan Ini:
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-emerald-800">
                  +{formatCurrency(
                    filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
                  )}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-red-800">
                  -{formatCurrency(
                    filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Signature Section on Print */}
      <div className="hidden print:grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-300 text-center text-xs">
        <div>
          <p className="text-slate-600">Mengetahui,</p>
          <p className="font-extrabold mt-0.5">Ketua DPC PATELKI Kayong Utara</p>
          <div className="h-16 flex items-center justify-center">
            <span className="text-[10px] text-slate-400 italic">[Tanda Tangan & Stempel Resmi]</span>
          </div>
          <p className="font-bold underline text-slate-900">{settings.ketuaName}</p>
          <p className="text-[10px] font-mono text-slate-500">NAP: {settings.ketuaNap}</p>
        </div>

        <div>
          <p className="text-slate-600">Sukadana, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
          <p className="font-extrabold mt-0.5">Bendahara DPC PATELKI Kayong Utara</p>
          <div className="h-16 flex items-center justify-center">
            <span className="text-[10px] text-slate-400 italic">[Tanda Tangan & Stempel Resmi]</span>
          </div>
          <p className="font-bold underline text-slate-900">{settings.bendaharaName}</p>
          <p className="text-[10px] font-mono text-slate-500">NAP: {settings.bendaharaNap}</p>
        </div>
      </div>
    </div>
  );
};

export default RekapKasAnggota;
