import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Member } from '../../types';
import * as XLSX from 'xlsx';
import {
  AlertCircle,
  Search,
  MessageSquare,
  FileSpreadsheet,
  Printer,
  Phone,
  CheckCircle2,
  Calendar,
  Send,
  Users,
  Sliders,
  DollarSign,
  ShieldCheck,
  Settings2,
} from 'lucide-react';
import { WhatsAppModal } from '../../components/WhatsAppModal';
import { ManageArrearsModal } from '../../components/ManageArrearsModal';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export const DaftarTunggakan: React.FC = () => {
  const { members, duesRecords, settings, formatCurrency } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMemberForArrears, setSelectedMemberForArrears] = useState<Member | null>(null);
  const [waModalData, setWaModalData] = useState<{
    name: string;
    phone: string;
    message: string;
  } | null>(null);

  // Calculate arrears list for active members up to current period
  const arrearsList = members
    .filter(m => m.status === 'aktif')
    .map(member => {
      const targetRecords = duesRecords.filter(
        d => d.memberId === member.id && d.year === selectedYear
      );

      const unpaidRecords = targetRecords.filter(d => d.status === 'unpaid');
      const unpaidMonths = unpaidRecords.map(u => ({
        year: u.year,
        month: u.month,
        monthName: MONTH_SHORT[u.month - 1],
      }));

      const totalArrears = unpaidRecords.length * settings.monthlyFee;
      const paidCount = targetRecords.filter(d => d.status === 'paid').length;

      // Group consecutive months into readable string e.g., "Apr–Jun" or "Jan, Mar, Mei"
      const monthNamesStr = unpaidMonths.map(u => u.monthName).join(', ');

      return {
        member,
        unpaidCount: unpaidRecords.length,
        unpaidMonthsStr: monthNamesStr || 'Tidak ada',
        totalArrears,
        paidCount,
      };
    })
    .filter(item => item.totalArrears > 0)
    .sort((a, b) => b.totalArrears - a.totalArrears);

  // Search filtered
  const filteredArrears = arrearsList.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.member.nama.toLowerCase().includes(q) ||
      item.member.nap.toLowerCase().includes(q) ||
      item.member.instansi.toLowerCase().includes(q) ||
      item.member.noWa.includes(q)
    );
  });

  const totalArrearsAll = arrearsList.reduce((sum, i) => sum + i.totalArrears, 0);

  const handleOpenWaModal = (item: any) => {
    const msg = settings.waTemplateReminder
      .replace(/\[NAMA\]/g, `${item.member.nama}, ${item.member.gelar}`)
      .replace(/\[NAP\]/g, item.member.nap)
      .replace(/\[TANGGAL\]/g, new Date().toLocaleDateString('id-ID'))
      .replace(/\[NOMINAL\]/g, formatCurrency(item.totalArrears))
      .replace(/\[PERIODE\]/g, `${item.unpaidMonthsStr} ${selectedYear}`);

    setWaModalData({
      name: `${item.member.nama}, ${item.member.gelar}`,
      phone: item.member.noWa,
      message: msg,
    });
  };

  const handleExportExcel = () => {
    const exportData = arrearsList.map((item, index) => ({
      No: index + 1,
      'Nama Anggota': `${item.member.nama}, ${item.member.gelar}`,
      NAP: item.member.nap,
      'No WhatsApp': item.member.noWa,
      Instansi: item.member.instansi,
      'Bulan Tunggakan': item.unpaidMonthsStr,
      'Jumlah Bulan': item.unpaidCount,
      'Total Tunggakan (Rp)': item.totalArrears,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Tunggakan_${selectedYear}`);
    XLSX.writeFile(workbook, `Daftar_Tunggakan_Patelki_${selectedYear}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Sistem Pengawasan Tunggakan
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-black">
              {arrearsList.length} Anggota Menunggak
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Daftar kewajiban iuran yang belum terselesaikan. Dilengkapi dengan tombol direct "📱 Tagih via WhatsApp".
          </p>
        </div>

        {/* Actions & Year */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-white border border-slate-300 rounded-xl px-3 py-1.5 shadow-xs">
            <Calendar className="w-4 h-4 text-amber-500 mr-2" />
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="text-xs font-bold text-slate-800 bg-transparent outline-hidden cursor-pointer"
            >
              {[2025, 2026, 2027, 2028, 2029, 2030, 2031].map(y => (
                <option key={y} value={y}>
                  Tahun {y}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            <Printer className="w-4 h-4" />
            Cetak
          </button>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-500 text-white p-5 rounded-2xl shadow-lg shadow-red-500/15 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-red-100 uppercase tracking-wider">
              Total Tunggakan Kas ({selectedYear})
            </p>
            <p className="text-2xl font-black font-mono mt-1">
              {formatCurrency(totalArrearsAll)}
            </p>
          </div>
          <AlertCircle className="w-8 h-8 text-red-200" />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Anggota Menunggak
            </p>
            <p className="text-2xl font-black text-slate-900 font-mono mt-1">
              {arrearsList.length} <span className="text-xs font-semibold text-slate-500">Orang</span>
            </p>
          </div>
          <Users className="w-8 h-8 text-amber-500" />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tarif Iuran Wajib
            </p>
            <p className="text-2xl font-black text-emerald-700 font-mono mt-1">
              {formatCurrency(settings.monthlyFee)}
              <span className="text-xs font-semibold text-slate-500"> /bln</span>
            </p>
          </div>
          <div className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-xl">
            AD/ART DPC
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari nama, NAP, atau instansi anggota..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:border-amber-500 outline-hidden"
          />
        </div>
      </div>

      {/* Arrears Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 text-white font-black uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Nama Anggota</th>
                <th className="py-3.5 px-4">NAP & Instansi</th>
                <th className="py-3.5 px-4">Bulan Menunggak</th>
                <th className="py-3.5 px-4 text-center">Jml Bulan</th>
                <th className="py-3.5 px-4 text-right">Total Tunggakan</th>
                <th className="py-3.5 px-4 text-center no-print">Aksi Bendahara</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredArrears.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    Tidak ada data tunggakan untuk periode ini. Semua anggota tertib membayar!
                  </td>
                </tr>
              ) : (
                filteredArrears.map((item, idx) => (
                  <tr key={item.member.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-slate-900 text-xs sm:text-sm">
                      <button
                        type="button"
                        onClick={() => setSelectedMemberForArrears(item.member)}
                        className="text-left hover:text-amber-700 hover:underline cursor-pointer"
                      >
                        {item.member.nama}, {item.member.gelar || ''}
                      </button>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-emerald-800">{item.member.nap}</div>
                      <div className="text-[11px] text-slate-500">{item.member.instansi}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-red-50 text-red-800 font-bold text-[11px] border border-red-200">
                        {item.unpaidMonthsStr} {selectedYear}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      {item.unpaidCount} Bulan
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-black text-red-600 text-sm">
                      {formatCurrency(item.totalArrears)}
                    </td>

                    <td className="py-3.5 px-4 text-center no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedMemberForArrears(item.member)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-xs transition-all cursor-pointer active:scale-95"
                          title="Atur status bulan tunggakan, lunaskan tunai, atau bebaskan iuran"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                          Atur Tunggakan
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenWaModal(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer active:scale-95"
                          title="Kirim pesan tagihan iuran resmi via WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Tagih WA
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Arrears Management Modal */}
      {selectedMemberForArrears && (
        <ManageArrearsModal
          member={selectedMemberForArrears}
          isOpen={true}
          defaultYear={selectedYear}
          onClose={() => setSelectedMemberForArrears(null)}
        />
      )}

      {/* WhatsApp Modal */}
      {waModalData && (
        <WhatsAppModal
          isOpen={true}
          onClose={() => setWaModalData(null)}
          recipientName={waModalData.name}
          recipientPhone={waModalData.phone}
          defaultMessage={waModalData.message}
          title="Kirim Tagihan Tunggakan via WhatsApp"
        />
      )}
    </div>
  );
};

export default DaftarTunggakan;
