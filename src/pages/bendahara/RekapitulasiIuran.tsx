import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  FileSpreadsheet,
  TrendingUp,
  Download,
} from 'lucide-react';
import { PatelkiLogo } from '../../components/PatelkiLogo';
import {
  exportRekapitulasiIuranExcel,
  exportRekapitulasiIuranPDF,
  exportRekapitulasiIuranCSV,
} from '../../utils/exportFinancialReports';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const RekapitulasiIuran: React.FC = () => {
  const { members, duesRecords, settings, formatCurrency } = useApp();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  const activeMembers = members.filter(m => m.status === 'aktif');
  const activeCount = activeMembers.length;

  // Monthly stats breakdown for the selected year
  const monthlyBreakdown = MONTH_NAMES.map((name, index) => {
    const monthNum = index + 1;
    const records = duesRecords.filter(d => {
      if (d.year !== selectedYear || d.month !== monthNum) return false;
      return activeMembers.some(
        am => am.id === d.memberId || am.nap === d.memberId || d.memberId === am.id || d.memberId === am.nap
      );
    });

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
    try {
      setIsExportingExcel(true);
      exportRekapitulasiIuranExcel(
        monthlyBreakdown,
        selectedYear,
        activeCount,
        settings,
        members,
        duesRecords
      );
      setExportSuccessMessage(`✓ File Excel Rekapitulasi Iuran Tahun ${selectedYear} berhasil diunduh.`);
      setTimeout(() => setExportSuccessMessage(null), 3500);
    } catch (err) {
      console.error('Error exporting Excel:', err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleDownloadPDF = () => {
    try {
      setIsExportingPdf(true);
      exportRekapitulasiIuranPDF(
        monthlyBreakdown,
        selectedYear,
        activeCount,
        settings
      );
      setExportSuccessMessage(`✓ File PDF resmi Rekapitulasi Iuran Tahun ${selectedYear} berhasil diunduh.`);
      setTimeout(() => setExportSuccessMessage(null), 3500);
    } catch (err) {
      console.error('Error exporting PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportCSV = () => {
    try {
      exportRekapitulasiIuranCSV(monthlyBreakdown, selectedYear);
      setExportSuccessMessage(`✓ File CSV Rekapitulasi Iuran Tahun ${selectedYear} berhasil diunduh.`);
      setTimeout(() => setExportSuccessMessage(null), 3500);
    } catch (err) {
      console.error('Error exporting CSV:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification Banner for Downloads */}
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
        <div className="flex flex-wrap items-center gap-2">
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

          {/* Export Excel Button */}
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-60"
            title="Download rekapitulasi iuran format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExportingExcel ? 'Mengunduh...' : 'Export Excel'}</span>
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            title="Download rekapitulasi iuran format CSV (.csv)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          {/* Download PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-60"
            title="Download rekapitulasi iuran format PDF resmi (.pdf)"
          >
            <Download className="w-4 h-4" />
            <span>{isExportingPdf ? 'Menyiapkan...' : 'Download PDF'}</span>
          </button>

          {/* Cetak / Print PDF Button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            title="Cetak langsung dokumen ke printer atau simpan PDF melalui browser"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="no-print grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="no-print bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
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

      {/* Official Printable Report Document for window.print() / Save-as-PDF */}
      <div id="report-document" className="print-only hidden p-8 bg-white text-slate-900 font-sans">
        {/* Kop Surat Resmi */}
        <div className="border-b-4 border-double border-slate-900 pb-4 flex items-center gap-4">
          <PatelkiLogo size={70} />
          <div className="flex-1">
            <h3 className="text-xs font-bold tracking-widest text-emerald-800 uppercase">
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
            LAPORAN REKAPITULASI & KOLEKTIBILITAS IURAN ANGGOTA
          </h2>
          <p className="text-xs font-bold text-amber-700 mt-0.5 uppercase tracking-wider">
            TAHUN ANGGARAN {selectedYear} (12 BULAN)
          </p>
        </div>

        {/* Summary Info Box */}
        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
          <span><strong>Anggota Aktif:</strong> {activeCount} ATLM</span>
          <span><strong>Potensi Tagihan:</strong> {formatCurrency(yearTotalPotential)}</span>
          <span className="text-emerald-800"><strong>Iuran Terkumpul:</strong> {formatCurrency(yearTotalCollected)}</span>
          <span className="text-red-700"><strong>Tunggakan:</strong> {formatCurrency(yearTotalArrears)} ({Math.round(yearAverageCompliance)}% Kepatuhan)</span>
        </div>

        {/* Printable Table */}
        <table className="w-full text-left text-xs border border-slate-300 border-collapse mb-6">
          <thead className="bg-slate-100 font-bold text-slate-900 text-[11px]">
            <tr className="border-b border-slate-300">
              <th className="p-2 text-center border-r border-slate-300 w-10">No</th>
              <th className="p-2 border-r border-slate-300">Bulan</th>
              <th className="p-2 text-center border-r border-slate-300">Sudah Bayar</th>
              <th className="p-2 text-center border-r border-slate-300">Belum Bayar</th>
              <th className="p-2 text-center border-r border-slate-300">Verifikasi</th>
              <th className="p-2 text-right border-r border-slate-300">Potensi Tagihan</th>
              <th className="p-2 text-right border-r border-slate-300">Pemasukan Iuran</th>
              <th className="p-2 text-right border-r border-slate-300">Tunggakan</th>
              <th className="p-2 text-center">Kepatuhan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {monthlyBreakdown.map((m, idx) => (
              <tr key={m.name} className="border-b border-slate-200">
                <td className="p-2 text-center border-r border-slate-200">{idx + 1}</td>
                <td className="p-2 font-bold border-r border-slate-200">{m.name} {selectedYear}</td>
                <td className="p-2 text-center font-bold text-emerald-800 border-r border-slate-200">{m.paidCount}</td>
                <td className="p-2 text-center font-bold text-red-700 border-r border-slate-200">{m.unpaidCount}</td>
                <td className="p-2 text-center border-r border-slate-200">{m.pendingCount > 0 ? m.pendingCount : '-'}</td>
                <td className="p-2 text-right font-mono border-r border-slate-200">{formatCurrency(m.potential)}</td>
                <td className="p-2 text-right font-mono font-bold text-emerald-800 border-r border-slate-200">{formatCurrency(m.collected)}</td>
                <td className="p-2 text-right font-mono font-bold text-red-700 border-r border-slate-200">{formatCurrency(m.arrears)}</td>
                <td className="p-2 text-center font-bold">{m.compliance}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
            <tr>
              <td colSpan={2} className="p-2 text-center">TOTAL TAHUN {selectedYear}</td>
              <td className="p-2 text-center text-emerald-800">{monthlyBreakdown.reduce((s, m) => s + m.paidCount, 0)}</td>
              <td className="p-2 text-center text-red-800">{monthlyBreakdown.reduce((s, m) => s + m.unpaidCount, 0)}</td>
              <td className="p-2 text-center text-amber-800">{monthlyBreakdown.reduce((s, m) => s + m.pendingCount, 0)}</td>
              <td className="p-2 text-right font-mono">{formatCurrency(yearTotalPotential)}</td>
              <td className="p-2 text-right font-mono text-emerald-800 font-black">{formatCurrency(yearTotalCollected)}</td>
              <td className="p-2 text-right font-mono text-red-800 font-black">{formatCurrency(yearTotalArrears)}</td>
              <td className="p-2 text-center font-black">{Math.round(yearAverageCompliance)}%</td>
            </tr>
          </tfoot>
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

export default RekapitulasiIuran;
