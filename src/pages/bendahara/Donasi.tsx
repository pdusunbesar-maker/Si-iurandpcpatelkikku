import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Donation } from '../../types';
import * as XLSX from 'xlsx';
import {
  Heart,
  PlusCircle,
  Search,
  FileSpreadsheet,
  Printer,
  Trash2,
  Phone,
  Calendar,
  Wallet,
  CheckCircle2,
} from 'lucide-react';

export const Donasi: React.FC = () => {
  const { donations, addDonation, deleteDonation, formatCurrency } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDonation, setNewDonation] = useState<Omit<Donation, 'id' | 'createdAt'>>({
    date: new Date().toISOString().split('T')[0],
    donorName: '',
    donorContact: '',
    amount: 500000,
    type: 'uang',
    purpose: 'Kas Operasional & Bakti Sosial',
    description: '',
    proofUrl: '',
  });

  const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);

  const filteredDonations = donations.filter(d => {
    const q = searchQuery.toLowerCase();
    return (
      d.donorName.toLowerCase().includes(q) ||
      d.purpose.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q)
    );
  });

  const handleCreateDonation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDonation.donorName || newDonation.amount <= 0) {
      alert('Nama donatur dan nominal wajib diisi!');
      return;
    }

    addDonation(newDonation);
    setShowAddModal(false);
    setNewDonation({
      date: new Date().toISOString().split('T')[0],
      donorName: '',
      donorContact: '',
      amount: 500000,
      type: 'uang',
      purpose: 'Kas Operasional & Bakti Sosial',
      description: '',
      proofUrl: '',
    });
  };

  const handleExportExcel = () => {
    const exportData = donations.map((d, idx) => ({
      No: idx + 1,
      Tanggal: d.date,
      'Nama Donatur': d.donorName,
      'Kontak Donatur': d.donorContact || '-',
      'Jenis Donasi': d.type,
      'Tujuan Donasi': d.purpose,
      'Nominal (Rp)': d.amount,
      Keterangan: d.description,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Donasi');
    XLSX.writeFile(workbook, `Data_Donasi_Patelki_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Pencatatan Donasi & Sumbangan
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-800 text-xs font-black">
              {donations.length} Donasi
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Data sumbangan sukarela dan donasi mitra yang otomatis terintegrasi dengan Kas Masuk DPC.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-extrabold transition-colors shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Catat Donasi Baru
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-pink-600 text-white p-5 rounded-3xl shadow-xl shadow-pink-600/15 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-pink-100 uppercase tracking-wider">
              Total Donasi Terkumpul
            </p>
            <p className="text-2xl sm:text-3xl font-black font-mono mt-1">
              {formatCurrency(totalDonations)}
            </p>
          </div>
          <Heart className="w-8 h-8 text-pink-200 fill-white/20" />
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Jumlah Transaksi Donasi
            </p>
            <p className="text-2xl font-black text-slate-900 font-mono mt-1">
              {donations.length} <span className="text-xs font-semibold text-slate-500">Pemberian</span>
            </p>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Rata-Rata Donasi
            </p>
            <p className="text-2xl font-black text-slate-900 font-mono mt-1">
              {formatCurrency(donations.length ? totalDonations / donations.length : 0)}
            </p>
          </div>
          <Wallet className="w-8 h-8 text-amber-500" />
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari nama donatur, peruntukan, keterangan..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:border-amber-500 outline-hidden"
          />
        </div>
      </div>

      {/* Donations List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 text-white font-black uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-4 px-4">Tanggal</th>
                <th className="py-4 px-4">Nama Donatur</th>
                <th className="py-4 px-4">Tujuan & Keterangan</th>
                <th className="py-4 px-4">Kontak</th>
                <th className="py-4 px-4 text-right">Nominal Donasi</th>
                <th className="py-4 px-3 text-center no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDonations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Belum ada data donasi yang tercatat.
                  </td>
                </tr>
              ) : (
                filteredDonations.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-600 whitespace-nowrap">
                      {d.date}
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-slate-900 text-xs sm:text-sm">
                      {d.donorName}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-100 text-pink-800 uppercase">
                        {d.purpose}
                      </span>
                      <p className="text-slate-600 mt-1 leading-snug">{d.description}</p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {d.donorContact || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-black text-pink-700 text-sm">
                      {formatCurrency(d.amount)}
                    </td>

                    <td className="py-3.5 px-3 text-center no-print">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Hapus donasi dari ${d.donorName}?`)) {
                            deleteDonation(d.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                        title="Hapus Donasi"
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

      {/* Add Donation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="font-black text-base text-slate-900">Catat Donasi / Sumbangan Baru</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Donasi otomatis masuk ke dalam Kas Masuk Buku Kas DPC.
            </p>

            <form onSubmit={handleCreateDonation} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal *</label>
                  <input
                    type="date"
                    required
                    value={newDonation.date}
                    onChange={e => setNewDonation({ ...newDonation, date: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nominal (Rp) *</label>
                  <input
                    type="number"
                    required
                    min={10000}
                    step={10000}
                    value={newDonation.amount}
                    onChange={e => setNewDonation({ ...newDonation, amount: Number(e.target.value) })}
                    placeholder="Contoh: 1000000"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Donatur / Instansi *</label>
                  <input
                    type="text"
                    required
                    value={newDonation.donorName}
                    onChange={e => setNewDonation({ ...newDonation, donorName: e.target.value })}
                    placeholder="Contoh: PT Medika Borneo / Hamba Allah"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kontak Donatur (Opsional)</label>
                  <input
                    type="text"
                    value={newDonation.donorContact}
                    onChange={e => setNewDonation({ ...newDonation, donorContact: e.target.value })}
                    placeholder="No. HP / WA donatur"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Peruntukan / Tujuan Donasi *</label>
                <input
                  type="text"
                  required
                  value={newDonation.purpose}
                  onChange={e => setNewDonation({ ...newDonation, purpose: e.target.value })}
                  placeholder="Contoh: Bakti Sosial Skrining Kesehatan / Kas Operasional"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan Tambahan</label>
                <textarea
                  rows={2}
                  value={newDonation.description}
                  onChange={e => setNewDonation({ ...newDonation, description: e.target.value })}
                  placeholder="Keterangan donasi..."
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
                  className="px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Simpan Donasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Donasi;
