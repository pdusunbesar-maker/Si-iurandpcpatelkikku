import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CashTransaction } from '../../types';
import * as XLSX from 'xlsx';
import {
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  Search,
  FileSpreadsheet,
  Printer,
  Trash2,
  Calendar,
  Filter,
} from 'lucide-react';

interface KasTransactionPageProps {
  type: 'income' | 'expense';
}

export const KasTransactionPage: React.FC<KasTransactionPageProps> = ({ type }) => {
  const {
    transactions,
    addTransaction,
    deleteTransaction,
    settings,
    formatCurrency,
  } = useApp();

  const isIncome = type === 'income';
  const pageTitle = isIncome ? 'Kas Pemasukan DPC' : 'Pengeluaran Kas DPC';
  const pageSubtitle = isIncome
    ? 'Catatan penerimaan iuran anggota, donasi, sponsor, dan bantuan kegiatan.'
    : 'Catatan biaya operasional organisasi, ATK, transportasi, konsumsi rapat, dan bakti sosial.';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const categories = isIncome ? settings.categoriesIncome : settings.categoriesExpense;

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: categories[0] || 'Lainnya',
    sourceOrRecipient: '',
    amount: 0,
    description: '',
    proofUrl: '',
  });

  const filteredTransactions = transactions.filter(t => {
    if (t.type !== type) return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    const q = searchQuery.toLowerCase();
    return (
      t.description.toLowerCase().includes(q) ||
      t.sourceOrRecipient.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  });

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) {
      alert('Nominal wajib diisi!');
      return;
    }

    addTransaction({
      date: formData.date,
      type,
      category: formData.category,
      sourceOrRecipient: formData.sourceOrRecipient || (isIncome ? 'Penyetor' : 'Penerima'),
      amount: Number(formData.amount),
      description: formData.description,
      proofUrl: formData.proofUrl || undefined,
      recordedBy: settings.bendaharaName,
    });

    setShowAddModal(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: categories[0] || 'Lainnya',
      sourceOrRecipient: '',
      amount: 100000,
      description: '',
      proofUrl: '',
    });
  };

  const handleExportExcel = () => {
    const exportData = filteredTransactions.map((t, idx) => ({
      No: idx + 1,
      Tanggal: t.date,
      Kategori: t.category,
      Keterangan: t.description,
      [isIncome ? 'Sumber Dana' : 'Penerima']: t.sourceOrRecipient,
      'Nominal (Rp)': t.amount,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, isIncome ? 'Kas_Masuk' : 'Pengeluaran');
    XLSX.writeFile(workbook, `${isIncome ? 'Kas_Masuk' : 'Pengeluaran'}_Patelki_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {pageTitle}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                isIncome ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {filteredTransactions.length} Transaksi
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{pageSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-xs transition-colors cursor-pointer ${
              isIncome
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            {isIncome ? 'Catat Kas Masuk' : 'Catat Pengeluaran'}
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
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

      {/* KPI Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total {isIncome ? 'Pemasukan Kas' : 'Pengeluaran Kas'}
          </p>
          <p
            className={`text-2xl sm:text-3xl font-black font-mono mt-1 ${
              isIncome ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            {formatCurrency(totalAmount)}
          </p>
        </div>
        <div
          className={`p-3.5 rounded-2xl ${
            isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {isIncome ? <ArrowDownLeft className="w-7 h-7" /> : <ArrowUpRight className="w-7 h-7" />}
        </div>
      </div>

      {/* Filter and Search */}
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

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium outline-hidden"
          >
            <option value="all">Semua Kategori</option>
            {categories.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 text-white font-black uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-4 px-4 w-28">Tanggal</th>
                <th className="py-4 px-4">Kategori & Keterangan</th>
                <th className="py-4 px-4">{isIncome ? 'Sumber Dana' : 'Penerima / Vendor'}</th>
                <th className="py-4 px-4 text-right">Nominal</th>
                <th className="py-4 px-3 text-center no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Tidak ada catatan transaksi.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-600 whitespace-nowrap">
                      {t.date}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          isIncome
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {t.category}
                      </span>
                      <p className="font-semibold text-slate-900 mt-1 leading-snug">{t.description}</p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {t.sourceOrRecipient}
                    </td>

                    <td
                      className={`py-3.5 px-4 text-right font-mono font-black text-sm ${
                        isIncome ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(t.amount)}
                    </td>

                    <td className="py-3.5 px-3 text-center no-print">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Hapus transaksi ini?')) {
                            deleteTransaction(t.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="font-black text-base text-slate-900">
              {isIncome ? 'Catat Kas Masuk Baru' : 'Catat Pengeluaran Kas Baru'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Transaksi akan otomatis tersimpan dalam Buku Kas DPC.
            </p>

            <form onSubmit={handleCreate} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nominal (Rp) *</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={1000}
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori *</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-hidden bg-white"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isIncome ? 'Sumber Dana / Penyetor *' : 'Penerima / Toko / Vendor *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.sourceOrRecipient}
                  onChange={e => setFormData({ ...formData, sourceOrRecipient: e.target.value })}
                  placeholder={isIncome ? 'Contoh: Iuran / Bantuan Sponsor' : 'Contoh: Toko Buku / RM Bahari'}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan Lengkap *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Keterangan transaksi..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white font-extrabold rounded-xl shadow-xs ${
                    isIncome ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
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

export default KasTransactionPage;
