import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import * as XLSX from 'xlsx';
import {
  CalendarDays,
  Search,
  FileSpreadsheet,
  Printer,
  Phone,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { WhatsAppModal } from '../../components/WhatsAppModal';

export const MatrixTahunan: React.FC = () => {
  const { members, duesRecords, settings, formatCurrency } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [waTarget, setWaTarget] = useState<{
    name: string;
    phone: string;
    message: string;
  } | null>(null);

  const years = [2025, 2026, 2027, 2028, 2029, 2030, 2031];
  const now = new Date();
  const currentCalendarYear = now.getFullYear();
  const currentCalendarMonth = now.getMonth() + 1; // 1-12

  // Filtered members
  const filteredMembers = members.filter(m => {
    const q = searchQuery.toLowerCase();
    return (
      m.nama.toLowerCase().includes(q) ||
      m.nap.toLowerCase().includes(q) ||
      m.instansi.toLowerCase().includes(q)
    );
  });

  // Calculate year stats for a member (handles both member object or string ID)
  const getMemberYearStat = (member: any, year: number) => {
    const memberId = typeof member === 'object' && member !== null ? member.id : member;
    const memberNap = typeof member === 'object' && member !== null ? member.nap : undefined;
    const records = duesRecords.filter(
      d => (d.memberId === memberId || (memberNap && d.memberId === memberNap)) && d.year === year
    );
    const paidCount = records.filter(d => d.status === 'paid').length;
    const isInactive = records.length > 0 && records.every(d => d.status === 'inactive');

    if (isInactive) return { text: '—', status: 'inactive', paidCount: 0 };
    return {
      text: `${paidCount}/12`,
      status: paidCount === 12 ? 'full' : paidCount > 0 ? 'partial' : 'empty',
      paidCount,
    };
  };

  // Calculate dynamic arrears for member up to running calendar month
  const getMemberArrears = (member: any) => {
    if (member.status === 'nonaktif') {
      return { arrears: 0, unpaidMonths: 0 };
    }

    const memberId = typeof member === 'object' && member !== null ? member.id : member;
    const memberNap = typeof member === 'object' && member !== null ? member.nap : undefined;
    const memberRecords = duesRecords.filter(
      d => d.memberId === memberId || (memberNap && d.memberId === memberNap)
    );

    let arrears = 0;
    let unpaidMonths = 0;
    const startYr = settings.startYear || 2025;
    const endYr = currentCalendarYear;

    for (let yr = startYr; yr <= endYr; yr++) {
      const maxMonth = yr === currentCalendarYear ? currentCalendarMonth : 12;
      for (let mo = 1; mo <= maxMonth; mo++) {
        const rec = memberRecords.find(d => d.year === yr && d.month === mo);
        const status = rec?.status || 'unpaid';
        const amount = rec?.amount || settings.monthlyFee;
        if (status !== 'paid' && status !== 'inactive') {
          arrears += amount;
          unpaidMonths++;
        }
      }
    }

    return { arrears, unpaidMonths };
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredMembers.map(m => {
      const row: any = {
        Nama: `${m.nama}, ${m.gelar}`,
        NAP: m.nap,
        Instansi: m.instansi,
      };

      const { arrears: totalArrears, unpaidMonths } = getMemberArrears(m);
      years.forEach(yr => {
        const stat = getMemberYearStat(m, yr);
        row[`Tahun ${yr}`] = stat.text;
      });

      row['Bulan Belum Lunas'] = unpaidMonths;
      row['Total Tunggakan (Rp)'] = totalArrears;
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap_Tahunan_2025_2031');
    XLSX.writeFile(workbook, `Rekap_Iuran_Tahunan_Patelki_2025_2031.xlsx`);
  };

  const handleOpenWaBilling = (m: any, arrears: number, unpaidMonths: number) => {
    const msg = settings.waTemplateReminder
      .replace(/\[NAMA\]/g, `${m.nama}, ${m.gelar}`)
      .replace(/\[NAP\]/g, m.nap)
      .replace(/\[TANGGAL\]/g, new Date().toLocaleDateString('id-ID'))
      .replace(/\[NOMINAL\]/g, formatCurrency(arrears))
      .replace(/\[PERIODE\]/g, `${unpaidMonths} Bulan (${settings.startYear || 2025}–${currentCalendarYear})`);

    setWaTarget({
      name: `${m.nama}, ${m.gelar}`,
      phone: m.noWa,
      message: msg,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Matrix Rekap Iuran Tahunan (2025–2031)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
              7 Periode Tahun
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Format 12/12 menandakan 12 bulan lunas penuh. Perhitungan tunggakan dihitung otomatis secara real-time.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
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

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari anggota / NAP / Instansi..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:border-amber-500 outline-hidden"
          />
        </div>

        <div className="text-xs text-slate-500 font-semibold hidden sm:block">
          Total: <span className="text-slate-900 font-bold">{filteredMembers.length}</span> Anggota
        </div>
      </div>

      {/* Annual Rekap Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-center text-xs border-collapse">
            <thead className="bg-slate-900 text-white font-black uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-4 px-4 text-left min-w-[200px] sticky left-0 bg-slate-900 z-10">
                  Anggota & Instansi
                </th>
                {years.map(yr => (
                  <th key={yr} className="py-4 px-3 min-w-[70px] border-l border-slate-800">
                    {yr}
                  </th>
                ))}
                <th className="py-4 px-4 text-right min-w-[140px] border-l border-slate-800">
                  Tunggakan Berjalan
                </th>
                <th className="py-4 px-4 text-center min-w-[90px] border-l border-slate-800 no-print">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map(m => {
                // Calculate dynamic arrears (berkurang otomatis saat iuran berstatus paid)
                const { arrears: memberArrears, unpaidMonths } = getMemberArrears(m);

                return (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    {/* Member Info */}
                    <td className="py-3 px-4 text-left sticky left-0 bg-white hover:bg-slate-50 z-10 border-r border-slate-100 shadow-xs">
                      <div className="font-extrabold text-slate-900 text-xs">
                        {m.nama}, {m.gelar}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {m.nap} • {m.instansi}
                      </div>
                    </td>

                    {/* Years Columns */}
                    {years.map(yr => {
                      const stat = getMemberYearStat(m, yr);

                      return (
                        <td key={yr} className="py-3 px-2 border-l border-slate-100">
                          {stat.status === 'full' ? (
                            <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-black text-xs font-mono">
                              12/12
                            </span>
                          ) : stat.status === 'partial' ? (
                            <span className="inline-block px-2 py-1 rounded-md bg-amber-100 text-amber-900 font-bold text-xs font-mono">
                              {stat.text}
                            </span>
                          ) : stat.status === 'empty' ? (
                            <span className="inline-block px-2 py-1 rounded-md bg-red-50 text-red-600 font-medium text-xs font-mono">
                              0/12
                            </span>
                          ) : (
                            <span className="text-slate-300 font-mono">—</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Total Arrears Amount */}
                    <td className="py-3 px-4 text-right font-mono border-l border-slate-100">
                      {memberArrears > 0 ? (
                        <div className="flex flex-col items-end">
                          <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-md font-mono font-bold">
                            {formatCurrency(memberArrears)}
                          </span>
                          <span className="text-[10px] text-slate-500 font-sans mt-0.5">
                            {unpaidMonths} bln belum lunas
                          </span>
                        </div>
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md font-bold">
                          Lunas ✅
                        </span>
                      )}
                    </td>

                    {/* Direct WhatsApp Billing Action */}
                    <td className="py-3 px-4 text-center border-l border-slate-100 no-print">
                      {memberArrears > 0 && m.status === 'aktif' ? (
                        <button
                          type="button"
                          onClick={() => handleOpenWaBilling(m, memberArrears, unpaidMonths)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs cursor-pointer transition-transform active:scale-95"
                          title="Kirim Tagihan via WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Tagih
                        </button>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* WhatsApp Modal */}
      {waTarget && (
        <WhatsAppModal
          isOpen={true}
          onClose={() => setWaTarget(null)}
          recipientName={waTarget.name}
          recipientPhone={waTarget.phone}
          defaultMessage={waTarget.message}
          title="Kirim Pengingat Tunggakan WhatsApp"
        />
      )}
    </div>
  );
};

export default MatrixTahunan;
