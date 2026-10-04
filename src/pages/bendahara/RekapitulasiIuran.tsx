import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import * as XLSX from 'xlsx';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  FileSpreadsheet,
  TrendingUp,
} from 'lucide-react';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const RekapitulasiIuran: React.FC = () => {
  const { members, duesRecords, settings, formatCurrency } = useApp();
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  const activeMembers = members.filter(m => m.status === 'aktif');
  const activeCount = activeMembers.length;

  // Monthly stats breakdown for the selected year
  const monthlyBreakdown = MONTH_NAMES.map((name, index) => {
    const monthNum = index + 1;
    const records = duesRecords.filter(d => d.year === selectedYear && d.month === monthNum);

    const paidRecords = records.filter(d => d.status === 'paid');
    const unpaidRecords = records.filter(d => d.status === 'unpaid');
    const pendingRecords = records.filter(d => d.status === 'pending');

    const potential = activeCount * settings.monthlyFee;
    const collected = paidRecords.length * settings.monthlyFee;
    const pending = pendingRecords.length * settings.monthlyFee;
    const arrears = unpaidRecords.length * settings.monthlyFee;
    const compliance = activeCount > 0 ? Math.round((paidRecords.length / activeCount) * 100) : 0;

    return {
      monthNum,
      name,
      paidCount: paidRecords.length,
      unpaidCount: unpaidRecords.length,
      pendingCount: pendingRecords.length,
      potential,
      collected,
      pending,
      arrears,
      compliance,
    };
  });

  const yearTotalPotential = monthlyBreakdown.reduce((sum, m) => sum + m.potential, 0);
  const yearTotalCollected = monthlyBreakdown.reduce((sum, m) => sum + m.collected, 0);
  const yearTotalArrears = monthlyBreakdown.reduce((sum, m) => sum + m.arrears, 0);
  const yearAverageCompliance =
    monthlyBreakdown.reduce((sum, m) => sum + m.compliance, 0) / (monthlyBreakdown.length || 1);

  const handleExportExcel = () => {
    const exportData = monthlyBreakdown.map(m => ({
      Bulan: `${m.name} ${selectedYear}`,
      'Total Anggota Aktif': activeCount,
      'Sudah Bayar': m.paidCount,
      'Belum Bayar': m.unpaidCount,
      'Menunggu Verifikasi': m.pendingCount,
      'Potensi Penerimaan (Rp)': m.potential,
      'Iuran Masuk (Rp)': m.collected,
      'Tunggakan (Rp)': m.arrears,
      'Kepatuhan (%)': `${m.compliance}%`,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Rekap_Bulanan_${selectedYear}`);
    XLSX.writeFile(workbook, `Rekapitulasi_Iuran_Patelki_${selectedYear}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Rekapitulasi Iuran Anggota
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
              Tahun {selectedYear}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Analisis kepatuhan pembayaran bulanan dan perolehan dana kas DPC Patelki Kayong Utara.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase">Potensi Kas Tahunan</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
            {formatCurrency(yearTotalPotential)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">{activeCount} Anggota Terdaftar</p>
        </div>

        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-xs">
          <p className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Total Iuran Terkumpul
          </p>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-1">
            {formatCurrency(yearTotalCollected)}
          </p>
          <p className="text-[11px] text-emerald-600 mt-1">
            Tercapai {yearTotalPotential > 0 ? Math.round((yearTotalCollected / yearTotalPotential) * 100) : 0}%
          </p>
        </div>

        <div className="bg-red-50 p-5 rounded-2xl border border-red-200 shadow-xs">
          <p className="text-xs font-bold text-red-800 uppercase flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-red-600" /> Total Tunggakan {selectedYear}
          </p>
          <p className="text-xl sm:text-2xl font-black text-red-700 font-mono mt-1">
            {formatCurrency(yearTotalArrears)}
          </p>
          <p className="text-[11px] text-red-600 mt-1">Kewajiban belum terbayar</p>
        </div>

        <div className="bg-amber-50 p-5 rounded-2xl border border-amber-300 shadow-xs">
          <p className="text-xs font-bold text-amber-900 uppercase flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" /> Rata-Rata Kepatuhan
          </p>
          <p className="text-xl sm:text-2xl font-black text-amber-900 font-mono mt-1">
            {Math.round(yearAverageCompliance)}%
          </p>
          <p className="text-[11px] text-amber-700 mt-1">Tingkat partisipasi aktif</p>
        </div>
      </div>

      {/* Monthly Breakdown Detailed Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 text-white font-black uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-4 px-4">Bulan ({selectedYear})</th>
                <th className="py-4 px-3 text-center">Sudah Bayar</th>
                <th className="py-4 px-3 text-center">Belum Bayar</th>
                <th className="py-4 px-3 text-center">Verifikasi</th>
                <th className="py-4 px-4 text-right">Potensi Tagihan</th>
                <th className="py-4 px-4 text-right">Pemasukan Iuran</th>
                <th className="py-4 px-4 text-right">Tunggakan</th>
                <th className="py-4 px-4 text-center">Kepatuhan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyBreakdown.map((m) => (
                <tr key={m.name} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {m.name} {selectedYear}
                  </td>

                  <td className="py-3.5 px-3 text-center font-bold text-emerald-700">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100">
                      {m.paidCount}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-center font-bold text-red-600">
                    <span className="px-2 py-0.5 rounded-full bg-red-100">
                      {m.unpaidCount}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-center font-bold text-amber-700">
                    {m.pendingCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100">
                        {m.pendingCount}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                    {formatCurrency(m.potential)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                    {formatCurrency(m.collected)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-red-600">
                    {formatCurrency(m.arrears)}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${m.compliance}%` }}
                          className="bg-emerald-500 h-full rounded-full"
                        />
                      </div>
                      <span className="font-bold text-slate-800 text-[11px] w-8">
                        {m.compliance}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
              <tr>
                <td className="py-4 px-4 font-black">TOTAL TAHUN {selectedYear}</td>
                <td className="py-4 px-3 text-center text-emerald-800">
                  {monthlyBreakdown.reduce((sum, m) => sum + m.paidCount, 0)}
                </td>
                <td className="py-4 px-3 text-center text-red-800">
                  {monthlyBreakdown.reduce((sum, m) => sum + m.unpaidCount, 0)}
                </td>
                <td className="py-4 px-3 text-center text-amber-800">
                  {monthlyBreakdown.reduce((sum, m) => sum + m.pendingCount, 0)}
                </td>
                <td className="py-4 px-4 text-right font-mono">
                  {formatCurrency(yearTotalPotential)}
                </td>
                <td className="py-4 px-4 text-right font-mono text-emerald-800 font-black">
                  {formatCurrency(yearTotalCollected)}
                </td>
                <td className="py-4 px-4 text-right font-mono text-red-800 font-black">
                  {formatCurrency(yearTotalArrears)}
                </td>
                <td className="py-4 px-4 text-center font-black">
                  {Math.round(yearAverageCompliance)}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RekapitulasiIuran;
