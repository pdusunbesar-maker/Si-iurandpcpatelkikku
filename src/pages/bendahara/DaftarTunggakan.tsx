import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Member, DuesRecord } from '../../types';
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
  Download,
  FileText,
} from 'lucide-react';
import { WhatsAppModal } from '../../components/WhatsAppModal';
import { ManageArrearsModal } from '../../components/ManageArrearsModal';
import { AutoWhatsAppReminderModal } from '../../components/bendahara/AutoWhatsAppReminderModal';
import { PatelkiLogo } from '../../components/PatelkiLogo';
import {
  exportDaftarTunggakanExcel,
  exportDaftarTunggakanPDF,
  exportDaftarTunggakanCSV,
  ArrearsExportItem,
} from '../../utils/exportFinancialReports';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export const DaftarTunggakan: React.FC = () => {
  const { members, duesRecords, settings, formatCurrency } = useApp();

  const now = new Date();
  const currentCalendarYear = now.getFullYear();
  const currentCalendarMonth = now.getMonth() + 1; // 1-12
  const currentCalendarMonthName = MONTH_NAMES[now.getMonth()];
  const currentCalendarDateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all'); // 'all' (Jan 2025 - today) or '2025', '2026', etc.
  const [selectedMemberForArrears, setSelectedMemberForArrears] = useState<Member | null>(null);
  const [waModalData, setWaModalData] = useState<{
    name: string;
    phone: string;
    message: string;
  } | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [isAutoReminderOpen, setIsAutoReminderOpen] = useState(false);

  // Calculate arrears list for active members up to current running calendar month/day
  const arrearsList = members
    .filter(m => m.status === 'aktif')
    .map(member => {
      const memberRecordsMap = new Map<string, DuesRecord>();
      duesRecords.forEach(d => {
        if (d.memberId === member.id || (member.nap && d.memberId === member.nap)) {
          memberRecordsMap.set(`${d.year}-${d.month}`, d);
        }
      });

      const unpaidRecords: { year: number; month: number; amount: number }[] = [];
      let paidCount = 0;
      let totalArrears = 0;

      const startYr = selectedPeriod !== 'all' ? Number(selectedPeriod) : 2025;
      const endYr = selectedPeriod !== 'all' ? Number(selectedPeriod) : currentCalendarYear;

      for (let yr = startYr; yr <= endYr; yr++) {
        const maxMonth = (yr === currentCalendarYear) ? currentCalendarMonth : (yr > currentCalendarYear ? 0 : 12);
        for (let mo = 1; mo <= maxMonth; mo++) {
          const key = `${yr}-${mo}`;
          const rec = memberRecordsMap.get(key);

          const status = rec?.status || 'unpaid';
          const amount = rec?.amount || settings.monthlyFee;

          if (status === 'paid') {
            paidCount++;
          } else if (status === 'pending') {
            // Pending verification
          } else if (status === 'inactive') {
            // Exempted
          } else {
            // Unpaid arrears
            unpaidRecords.push({ year: yr, month: mo, amount });
            totalArrears += amount;
          }
        }
      }

      // Group unpaid months by year for clean readability e.g. "2025 (12 bln), Jan–Okt 2026 (10 bln)"
      const yearsSet = Array.from(new Set(unpaidRecords.map(u => u.year))).sort((a, b) => a - b);
      const yearSummaries = yearsSet.map(yr => {
        const yrUnpaid = unpaidRecords.filter(u => u.year === yr).sort((a, b) => a.month - b.month);
        if (yrUnpaid.length === 12) {
          return `${yr} (12 Bln Penuh)`;
        }
        if (yrUnpaid.length > 1) {
          const first = MONTH_SHORT[yrUnpaid[0].month - 1];
          const last = MONTH_SHORT[yrUnpaid[yrUnpaid.length - 1].month - 1];
          return `${first}–${last} ${yr} (${yrUnpaid.length} bln)`;
        }
        return `${MONTH_SHORT[yrUnpaid[0].month - 1]} ${yr}`;
      });

      const monthNamesStr = yearSummaries.join(', ') || 'Tidak ada';

      return {
        member,
        unpaidCount: unpaidRecords.length,
        unpaidMonthsStr: monthNamesStr,
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

  const activePeriodLabel = selectedPeriod === 'all'
    ? `Januari 2025 s.d. ${currentCalendarMonthName} ${currentCalendarYear}`
    : `Tahun ${selectedPeriod}`;

  const handleOpenWaModal = (item: any) => {
    const msg = settings.waTemplateReminder
      .replace(/\[NAMA\]/g, `${item.member.nama}, ${item.member.gelar || ''}`.trim())
      .replace(/\[NAP\]/g, item.member.nap)
      .replace(/\[TANGGAL\]/g, currentCalendarDateStr)
      .replace(/\[NOMINAL\]/g, formatCurrency(item.totalArrears))
      .replace(/\[PERIODE\]/g, item.unpaidMonthsStr);

    setWaModalData({
      name: `${item.member.nama}, ${item.member.gelar || ''}`.trim(),
      phone: item.member.noWa,
      message: msg,
    });
  };

  const handleExportExcel = () => {
    try {
      setIsExportingExcel(true);
      const exportItems: ArrearsExportItem[] = arrearsList.map((item, idx) => ({
        no: idx + 1,
        nama: item.member.nama,
        gelar: item.member.gelar,
        nap: item.member.nap,
        noWa: item.member.noWa,
        instansi: item.member.instansi,
        unpaidMonthsStr: item.unpaidMonthsStr,
        unpaidCount: item.unpaidCount,
        totalArrears: item.totalArrears,
      }));

      exportDaftarTunggakanExcel(exportItems, activePeriodLabel, settings, totalArrearsAll);
      setExportSuccessMessage('✓ File Excel laporan tunggakan berhasil diunduh ke perangkat Anda.');
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
      const exportItems: ArrearsExportItem[] = arrearsList.map((item, idx) => ({
        no: idx + 1,
        nama: item.member.nama,
        gelar: item.member.gelar,
        nap: item.member.nap,
        noWa: item.member.noWa,
        instansi: item.member.instansi,
        unpaidMonthsStr: item.unpaidMonthsStr,
        unpaidCount: item.unpaidCount,
        totalArrears: item.totalArrears,
      }));

      exportDaftarTunggakanPDF(exportItems, activePeriodLabel, settings, totalArrearsAll);
      setExportSuccessMessage('✓ File PDF resmi laporan tunggakan berhasil diunduh ke perangkat Anda.');
      setTimeout(() => setExportSuccessMessage(null), 3500);
    } catch (err) {
      console.error('Error exporting PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportCSV = () => {
    try {
      const exportItems: ArrearsExportItem[] = arrearsList.map((item, idx) => ({
        no: idx + 1,
        nama: item.member.nama,
        gelar: item.member.gelar,
        nap: item.member.nap,
        noWa: item.member.noWa,
        instansi: item.member.instansi,
        unpaidMonthsStr: item.unpaidMonthsStr,
        unpaidCount: item.unpaidCount,
        totalArrears: item.totalArrears,
      }));

      exportDaftarTunggakanCSV(exportItems, activePeriodLabel);
      setExportSuccessMessage('✓ File CSV laporan tunggakan berhasil diunduh ke perangkat Anda.');
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
              Sistem Pengawasan Tunggakan
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-black">
              {arrearsList.length} Anggota Menunggak
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-1.5">
            <span>Daftar kewajiban iuran yang belum terselesaikan.</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-bold text-[11px]">
              🗓️ Periode Aktif: {activePeriodLabel}
            </span>
          </p>
        </div>

        {/* Actions & Period Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-white border border-slate-300 rounded-xl px-3 py-1.5 shadow-xs">
            <Calendar className="w-4 h-4 text-amber-500 mr-2" />
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent outline-hidden cursor-pointer"
            >
              <option value="all">📊 Akumulasi (Jan 2025 – {currentCalendarMonthName} {currentCalendarYear})</option>
              <option value="2025">Tahun 2025 (12 Bulan)</option>
              <option value="2026">Tahun 2026 (Jan s.d. {currentCalendarMonthName})</option>
              <option value="2027">Tahun 2027</option>
              <option value="2028">Tahun 2028</option>
              <option value="2029">Tahun 2029</option>
              <option value="2030">Tahun 2030</option>
              <option value="2031">Tahun 2031</option>
            </select>
          </div>

          {/* Auto WhatsApp Reminder Trigger Button */}
          <button
            type="button"
            onClick={() => setIsAutoReminderOpen(true)}
            disabled={arrearsList.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
            title="Picu pengingat WhatsApp otomatis untuk anggota menunggak menggunakan konfigurasi pengaturan"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Picu Pengingat WA ({arrearsList.length})</span>
          </button>

          {/* Export Excel Button */}
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-60"
            title="Download laporan tunggakan format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExportingExcel ? 'Mengunduh...' : 'Export Excel'}</span>
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            title="Download laporan tunggakan format CSV (.csv)"
          >
            <FileText className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          {/* Download PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-60"
            title="Download laporan tunggakan format PDF resmi (.pdf)"
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

      {/* Summary KPI Banner */}
      <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-500 text-white p-5 rounded-2xl shadow-lg shadow-red-500/15 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-red-100 uppercase tracking-wider">
              Total Tunggakan ({selectedPeriod === 'all' ? `Jan 2025 – ${currentCalendarMonthName} ${currentCalendarYear}` : `Tahun ${selectedPeriod}`})
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
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
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
      <div className="no-print bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 text-white font-black uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Nama Anggota</th>
                <th className="py-3.5 px-4">NAP & Instansi</th>
                <th className="py-3.5 px-4">Periode Bulan Menunggak</th>
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
                    Tidak ada data tunggakan untuk periode {activePeriodLabel}. Semua anggota tertib membayar!
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
                        {item.unpaidMonthsStr}
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
            LAPORAN PENGAWASAN TUNGGAKAN IURAN ANGGOTA
          </h2>
          <p className="text-xs font-bold text-amber-700 mt-0.5 uppercase tracking-wider">
            PERIODE: {activePeriodLabel}
          </p>
        </div>

        {/* Summary Info Box */}
        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
          <span><strong>Total Anggota Menunggak:</strong> {arrearsList.length} Orang</span>
          <span><strong>Tarif Iuran:</strong> {formatCurrency(settings.monthlyFee)} / bln</span>
          <span className="text-red-700"><strong>Total Nominal Tunggakan:</strong> {formatCurrency(totalArrearsAll)}</span>
        </div>

        {/* Printable Table */}
        <table className="w-full text-left text-xs border border-slate-300 border-collapse mb-6">
          <thead className="bg-slate-100 font-bold text-slate-900 text-[11px]">
            <tr className="border-b border-slate-300">
              <th className="p-2 text-center border-r border-slate-300 w-10">No</th>
              <th className="p-2 border-r border-slate-300">Nama Anggota</th>
              <th className="p-2 border-r border-slate-300 text-center">NAP</th>
              <th className="p-2 border-r border-slate-300">Instansi / Unit Kerja</th>
              <th className="p-2 border-r border-slate-300">Periode Menunggak</th>
              <th className="p-2 text-center border-r border-slate-300 w-16">Jml</th>
              <th className="p-2 text-right">Total Tunggakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {arrearsList.map((item, idx) => (
              <tr key={item.member.id} className="border-b border-slate-200">
                <td className="p-2 text-center border-r border-slate-200">{idx + 1}</td>
                <td className="p-2 font-bold border-r border-slate-200">
                  {item.member.nama}{item.member.gelar ? ', ' + item.member.gelar : ''}
                </td>
                <td className="p-2 font-mono text-center border-r border-slate-200">{item.member.nap}</td>
                <td className="p-2 border-r border-slate-200">{item.member.instansi}</td>
                <td className="p-2 text-[11px] border-r border-slate-200">{item.unpaidMonthsStr}</td>
                <td className="p-2 text-center border-r border-slate-200">{item.unpaidCount} Bln</td>
                <td className="p-2 text-right font-mono font-bold text-red-700">{formatCurrency(item.totalArrears)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
            <tr>
              <td colSpan={3} className="p-2 text-center">TOTAL KESELURUHAN</td>
              <td className="p-2">{arrearsList.length} Anggota</td>
              <td className="p-2"></td>
              <td className="p-2 text-center">{arrearsList.reduce((s, i) => s + i.unpaidCount, 0)} Bln</td>
              <td className="p-2 text-right font-mono text-red-700 font-black">{formatCurrency(totalArrearsAll)}</td>
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
            <p>Sukadana, {currentCalendarDateStr}</p>
            <p>Dibuat Oleh,</p>
            <p className="font-bold">Bendahara DPC PATELKI Kayong Utara</p>
            <div className="h-16"></div>
            <p className="font-black underline">{settings.bendaharaName || '( ..................................................... )'}</p>
            <p className="text-[10px] text-slate-500 font-mono">NAP: {settings.bendaharaNap || '-'}</p>
          </div>
        </div>
      </div>

      {/* Arrears Management Modal */}
      {selectedMemberForArrears && (
        <ManageArrearsModal
          member={selectedMemberForArrears}
          isOpen={true}
          defaultYear={selectedPeriod === 'all' ? currentCalendarYear : Number(selectedPeriod)}
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

      {/* Automated WhatsApp Reminder Modal (Configured via Settings) */}
      {isAutoReminderOpen && (
        <AutoWhatsAppReminderModal
          isOpen={true}
          onClose={() => setIsAutoReminderOpen(false)}
          defaultPeriodYear={selectedPeriod === 'all' ? undefined : Number(selectedPeriod)}
        />
      )}
    </div>
  );
};

export default DaftarTunggakan;
