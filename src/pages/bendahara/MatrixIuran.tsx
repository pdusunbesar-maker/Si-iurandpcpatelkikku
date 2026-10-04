import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import * as XLSX from 'xlsx';
import {
  Grid3X3,
  Calendar,
  Search,
  Filter,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  Clock,
  XCircle,
  MinusCircle,
  ArrowRight,
  Info,
} from 'lucide-react';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export const MatrixIuran: React.FC = () => {
  const { members, duesRecords, settings, updateDuesStatus, formatCurrency } = useApp();

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'semua' | 'lunas' | 'tunggakan' | 'pending'>('semua');
  const [instansiFilter, setInstansiFilter] = useState('semua');

  // Quick edit popover state
  const [selectedCell, setSelectedCell] = useState<{
    memberId: string;
    memberName: string;
    year: number;
    month: number;
    currentStatus: 'paid' | 'pending' | 'unpaid' | 'inactive';
  } | null>(null);

  const availableYears = [2025, 2026, 2027, 2028, 2029, 2030, 2031];
  const instansiList = Array.from(new Set(members.map(m => m.instansi).filter(Boolean)));

  // Filtered members for matrix
  const filteredMembers = members.filter(m => {
    const query = searchQuery.toLowerCase();
    const matchSearch =
      m.nama.toLowerCase().includes(query) ||
      m.nap.toLowerCase().includes(query) ||
      m.instansi.toLowerCase().includes(query);

    const matchInstansi = instansiFilter === 'semua' || m.instansi === instansiFilter;

    // Check dues status for member in selectedYear
    const memberDues = duesRecords.filter(d => d.memberId === m.id && d.year === selectedYear);
    const paidCount = memberDues.filter(d => d.status === 'paid').length;
    const hasPending = memberDues.some(d => d.status === 'pending');
    const hasUnpaid = memberDues.some(d => d.status === 'unpaid');

    let matchStatus = true;
    if (statusFilter === 'lunas') matchStatus = paidCount === 12;
    if (statusFilter === 'tunggakan') matchStatus = hasUnpaid;
    if (statusFilter === 'pending') matchStatus = hasPending;

    return matchSearch && matchInstansi && matchStatus;
  });

  // Calculate year totals
  const totalPotential = members.filter(m => m.status === 'aktif').length * 12 * settings.monthlyFee;
  const yearRecords = duesRecords.filter(d => d.year === selectedYear);
  const totalCollected = yearRecords.filter(d => d.status === 'paid').length * settings.monthlyFee;
  const totalPending = yearRecords.filter(d => d.status === 'pending').length * settings.monthlyFee;
  const totalUnpaid = yearRecords.filter(d => d.status === 'unpaid').length * settings.monthlyFee;

  // Export Matrix to Excel
  const handleExportExcel = () => {
    const exportRows = filteredMembers.map(m => {
      const row: any = {
        Nama: `${m.nama}, ${m.gelar}`,
        NAP: m.nap,
        Instansi: m.instansi,
      };

      let memberTotalPaid = 0;
      for (let month = 1; month <= 12; month++) {
        const record = duesRecords.find(
          d => d.memberId === m.id && d.year === selectedYear && d.month === month
        );
        const status = record?.status || 'unpaid';
        row[MONTH_SHORT[month - 1]] =
          status === 'paid' ? 'Lunas' : status === 'pending' ? 'Verifikasi' : status === 'inactive' ? 'Nonaktif' : 'Belum';
        if (status === 'paid') memberTotalPaid += settings.monthlyFee;
      }
      row['Total Terbayar'] = memberTotalPaid;
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Matrix_${selectedYear}`);
    XLSX.writeFile(workbook, `Matrix_Iuran_Patelki_${selectedYear}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Matrix Iuran 12 Bulan
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
              Tahun {selectedYear}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Status iuran bulanan seluruh anggota DPC Patelki Kayong Utara (Tarif: {formatCurrency(settings.monthlyFee)}/bulan)
          </p>
        </div>

        {/* Year Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-white border-2 border-amber-400 rounded-xl p-1 shadow-xs">
            <Calendar className="w-4 h-4 text-amber-600 ml-2 mr-1" />
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="text-xs sm:text-sm font-black text-slate-900 bg-transparent pr-3 py-1 outline-hidden cursor-pointer"
            >
              {availableYears.map(yr => (
                <option key={yr} value={yr}>
                  Tahun {yr}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Matrix
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

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase">Potensi Kas {selectedYear}</p>
          <p className="text-lg sm:text-xl font-black text-slate-900 font-mono mt-1">
            {formatCurrency(totalPotential)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">12 Bulan x {members.filter(m => m.status === 'aktif').length} Anggota</p>
        </div>

        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <p className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Terkumpul (Lunas)
          </p>
          <p className="text-lg sm:text-xl font-black text-emerald-700 font-mono mt-1">
            {formatCurrency(totalCollected)}
          </p>
          <p className="text-[11px] text-emerald-600 mt-0.5">
            {totalPotential > 0 ? Math.round((totalCollected / totalPotential) * 100) : 0}% Target Tercapai
          </p>
        </div>

        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-300 shadow-xs">
          <p className="text-xs font-bold text-amber-900 uppercase flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Menunggu Verifikasi
          </p>
          <p className="text-lg sm:text-xl font-black text-amber-800 font-mono mt-1">
            {formatCurrency(totalPending)}
          </p>
          <p className="text-[11px] text-amber-700 mt-0.5">Dalam antrean verifikasi</p>
        </div>

        <div className="bg-red-50 p-4 rounded-2xl border border-red-200 shadow-xs">
          <p className="text-xs font-bold text-red-800 uppercase flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-red-600" /> Sisa Tunggakan
          </p>
          <p className="text-lg sm:text-xl font-black text-red-700 font-mono mt-1">
            {formatCurrency(totalUnpaid)}
          </p>
          <p className="text-[11px] text-red-600 mt-0.5">Belum disetorkan</p>
        </div>
      </div>

      {/* Filter & Legend Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari anggota / NAP..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:border-amber-500 outline-hidden"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium outline-hidden"
          >
            <option value="semua">Semua Status</option>
            <option value="lunas">🟢 Lunas 1 Tahun Penuh</option>
            <option value="tunggakan">🔴 Ada Tunggakan</option>
            <option value="pending">🟡 Ada Menunggu Verifikasi</option>
          </select>

          <select
            value={instansiFilter}
            onChange={e => setInstansiFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium outline-hidden max-w-[180px]"
          >
            <option value="semua">Semua Instansi</option>
            {instansiList.map(i => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>

        {/* Color Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>🟢 Lunas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span>🟡 Verifikasi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span>🔴 Belum</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-300" />
            <span>⚫ Nonaktif</span>
          </div>
        </div>
      </div>

      {/* 12-Month Matrix Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-center text-xs border-collapse">
            <thead className="bg-slate-900 text-white font-black uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-4 px-4 text-left min-w-[200px] sticky left-0 bg-slate-900 z-10">
                  Anggota ({selectedYear})
                </th>
                {MONTH_SHORT.map((m, idx) => (
                  <th key={m} className="py-4 px-2 min-w-[46px] border-l border-slate-800">
                    {m}
                  </th>
                ))}
                <th className="py-4 px-4 text-right min-w-[110px] border-l border-slate-800">
                  Total Bayar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((m, idx) => {
                let memberTotalPaid = 0;

                return (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    {/* Sticky Member Name Column */}
                    <td className="py-3 px-4 text-left sticky left-0 bg-white hover:bg-slate-50 z-10 border-r border-slate-100 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            m.foto ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                              m.nama
                            )}`
                          }
                          alt={m.nama}
                          className="w-7 h-7 rounded-lg object-cover border border-amber-300 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-900 text-xs truncate">
                            {m.nama}, {m.gelar}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono truncate">
                            {m.nap} • {m.instansi}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* 12 Months Cells */}
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                      const record = duesRecords.find(
                        d => d.memberId === m.id && d.year === selectedYear && d.month === month
                      );
                      const status = record?.status || (m.status === 'nonaktif' ? 'inactive' : 'unpaid');
                      if (status === 'paid') memberTotalPaid += settings.monthlyFee;

                      return (
                        <td
                          key={month}
                          onClick={() => {
                            setSelectedCell({
                              memberId: m.id,
                              memberName: m.nama,
                              year: selectedYear,
                              month,
                              currentStatus: status,
                            });
                          }}
                          className="py-2.5 px-1.5 border-l border-slate-100 cursor-pointer transition-transform hover:scale-110 select-none"
                          title={`${MONTH_SHORT[month - 1]} ${selectedYear}: ${
                            status === 'paid'
                              ? 'Lunas'
                              : status === 'pending'
                              ? 'Menunggu Verifikasi'
                              : status === 'inactive'
                              ? 'Nonaktif'
                              : 'Belum Bayar'
                          } (Klik untuk ubah status)`}
                        >
                          {status === 'paid' && (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black shadow-2xs">
                              ✅
                            </span>
                          )}
                          {status === 'pending' && (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-black shadow-2xs animate-pulse">
                              ⏳
                            </span>
                          )}
                          {status === 'unpaid' && (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-100 text-red-700 font-bold hover:bg-red-200">
                              ❌
                            </span>
                          )}
                          {status === 'inactive' && (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-400 font-bold">
                              —
                            </span>
                          )}
                        </td>
                      );
                    })}

                    {/* Total Amount Paid */}
                    <td className="py-3 px-4 text-right font-mono font-bold border-l border-slate-100 text-slate-900 bg-slate-50/50">
                      {formatCurrency(memberTotalPaid)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Cell Status Edit Modal */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="font-extrabold text-sm text-slate-900">Ubah Status Iuran Manual</h3>
            <p className="text-xs text-slate-600 mt-1">
              Anggota: <span className="font-bold text-slate-900">{selectedCell.memberName}</span>
              <br />
              Periode: <span className="font-bold text-amber-600">{MONTH_SHORT[selectedCell.month - 1]} {selectedCell.year}</span>
            </p>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => {
                  updateDuesStatus(selectedCell.memberId, selectedCell.year, selectedCell.month, 'paid');
                  setSelectedCell(null);
                }}
                className="w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors text-left"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Set Lunas & Terverifikasi (🟢)
              </button>

              <button
                type="button"
                onClick={() => {
                  updateDuesStatus(selectedCell.memberId, selectedCell.year, selectedCell.month, 'pending');
                  setSelectedCell(null);
                }}
                className="w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors text-left"
              >
                <Clock className="w-4 h-4 text-amber-600" />
                Set Menunggu Verifikasi (🟡)
              </button>

              <button
                type="button"
                onClick={() => {
                  updateDuesStatus(selectedCell.memberId, selectedCell.year, selectedCell.month, 'unpaid');
                  setSelectedCell(null);
                }}
                className="w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold bg-red-50 text-red-800 hover:bg-red-100 transition-colors text-left"
              >
                <XCircle className="w-4 h-4 text-red-600" />
                Set Belum Bayar (🔴)
              </button>

              <button
                type="button"
                onClick={() => {
                  updateDuesStatus(selectedCell.memberId, selectedCell.year, selectedCell.month, 'inactive');
                  setSelectedCell(null);
                }}
                className="w-full flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-left"
              >
                <MinusCircle className="w-4 h-4 text-slate-500" />
                Set Nonaktif / Bebas Tagihan (⚫)
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCell(null)}
              className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatrixIuran;
