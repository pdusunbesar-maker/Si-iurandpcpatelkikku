import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SocialService } from '../../types';
import * as XLSX from 'xlsx';
import {
  HeartHandshake,
  PlusCircle,
  Search,
  FileSpreadsheet,
  Printer,
  Trash2,
  Calendar,
  MapPin,
  Users,
  Wallet,
  CheckCircle2,
  Image as ImageIcon,
  Plus,
  X,
} from 'lucide-react';

export const BaktiSosial: React.FC = () => {
  const { socialServices, addSocialService, deleteSocialService, formatCurrency } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingDetail, setViewingDetail] = useState<SocialService | null>(null);

  // New social service state
  const [newSoc, setNewSoc] = useState<Omit<SocialService, 'id' | 'createdAt'>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    fundSource: 'Kas DPC Patelki & Donasi Mitra',
    totalBudget: 3000000,
    totalSpent: 3000000,
    beneficiaries: '',
    description: '',
    documentationUrls: [
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=600'
    ],
    expenses: [
      { id: '1', item: 'Strip Tes Lab & BHP Medis', amount: 1800000 },
      { id: '2', item: 'Transport & Logistik Relawan', amount: 700000 },
      { id: '3', item: 'Konsumsi & Snack Warga', amount: 500000 },
    ],
  });

  const totalSpentAll = socialServices.reduce((sum, s) => sum + s.totalSpent, 0);

  const filteredList = socialServices.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.location.toLowerCase().includes(q) ||
      s.beneficiaries.toLowerCase().includes(q)
    );
  });

  const handleCreateSocial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSoc.title || !newSoc.location) {
      alert('Judul kegiatan dan lokasi wajib diisi!');
      return;
    }

    const calculatedSpent = newSoc.expenses.reduce((sum, item) => sum + item.amount, 0);
    addSocialService({
      ...newSoc,
      totalSpent: calculatedSpent || newSoc.totalSpent,
    });

    setShowAddModal(false);
  };

  const handleExportExcel = () => {
    const exportData = socialServices.map((s, idx) => ({
      No: idx + 1,
      'Nama Kegiatan': s.title,
      Tanggal: s.date,
      Lokasi: s.location,
      'Sumber Dana': s.fundSource,
      'Total Anggaran (Rp)': s.totalBudget,
      'Total Realisasi (Rp)': s.totalSpent,
      'Penerima Manfaat': s.beneficiaries,
      Deskripsi: s.description,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Bakti_Sosial');
    XLSX.writeFile(workbook, `Laporan_Baksos_Patelki_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Bakti Sosial & Pengabdian Masyarakat
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-black">
              {socialServices.length} Kegiatan
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Akuntabilitas pertanggungjawaban kegiatan sosial, pemeriksaan laboratorium gratis, dan tanggap bencana.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition-colors shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Catat Kegiatan Baksos
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
        <div className="bg-indigo-600 text-white p-5 rounded-3xl shadow-xl shadow-indigo-600/15 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-indigo-100 uppercase tracking-wider">
              Total Dana Baksos Tersalurkan
            </p>
            <p className="text-2xl sm:text-3xl font-black font-mono mt-1">
              {formatCurrency(totalSpentAll)}
            </p>
          </div>
          <HeartHandshake className="w-8 h-8 text-indigo-200" />
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Kegiatan Pengabdian
            </p>
            <p className="text-2xl font-black text-slate-900 font-mono mt-1">
              {socialServices.length} <span className="text-xs font-semibold text-slate-500">Program</span>
            </p>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Penerima Manfaat
            </p>
            <p className="text-2xl font-black text-emerald-700 font-mono mt-1">
              245+ <span className="text-xs font-semibold text-slate-500">Warga KKU</span>
            </p>
          </div>
          <Users className="w-8 h-8 text-amber-500" />
        </div>
      </div>

      {/* Social Service Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredList.map(soc => (
          <div
            key={soc.id}
            className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:border-indigo-400 transition-colors"
          >
            <div>
              {/* Photo Banner if available */}
              {soc.documentationUrls.length > 0 && (
                <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                  <img
                    src={soc.documentationUrls[0]}
                    alt={soc.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-slate-900/80 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-400" /> {soc.date}
                  </div>
                </div>
              )}

              <div className="p-5 sm:p-6 space-y-3">
                <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                  {soc.title}
                </h3>

                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="font-semibold">{soc.location}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Penerima: <strong className="text-slate-900">{soc.beneficiaries}</strong></span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {soc.description}
                </p>

                {/* Expense Breakdown Pill */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Sumber Dana:</span>
                    <span className="text-indigo-800">{soc.fundSource}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Total Realisasi Pengeluaran:</span>
                    <span className="font-mono text-emerald-700">{formatCurrency(soc.totalSpent)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewingDetail(soc)}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900"
              >
                Lihat Rincian Anggaran & Dokumentasi →
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Hapus kegiatan "${soc.title}"?`)) {
                    deleteSocialService(soc.id);
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {viewingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 my-8">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase">
                  Laporan Pertanggungjawaban Bakti Sosial
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">{viewingDetail.title}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  📅 {viewingDetail.date} • 📍 {viewingDetail.location}
                </p>
              </div>
              <button
                onClick={() => setViewingDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Deskripsi Kegiatan</h4>
                <p className="text-slate-600 leading-relaxed">{viewingDetail.description}</p>
              </div>

              {/* Expenses table */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Rincian Item Pengeluaran</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 font-bold text-slate-700 text-[11px]">
                      <tr>
                        <th className="p-2.5">Item / Kebutuhan</th>
                        <th className="p-2.5 text-right">Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingDetail.expenses.map((exp, i) => (
                        <tr key={i}>
                          <td className="p-2.5 font-medium">{exp.item}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                            {formatCurrency(exp.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-black text-slate-900 border-t border-slate-200">
                      <tr>
                        <td className="p-2.5">Total Realisasi</td>
                        <td className="p-2.5 text-right font-mono text-emerald-700">
                          {formatCurrency(viewingDetail.totalSpent)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Photos Gallery */}
              {viewingDetail.documentationUrls.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">Dokumentasi Kegiatan</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {viewingDetail.documentationUrls.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt="Dokumentasi"
                        className="w-full h-24 object-cover rounded-xl border border-slate-200"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingDetail(null)}
                className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 my-8">
            <h3 className="font-black text-base text-slate-900">Catat Kegiatan Bakti Sosial Baru</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Masukkan detail pelaksanaan dan anggaran baksos DPC.
            </p>

            <form onSubmit={handleCreateSocial} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Kegiatan Bakti Sosial *
                </label>
                <input
                  type="text"
                  required
                  value={newSoc.title}
                  onChange={e => setNewSoc({ ...newSoc, title: e.target.value })}
                  placeholder="Contoh: Skrining Lab Penyakit Tidak Menular Gratis di Sukadana"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal *</label>
                  <input
                    type="date"
                    required
                    value={newSoc.date}
                    onChange={e => setNewSoc({ ...newSoc, date: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi *</label>
                  <input
                    type="text"
                    required
                    value={newSoc.location}
                    onChange={e => setNewSoc({ ...newSoc, location: e.target.value })}
                    placeholder="Balai Desa / Dusun..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sumber Dana</label>
                  <input
                    type="text"
                    value={newSoc.fundSource}
                    onChange={e => setNewSoc({ ...newSoc, fundSource: e.target.value })}
                    placeholder="Kas DPC / Donatur"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Penerima / Sasaran</label>
                  <input
                    type="text"
                    value={newSoc.beneficiaries}
                    onChange={e => setNewSoc({ ...newSoc, beneficiaries: e.target.value })}
                    placeholder="Contoh: 150 Warga Lansia"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Total Realisasi Dana (Rp)</label>
                <input
                  type="number"
                  value={newSoc.totalSpent}
                  onChange={e => setNewSoc({ ...newSoc, totalSpent: Number(e.target.value) })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Kegiatan</label>
                <textarea
                  rows={2}
                  value={newSoc.description}
                  onChange={e => setNewSoc({ ...newSoc, description: e.target.value })}
                  placeholder="Keterangan singkat pelaksanaan..."
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Simpan Laporan Baksos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BaktiSosial;
