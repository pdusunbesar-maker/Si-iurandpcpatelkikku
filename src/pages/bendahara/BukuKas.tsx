import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CashTransaction } from '../../types';
import * as XLSX from 'xlsx';
import {
  BookOpen,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  FileSpreadsheet,
  Printer,
  PlusCircle,
  Trash2,
  Calendar,
  Wallet,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

export const BukuKas: React.FC = () => {
  const {
    transactions,
    addTransaction,
    deleteTransaction,
    getCashBalance,
    getTotalIncome,
    getTotalExpense,
    settings,
    formatCurrency,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // New Transaction Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTx, setNewTx] = useState<{
    date: string;
    type: 'income' | 'expense';
    category: string;
    sourceOrRecipient: string;
    amount: number | '';
    description: string;
    proofUrl: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    type: 'income',
    category: settings.categoriesIncome[0] || 'Iuran Wajib Anggota',
    sourceOrRecipient: '',
    amount: '',
    description: '',
    proofUrl: '',
  });

  const cashBalance = getCashBalance();
  const totalIncome = getTotalIncome();
  const totalExpense = getTotalExpense();

  // Sort transactions chronologically ascending for calculating running balances
  const sortedTransactionsAsc = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let running = 0;
  const transactionsWithBalance = sortedTransactionsAsc.map(t => {
    if (t.type === 'income') {
      running += t.amount;
    } else {
      running -= t.amount;
    }
    return { ...t, runningBalance: running };
  });

  // Then display descending (newest first)
  const displayTransactions = [...transactionsWithBalance]
    .reverse()
    .filter(t => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      const q = searchQuery.toLowerCase();
      return (
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.sourceOrRecipient.toLowerCase().includes(q)
      );
    });

  const handleCreateTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.amount || Number(newTx.amount) <= 0) {
      alert('Masukkan nominal transaksi yang valid!');
      return;
    }

    addTransaction({
      date: newTx.date,
      type: newTx.type,
      category: newTx.category,
      sourceOrRecipient: newTx.sourceOrRecipient || (newTx.type === 'income' ? 'Penyetor' : 'Penerima'),
      amount: Number(newTx.amount),
      description: newTx.description,
      proofUrl: newTx.proofUrl || undefined,
      recordedBy: settings.bendaharaName,
    });

    setShowAddModal(false);
    setNewTx({
      date: new Date().toISOString().split('T')[0],
      type: 'income',
      category: settings.categoriesIncome[0] || 'Iuran Wajib Anggota',
      sourceOrRecipient: '',
      amount: '',
      description: '',
      proofUrl: '',
    });
  };

  const handleExportExcel = () => {
    const exportData = displayTransactions.map((t, idx) => ({
      No: idx + 1,
      Tanggal: t.date,
      Kategori: t.category,
      Keterangan: t.description,
      'Sumber / Penerima': t.sourceOrRecipient,
      'Kas Masuk (Rp)': t.type === 'income' ? t.amount : 0,
      'Kas Keluar (Rp)': t.type === 'expense' ? t.amount : 0,
      'Saldo Kas (Rp)': t.runningBalance,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Buku_Kas_Utama');
    XLSX.writeFile(workbook, `Buku_Kas_Patelki_Kayong_Utara_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Buku Kas Utama DPC
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
              Saldo Otomatis
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pencatatan pembukuan kas masuk, pengeluaran organisasi, donasi, dan saldo berjalan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold transition-colors shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Catat Transaksi Baru
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            <Printer className="w-4 h-4" />
            Cetak
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-xl flex items-center justify-between border border-slate-800">
          <div>
            <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              Saldo Kas Saat Ini
            </p>
            <p className="text-2xl sm:text-3xl font-black font-mono mt-1 text-white">
              {formatCurrency(cashBalance)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Status: Seimbang (Real-time)</p>
          </div>
          <div className="p-3 bg-amber-400 text-slate-950 rounded-2xl">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Kas Masuk
            </p>
            <p className="text-2xl font-black font-mono mt-1 text-emerald-700">
              {formatCurrency(totalIncome)}
            </p>
            <p className="text-[11px] text-emerald-600 mt-1 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Dari Iuran, Donasi & Hibah
            </p>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Pengeluaran
            </p>
            <p className="text-2xl font-black font-mono mt-1 text-red-600">
              {formatCurrency(totalExpense)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> Operasional & Bakti Sosial
            </p>
          </div>
          <div className="p-3 bg-red-100 text-red-700 rounded-2xl">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari transaksi / keterangan..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:border-amber-500 outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </div>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 outline-hidden font-medium"
          >
            <option value="all">Semua Jenis Transaksi</option>
            <option value="income">🟢 Hanya Kas Masuk</option>
            <option value="expense">🔴 Hanya Kas Keluar</option>
          </select>
        </div>
      </div>

      {/* Cashbook Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 text-white font-black uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-4 px-4 w-24">Tanggal</th>
                <th className="py-4 px-4">Kategori & Keterangan</th>
                <th className="py-4 px-4">Sumber / Penerima</th>
                <th className="py-4 px-4 text-right text-emerald-400">Masuk</th>
                <th className="py-4 px-4 text-right text-red-400">Keluar</th>
                <th className="py-4 px-4 text-right text-amber-300">Saldo Kas</th>
                <th className="py-4 px-3 text-center no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada catatan transaksi kas yang sesuai.
                  </td>
                </tr>
              ) : (
                displayTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-600 whitespace-nowrap">
                      {t.date}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            t.type === 'income'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {t.category}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900 mt-1 leading-snug">{t.description}</p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {t.sourceOrRecipient}
                    </td>

                    {/* Income */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                      {t.type === 'income' ? formatCurrency(t.amount) : '—'}
                    </td>

                    {/* Expense */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-red-600">
                      {t.type === 'expense' ? formatCurrency(t.amount) : '—'}
                    </td>

                    {/* Running Balance */}
                    <td className="py-3.5 px-4 text-right font-mono font-black text-slate-950 text-sm bg-slate-50/50">
                      {formatCurrency(t.runningBalance)}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-3 text-center no-print">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Hapus transaksi ini dari buku kas?')) {
                            deleteTransaction(t.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                        title="Hapus Transaksi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="font-black text-base text-slate-900">Catat Transaksi Kas Baru</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Setiap catatan otomatis memperbarui saldo kas DPC.
            </p>

            <form onSubmit={handleCreateTx} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Transaksi *
                  </label>
                  <select
                    value={newTx.type}
                    onChange={e => {
                      const type = e.target.value as 'income' | 'expense';
                      setNewTx({
                        ...newTx,
                        type,
                        category: type === 'income' ? settings.categoriesIncome[0] : settings.categoriesExpense[0],
                      });
                    }}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold outline-hidden bg-white"
                  >
                    <option value="income">🟢 Kas Masuk (Penerimaan)</option>
                    <option value="expense">🔴 Kas Keluar (Pengeluaran)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal *</label>
                  <input
                    type="date"
                    required
                    value={newTx.date}
                    onChange={e => setNewTx({ ...newTx, date: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori *</label>
                  <select
                    value={newTx.category}
                    onChange={e => setNewTx({ ...newTx, category: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden bg-white"
                  >
                    {newTx.type === 'income'
                      ? settings.categoriesIncome.map(c => <option key={c} value={c}>{c}</option>)
                      : settings.categoriesExpense.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nominal (Rp) *</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={1000}
                    value={newTx.amount}
                    onChange={e => setNewTx({ ...newTx, amount: e.target.value ? Number(e.target.value) : '' })}
                    placeholder="Contoh: 250000"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {newTx.type === 'income' ? 'Sumber Dana / Penyetor' : 'Penerima / Toko / Vendor'}
                </label>
                <input
                  type="text"
                  required
                  value={newTx.sourceOrRecipient}
                  onChange={e => setNewTx({ ...newTx, sourceOrRecipient: e.target.value })}
                  placeholder={newTx.type === 'income' ? 'Contoh: Iuran Anggota / Hamba Allah' : 'Contoh: Toko Buku / RM Bahari'}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan Transaksi *</label>
                <textarea
                  rows={2}
                  required
                  value={newTx.description}
                  onChange={e => setNewTx({ ...newTx, description: e.target.value })}
                  placeholder="Keterangan lengkap..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-xs"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BukuKas;
